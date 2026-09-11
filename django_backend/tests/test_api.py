from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.authentication.models import AdminUser
from apps.projects.models import Project
from apps.blog.models import BlogPost
from apps.media_assets.models import Video, Testimonial
from apps.leads.models import ContactSubmission, NewsletterSubscriber
from apps.clients.models import Client, ClientProject, Proposal, ProposalVersion, ChangeOrder
from apps.core.models import SiteSetting

class BanglasketchAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin User
        self.admin = AdminUser(
            email="admin@banglasketch.com",
            display_name="Studio Director",
            role="owner",
            active=True,
            token_version=1,
        )
        self.admin.set_password("SecurePassword123!")
        self.admin.save()

        # Create Sample Projects
        self.proj1 = Project.objects.create(
            title="Gulshan Luxury Penthouse",
            slug="gulshan-luxury-penthouse",
            description="Complete interior renovation of duplex penthouse in Gulshan 2.",
            category="Residential",
            featured=True,
            published=True,
        )
        self.proj2 = Project.objects.create(
            title="Banani Tech Hub",
            slug="banani-tech-hub",
            description="Modern corporate office interior with biophilic elements.",
            category="Commercial",
            featured=False,
            published=True,
        )

        # Create Sample Blog Post
        self.post = BlogPost.objects.create(
            title="Top Interior Design Trends in Dhaka 2026",
            slug="top-interior-design-trends-dhaka-2026",
            excerpt="Discover the materials and palettes redefining luxury Dhaka homes.",
            content="Modern minimalism blended with heritage Bengali craftsmanship...",
            category="Design Trends",
            published=True,
            published_date=timezone.now(),
        )

        # Create Sample Video & Testimonial
        self.video = Video.objects.create(
            title="Studio Tour & Design Process",
            youtube_url="https://youtube.com/watch?v=sample123",
            published=True,
        )
        self.testimonial = Testimonial.objects.create(
            client_name="Farhan Chowdhury",
            client_location="Gulshan, Dhaka",
            quote="Bangla Sketch completely transformed our home beyond our expectations.",
            rating=5,
            featured=True,
        )

        # Create Client & Portal Data
        self.portal_client = Client.objects.create(
            name="Naveed Rahman",
            phone="+8801711223344",
            email="naveed@example.com",
            portal_token="test_portal_token_abcdef1234567890",
        )
        self.client_proj = ClientProject.objects.create(
            client=self.portal_client,
            title="Baridhara Residence Interior",
            stage="consultation",
            agreed_budget=3500000.00,
        )
        self.proposal = Proposal.objects.create(
            project=self.client_proj,
            title="Full Architecture & Interior Scheme",
            status="sent",
        )
        self.proposal_version = ProposalVersion.objects.create(
            proposal=self.proposal,
            version=1,
            scope_summary="Turnkey execution of drawing, dining, and 4 bedrooms.",
            proposed_cost=3500000.00,
            timeline_days=90,
        )

    # 1. Health Checks
    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get("status"), "ok")

    # 2. Public Projects List & Detail
    def test_public_projects_list_and_envelope(self):
        res = self.client.get("/api/projects")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertIn("data", res.data)
        self.assertIn("pagination", res.data)
        self.assertEqual(len(res.data["data"]), 2)

    def test_public_projects_filter_and_search(self):
        res = self.client.get("/api/projects?category=Commercial")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 1)
        self.assertEqual(res.data["data"][0]["slug"], "banani-tech-hub")

        res_search = self.client.get("/api/projects?search=Gulshan")
        self.assertEqual(res_search.status_code, 200)
        self.assertEqual(len(res_search.data["data"]), 1)
        self.assertEqual(res_search.data["data"][0]["slug"], "gulshan-luxury-penthouse")

    def test_public_project_detail(self):
        res = self.client.get(f"/api/projects/{self.proj1.slug}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(res.data["data"]["title"], "Gulshan Luxury Penthouse")

    # 3. Public Blog List & View Increment
    def test_public_blog(self):
        res = self.client.get("/api/blog")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(len(res.data["data"]), 1)

        detail_res = self.client.get(f"/api/blog/{self.post.slug}")
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.data["data"]["views_count"], 1)

    # 4. Public Videos & Testimonials
    def test_public_videos_and_testimonials(self):
        res_v = self.client.get("/api/videos")
        self.assertEqual(res_v.status_code, 200)
        self.assertEqual(len(res_v.data["data"]), 1)

        res_t = self.client.get("/api/testimonials")
        self.assertEqual(res_t.status_code, 200)
        self.assertEqual(len(res_t.data["data"]), 1)

    # 5. Lead Submissions (Contact & Newsletter)
    def test_contact_submission(self):
        res = self.client.post("/api/contact", {
            "name": "Tanvir Hasan",
            "email": "tanvir@example.com",
            "phone": "+8801812345678",
            "service_type": "Interior Design",
            "message": "Looking for interior design services for our new flat in Dhanmondi.",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data.get("success"))
        self.assertTrue(ContactSubmission.objects.filter(email="tanvir@example.com").exists())

    def test_newsletter_subscription(self):
        res = self.client.post("/api/newsletter", {
            "email": "designfan@example.com",
        }, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertTrue(NewsletterSubscriber.objects.filter(email="designfan@example.com").exists())

    # 6. Client Portal Access & Decision
    def test_portal_access_and_decision(self):
        res = self.client.get(f"/api/portal/{self.portal_client.portal_token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(res.data["data"]["client"]["name"], "Naveed Rahman")
        self.assertEqual(len(res.data["data"]["projects"]), 1)
        self.assertEqual(len(res.data["data"]["projects"][0]["proposals"]), 1)

        # Decision
        dec_res = self.client.post(
            f"/api/portal/{self.portal_client.portal_token}/proposals/{self.proposal.id}/decision",
            {"decision": "approved", "notes": "Looks great, let's proceed with execution."},
            format="json",
        )
        self.assertEqual(dec_res.status_code, 200)
        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.status, "approved")

    # 7. Admin Authentication Flow
    def test_admin_auth_and_crud(self):
        # Failed login
        fail_res = self.client.post("/api/admin/login", {
            "email": "admin@banglasketch.com",
            "password": "WrongPassword",
        }, format="json")
        self.assertEqual(fail_res.status_code, 401)

        # Successful login
        login_res = self.client.post("/api/admin/login", {
            "email": "admin@banglasketch.com",
            "password": "SecurePassword123!",
        }, format="json")
        self.assertEqual(login_res.status_code, 200)
        token = login_res.data.get("token")
        self.assertIsNotNone(token)

        # Authenticated verify
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        verify_res = self.client.get("/api/admin/verify")
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.data["user"]["email"], "admin@banglasketch.com")

        # Dashboard Stats
        stats_res = self.client.get("/api/admin/dashboard-stats")
        self.assertEqual(stats_res.status_code, 200)
        self.assertEqual(stats_res.data["data"]["projects_count"], 2)

        # Admin Project CRUD
        create_res = self.client.post("/api/admin/projects/", {
            "title": "Bashundhara Duplex Villa",
            "slug": "bashundhara-duplex-villa",
            "description": "Luxurious 5000 sqft duplex interior.",
            "category": "Residential",
            "featured": True,
            "published": True,
        }, format="json")
        self.assertEqual(create_res.status_code, 201)
        new_id = create_res.data["data"]["id"]

        update_res = self.client.put(f"/api/admin/projects/{new_id}", {
            "title": "Bashundhara Duplex Villa (Updated)",
        }, format="json")
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.data["data"]["title"], "Bashundhara Duplex Villa (Updated)")

        delete_res = self.client.delete(f"/api/admin/projects/{new_id}")
        self.assertEqual(delete_res.status_code, 200)
        self.assertTrue(Project.objects.get(id=new_id).deleted_at is not None)

        # Trash List
        trash_res = self.client.get("/api/admin/projects?trash=true")
        self.assertEqual(trash_res.status_code, 200)
        self.assertEqual(len(trash_res.data["data"]), 1)
        self.assertEqual(trash_res.data["data"][0]["id"], new_id)

        # Restore from Trash
        restore_res = self.client.post(f"/api/admin/restore/projects/{new_id}", {}, format="json")
        self.assertEqual(restore_res.status_code, 200)
        self.assertIsNone(Project.objects.get(id=new_id).deleted_at)

        # Re-delete and Permanent Delete
        self.client.delete(f"/api/admin/projects/{new_id}")
        perm_res = self.client.delete(f"/api/admin/trash/projects/{new_id}")
        self.assertEqual(perm_res.status_code, 200)
        self.assertFalse(Project.objects.filter(id=new_id).exists())

        # Admin Settings
        settings_res = self.client.put("/api/admin/settings", {
            "studio_phone": "+8801700000000",
            "maintenance_mode": "false",
        }, format="json")
        self.assertEqual(settings_res.status_code, 200)
        self.assertEqual(settings_res.data["data"]["studio_phone"], "+8801700000000")

        # All image uploads now go through server-side validation.
        sign_res = self.client.get("/api/admin/cloudinary-sign?folder=projects")
        self.assertEqual(sign_res.status_code, 410)
        self.assertNotIn("signature", sign_res.data)

    # 8. Password Reset Flow (OTP request and verification)
    def test_admin_password_reset_flow(self):
        import hashlib
        from apps.authentication.models import AdminPasswordReset

        # Request OTP
        req_res = self.client.post("/api/admin/request-reset-otp", {
            "email": "admin@banglasketch.com",
        }, format="json")
        self.assertEqual(req_res.status_code, 200)
        self.assertTrue(req_res.data.get("success"))
        self.assertIn("maskedEmail", req_res.data)

        # Create known reset OTP in test database
        test_otp = "837417"
        otp_hash = hashlib.sha256(test_otp.encode("utf-8")).hexdigest()
        AdminPasswordReset.objects.create(
            email="admin@banglasketch.com",
            otp_hash=otp_hash,
            expires_at=timezone.now() + timezone.timedelta(minutes=15),
            ip_address="127.0.0.1",
        )

        # Test verification with email
        verify_res = self.client.post("/api/admin/verify-reset-otp", {
            "email": "admin@banglasketch.com",
            "otp": test_otp,
            "newPassword": "ResetMasterPassword2026!",
        }, format="json")
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.data.get("success"))

        # Verify password changed
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password("ResetMasterPassword2026!"))

        # Login with new password
        login_res = self.client.post("/api/admin/login", {
            "email": "admin@banglasketch.com",
            "password": "ResetMasterPassword2026!",
        }, format="json")
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.data.get("success"))
