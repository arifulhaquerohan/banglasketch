import time
import datetime
from django.test import TestCase
from django.utils import timezone
from django.core import mail
from django.core.management import call_command
from rest_framework.test import APIClient
from apps.leads.models import ContactSubmission, ContactEmailJob
from apps.leads.services.email import process_email_job
from apps.blog.models import BlogPost

class EmailJobsAndScheduledTasksTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    # 1. Contact Form Atomic Job Creation
    def test_contact_submission_atomic_jobs(self):
        res = self.client.post("/api/contact", {
            "name": "Mahmudul Hasan",
            "email": "mahmudul@example.com",
            "phone": "+8801819998877",
            "service_type": "Architecture Consultation",
            "message": "We would like to consult on a 4000 sqft residential development in Uttara.",
            "started_at": time.time() * 1000 - 5000, # 5 seconds ago (human behavior)
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["success"])
        submission_id = res.data["id"]

        submission = ContactSubmission.objects.get(pk=submission_id)
        self.assertEqual(submission.name, "Mahmudul Hasan")

        # Verify both notification and confirmation jobs were created
        jobs = ContactEmailJob.objects.filter(submission=submission)
        self.assertEqual(jobs.count(), 2)

        kinds = set(jobs.values_list("kind", flat=True))
        self.assertEqual(kinds, {"notification", "confirmation"})

    # 2. Honeypot Spam Trapping
    def test_contact_honeypot_trapping(self):
        initial_subs = ContactSubmission.objects.count()
        initial_jobs = ContactEmailJob.objects.count()

        res = self.client.post("/api/contact", {
            "name": "Spam Bot",
            "email": "spambot@example.com",
            "message": "Buy cheap watches at our site",
            "website": "http://spam-link.com", # honeypot filled
        })
        # Returns 201 to not alert the bot
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["success"])

        # No records created in DB
        self.assertEqual(ContactSubmission.objects.count(), initial_subs)
        self.assertEqual(ContactEmailJob.objects.count(), initial_jobs)

    # 3. Email Worker Job Processing
    def test_email_worker_processing(self):
        submission = ContactSubmission.objects.create(
            name="Ayesha Siddiqua",
            email="ayesha@example.com",
            service_type="Interior Design",
            message="Looking for bespoke duplex interior design.",
        )
        job_notif = ContactEmailJob.objects.create(submission=submission, kind="notification")
        job_conf = ContactEmailJob.objects.create(submission=submission, kind="confirmation")

        # Clear outbox
        mail.outbox = []

        # Run worker once
        call_command("run_email_worker", once=True)

        # Check jobs were marked delivered
        job_notif.refresh_from_db()
        job_conf.refresh_from_db()

        self.assertIsNotNone(job_notif.delivered_at)
        self.assertEqual(job_notif.attempts, 1)

        self.assertIsNotNone(job_conf.delivered_at)
        self.assertEqual(job_conf.attempts, 1)

        # Check emails were dispatched to outbox
        self.assertEqual(len(mail.outbox), 2)
        recipients = [m.to[0] for m in mail.outbox]
        self.assertIn("ayesha@example.com", recipients)

    # 4. Scheduled Blog Post Publishing & Cleanup
    def test_scheduled_blog_publishing(self):
        past_time = timezone.now() - datetime.timedelta(minutes=10)
        post = BlogPost.objects.create(
            title="Future Architecture in Bangladesh",
            slug="future-architecture-bangladesh",
            excerpt="Insights on climate-resilient architecture in Dhaka.",
            content="Detailed analysis...",
            scheduled_publish_date=past_time,
            published=False,
        )

        self.assertFalse(post.published)

        # Run scheduled jobs command
        call_command("run_jobs", once=True)

        post.refresh_from_db()
        self.assertTrue(post.published)
        self.assertIsNone(post.scheduled_publish_date)
        self.assertIsNotNone(post.published_date)
