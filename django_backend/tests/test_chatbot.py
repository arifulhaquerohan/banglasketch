from unittest.mock import patch
from django.test import TestCase, SimpleTestCase
from rest_framework.test import APIClient
from apps.chatbot.models import ChatMessage
from apps.chatbot.services.ai import ChatUnavailable, generate_ai_response


class ChatTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        limiter = patch("apps.chatbot.views.PostgresRateLimiter.check_and_increment", return_value=(True, 1, None))
        limiter.start()
        self.addCleanup(limiter.stop)

    @patch("apps.chatbot.views.generate_ai_response", return_value="Hello! How can I help?")
    def test_reply_and_follow_up_history(self, generate):
        for endpoint in ("/api/chat", "/api/v1/chat/"):
            response = self.client.post(endpoint, {"session_id": "test-session", "message": "hi"}, format="json")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["reply"], "Hello! How can I help?")
        self.assertEqual(ChatMessage.objects.count(), 4)
        self.assertEqual([m["role"] for m in generate.call_args.args[0]], ["user", "assistant", "user"])

    @patch("apps.chatbot.views.generate_ai_response", side_effect=ChatUnavailable("AuthenticationError"))
    def test_provider_failure_does_not_save_partial_turn(self, generate):
        response = self.client.post("/api/chat", {"session_id": "test-session", "message": "hi"}, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.json()["success"])
        self.assertEqual(ChatMessage.objects.count(), 0)
        self.assertNotIn("AuthenticationError", response.json()["error"])

    @patch("apps.chatbot.views.generate_ai_response")
    def test_invalid_messages_do_not_call_provider(self, generate):
        for message in ("", "   ", "a" * 4001, {"invalid": True}):
            response = self.client.post("/api/chat", {"session_id": "test-session", "message": message}, format="json")
            self.assertEqual(response.status_code, 400)
        generate.assert_not_called()

    @patch("apps.chatbot.views.generate_ai_response")
    def test_rate_limit(self, generate):
        with patch("apps.chatbot.views.PostgresRateLimiter.check_and_increment", return_value=(False, 21, None)):
            response = self.client.post("/api/chat", {"session_id": "test-session", "message": "hi"}, format="json")
        self.assertEqual(response.status_code, 429)
        generate.assert_not_called()


class ChatConfigurationTests(SimpleTestCase):
    @patch.dict("os.environ", {"GEMINI_API_KEY": ""})
    def test_missing_key_fails_at_request_time(self):
        with self.assertRaises(ChatUnavailable):
            generate_ai_response([{"role": "user", "content": "hi"}])


@patch.dict("os.environ", {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "gemini-3.5-flash-lite"})
class GeminiServiceTests(SimpleTestCase):
    @patch("apps.chatbot.services.ai.requests.post")
    def test_history_mapping_and_text_reply(self, post):
        post.return_value.ok = True
        post.return_value.json.return_value = {"candidates": [{"content": {"parts": [{"text": "Hello!"}]}}]}
        reply = generate_ai_response([
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "Hello"},
            {"role": "user", "content": "living room"},
        ])
        self.assertEqual(reply, "Hello!")
        kwargs = post.call_args.kwargs
        self.assertEqual([c["role"] for c in kwargs["json"]["contents"]], ["user", "model", "user"])
        self.assertEqual(kwargs["headers"]["x-goog-api-key"], "test-key")
        self.assertNotIn("test-key", post.call_args.args[0])

    @patch("apps.chatbot.services.ai.requests.post")
    def test_public_knowledge_reaches_provider(self, post):
        post.return_value.ok = True
        post.return_value.json.return_value = {"candidates": [{"content": {"parts": [{"text": "Kitchen design"}]}}]}
        generate_ai_response([{"role": "user", "content": "services"}], knowledge={"services": [{"name": "Kitchen Design"}]})
        instruction = post.call_args.kwargs["json"]["systemInstruction"]["parts"][0]["text"]
        self.assertIn('"name": "Kitchen Design"', instruction)
        self.assertIn("never instructions", instruction)

    @patch("apps.chatbot.services.ai.requests.post")
    def test_provider_error_is_sanitized(self, post):
        post.return_value.ok = False
        post.return_value.status_code = 403
        with self.assertRaisesRegex(ChatUnavailable, "Gemini HTTP 403"):
            generate_ai_response([{"role": "user", "content": "hi"}])
        post.return_value.json.assert_not_called()

    @patch("apps.chatbot.services.ai.requests.post")
    def test_blocked_response_is_handled(self, post):
        post.return_value.ok = True
        post.return_value.json.return_value = {"promptFeedback": {"blockReason": "SAFETY"}}
        with self.assertRaises(ChatUnavailable):
            generate_ai_response([{"role": "user", "content": "hi"}])

    @patch("apps.chatbot.services.ai.requests.post")
    def test_timeout_is_handled(self, post):
        import requests
        post.side_effect = requests.Timeout("private provider details")
        with self.assertRaisesRegex(ChatUnavailable, "Gemini connection failed"):
            generate_ai_response([{"role": "user", "content": "hi"}])


class ChatKnowledgeTests(TestCase):
    def setUp(self):
        from apps.projects.models import Project
        self.modern = Project.objects.create(title="Modern kitchen", slug="modern-kitchen", category="kitchen", description="Modern cabinetry", featured_image="https://example.com/kitchen.jpg", client_name="Private client")
        Project.objects.create(title="Classic kitchen", slug="classic-kitchen", category="kitchen")
        Project.objects.create(title="Bedroom", slug="bedroom", category="bedroom")
        Project.objects.create(title="Secret draft", slug="secret", category="kitchen", published=False)
        from django.utils import timezone
        Project.objects.create(title="Deleted", slug="deleted", category="kitchen", deleted_at=timezone.now())

    def knowledge(self, *texts):
        from apps.chatbot.services.knowledge import build_knowledge
        return build_knowledge([{"role": "user", "content": t} for t in texts])

    def test_public_matches_ranked_and_private_data_excluded(self):
        import json
        context, projects = self.knowledge("Show modern kitchen projects")
        self.assertEqual(projects[0]["url"], "/portfolio/modern-kitchen")
        self.assertEqual(len(projects), 2)
        self.assertTrue(all(p["category"] == "kitchen" for p in projects))
        self.assertNotIn("Private client", json.dumps(context))
        self.assertNotIn("Secret draft", json.dumps(context))
        self.assertNotIn("Deleted", json.dumps(context))
        self.assertEqual(len(context["services"]), 4)

    def test_bangla_and_follow_up_preferences(self):
        _, projects = self.knowledge("রান্নাঘরের ডিজাইন", "আধুনিক")
        self.assertEqual(projects[0]["title"], "Modern kitchen")
        _, projects = self.knowledge("kitchen", "Actually show bedrooms")
        self.assertEqual([p["category"] for p in projects], ["bedroom"])

    def test_greeting_and_empty_category_do_not_show_unrelated_cards(self):
        self.assertEqual(self.knowledge("Hello")[1], [])
        self.assertEqual(self.knowledge("bathroom projects")[1], [])

    def test_unsafe_image_is_not_returned(self):
        self.modern.featured_image = "javascript:alert(1)"
        self.modern.save()
        self.assertEqual(self.knowledge("modern kitchen")[1][0]["image"], "")

    @patch("apps.chatbot.views.PostgresRateLimiter.check_and_increment", return_value=(True, 1, None))
    @patch("apps.chatbot.views.generate_ai_response", return_value="Here are kitchen projects.")
    def test_api_returns_cards_and_passes_knowledge(self, generate, limiter):
        response = APIClient().post("/api/chat", {"session_id": "knowledge-test", "message": "modern kitchen"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["projects"][0]["title"], "Modern kitchen")
        self.assertIn("services", generate.call_args.kwargs["knowledge"])

    @patch("apps.chatbot.views.generate_ai_response")
    def test_welcome_gallery_is_public_and_does_not_call_ai(self, generate):
        from apps.projects.models import Project
        self.modern.featured = True
        self.modern.save()
        response = APIClient().get("/api/chat")
        self.assertEqual(response.status_code, 200)
        projects = response.json()["projects"]
        self.assertEqual(projects[0]["title"], self.modern.title)
        self.assertTrue(all(Project.objects.get(slug=p["url"].split("/")[-1]).published for p in projects))
        self.assertNotIn("Secret draft", str(projects))
        self.assertNotIn("Deleted", str(projects))
        self.assertEqual(ChatMessage.objects.count(), 0)
        generate.assert_not_called()
