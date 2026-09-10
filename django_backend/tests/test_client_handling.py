import datetime
import secrets
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.authentication.models import AdminUser
from apps.authentication.auth import generate_jwt_token
from apps.clients.models import (
    Client,
    Enquiry,
    EnquiryFollowUp,
    ClientProject,
    Proposal,
    ProposalVersion,
    ChangeOrder,
)


class ClientHandlingAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin User & JWT Token
        self.admin = AdminUser(
            email="manager@banglasketch.com",
            display_name="Operations Manager",
            role="owner",
            active=True,
            token_version=1,
        )
        self.admin.set_password("AdminPass123!")
        self.admin.save()
        self.token = generate_jwt_token(self.admin)
        self.auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_public_enquiry_submission(self):
        # 1. Valid enquiry submission
        res = self.client.post("/api/enquiries/", {
            "name": "Sarah Khan",
            "phone": "+8801700112233",
            "email": "sarah@example.com",
            "project_location": "Dhanmondi, Dhaka",
            "property_type": "Duplex Apartment",
            "service_scope": "Full Interior Renovation",
            "approx_budget": "50,00,000 BDT",
            "started_at": (timezone.now() - datetime.timedelta(seconds=5)).timestamp() * 1000,
        }, format="json")

        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["success"])
        enquiry_id = data["data"]["id"]

        enquiry = Enquiry.objects.get(pk=enquiry_id)
        self.assertEqual(enquiry.name, "Sarah Khan")
        self.assertEqual(enquiry.status, "new_enquiry")
        self.assertIsNotNone(enquiry.client)
        self.assertEqual(enquiry.client.phone, "+8801700112233")
        self.assertIsNotNone(enquiry.client.portal_token)
        self.assertEqual(enquiry.next_action, "Initial call & qualification")

        # Confirm initial follow-up note was generated
        follow_ups = EnquiryFollowUp.objects.filter(enquiry=enquiry)
        self.assertEqual(follow_ups.count(), 1)
        self.assertIn("website intake form", follow_ups.first().summary)

        # 2. Repeated submission with same phone attaches to same Client
        res2 = self.client.post("/api/enquiries/", {
            "name": "Sarah Khan",
            "phone": "+8801700112233",
            "project_location": "Gulshan Office",
            "started_at": (timezone.now() - datetime.timedelta(seconds=5)).timestamp() * 1000,
        }, format="json")
        self.assertEqual(res2.status_code, 201)
        self.assertEqual(res2.json()["data"]["clientId"], enquiry.client.id)

        # 3. Honeypot spam field silently succeeds
        spam_res = self.client.post("/api/enquiries/", {
            "name": "Bot Spammer",
            "phone": "+123456789",
            "website": "http://spam.xyz",
        }, format="json")
        self.assertEqual(spam_res.status_code, 201)
        self.assertFalse(Enquiry.objects.filter(name="Bot Spammer").exists())

        # 4. Quick submit bot trap
        fast_res = self.client.post("/api/enquiries/", {
            "name": "Fast Bot",
            "phone": "+8801799999999",
            "project_location": "Dhaka",
            "started_at": timezone.now().timestamp() * 1000,  # 0ms difference
        }, format="json")
        self.assertEqual(fast_res.status_code, 400)
        self.assertFalse(fast_res.json()["success"])

    def test_public_client_portal(self):
        token = secrets.token_hex(24)
        client = Client.objects.create(
            name="Zubair Ahmed",
            phone="+8801811223344",
            email="zubair@example.com",
            portal_token=token,
        )

        project = ClientProject.objects.create(
            client=client,
            title="Banani Duplex Interior",
            stage="in_progress",
            current_milestone="3D Visualization & Material Approval",
            agreed_budget=3500000,
        )

        proposal = Proposal.objects.create(
            project=project,
            title="Comprehensive Design & Turnkey Execution",
            status="sent",
        )
        ProposalVersion.objects.create(
            proposal=proposal,
            version=1,
            scope_summary="Architectural layout, MEP, ceiling and woodwork",
            proposed_cost=3500000,
            timeline_days=90,
        )

        co = ChangeOrder.objects.create(
            project=project,
            title="Imported Italian Marble Upgrade",
            description="Upgraded master bath tiling to Carrara marble",
            proposed_cost=150000,
            timeline_impact_days=5,
            status="pending_approval",
        )

        # Fetch Portal Data
        res = self.client.get(f"/api/portal/{token}/")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["client"]["name"], "Zubair Ahmed")
        self.assertIsNotNone(body["data"]["client"]["memberSince"])

        projects = body["data"]["projects"]
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]["title"], "Banani Duplex Interior")
        self.assertEqual(len(projects[0]["proposals"]), 1)
        self.assertEqual(projects[0]["proposals"][0]["versions"][0]["proposed_cost"], "3500000.00")
        self.assertEqual(len(projects[0]["changeOrders"]), 1)
        self.assertEqual(projects[0]["changeOrders"][0]["title"], "Imported Italian Marble Upgrade")

        # Test Portal Proposal Decision
        prop_decision_res = self.client.post(
            f"/api/portal/{token}/proposals/{proposal.id}/decision/",
            {"decision": "approved", "version": 1, "notes": "Approved without changes"},
            format="json",
        )
        self.assertEqual(prop_decision_res.status_code, 200)
        proposal.refresh_from_db()
        self.assertEqual(proposal.status, "approved")

        # Test Portal Change Order Decision
        co_decision_res = self.client.post(
            f"/api/portal/{token}/change-orders/{co.id}/decision/",
            {"decision": "approved", "notes": "Client signed marble variation order"},
            format="json",
        )
        self.assertEqual(co_decision_res.status_code, 200)
        co.refresh_from_db()
        self.assertEqual(co.status, "approved")

    def test_admin_client_handling_dashboard_and_pipeline(self):
        client = Client.objects.create(
            name="Tanvir Hossain",
            phone="+8801911223344",
            portal_token=secrets.token_hex(24),
        )
        now = timezone.now()
        overdue_date = now - datetime.timedelta(days=2)

        # Create overdue enquiry
        Enquiry.objects.create(
            client=client,
            name="Tanvir Hossain",
            phone="+8801911223344",
            project_location="Bashundhara R/A",
            status="consultation",
            next_action="Follow up regarding revised floor plan",
            next_follow_up_date=overdue_date,
            assigned_to=self.admin,
        )

        # Create active project with pending change order
        cp = ClientProject.objects.create(
            client=client,
            title="Bashundhara Residence",
            stage="active_project",
            agreed_budget=2000000,
        )
        ChangeOrder.objects.create(
            project=cp,
            title="Custom False Ceiling Lighting",
            proposed_cost=75000,
            status="pending_approval",
        )

        # 1. Test Admin Dashboard stats
        res = self.client.get("/api/admin/client-handling/dashboard/", **self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertIn("needsAttention", data)
        self.assertGreaterEqual(data["needsAttention"]["counts"]["overdue"], 1)
        self.assertGreaterEqual(data["needsAttention"]["counts"]["pendingApprovals"], 1)
        self.assertIn("pipeline", data)
        self.assertGreaterEqual(data["activeProjectsCount"], 1)

        # 2. Test Admin Pipeline view
        pipeline_res = self.client.get("/api/admin/enquiries/pipeline/", **self.auth_headers)
        self.assertEqual(pipeline_res.status_code, 200)
        pipe_data = pipeline_res.json()["data"]
        self.assertIn("stages", pipe_data)
        self.assertIn("columns", pipe_data)
        self.assertIn("consultation", pipe_data["columns"])
        self.assertEqual(len(pipe_data["columns"]["consultation"]), 1)
        self.assertTrue(pipe_data["columns"]["consultation"][0]["is_overdue"])

    def test_admin_enquiry_lifecycle_and_conversion(self):
        # 1. Create enquiry via Admin
        create_res = self.client.post("/api/admin/enquiries/", {
            "name": "Dr. Rafiqul Islam",
            "phone": "+8801755667788",
            "email": "dr.rafiq@example.com",
            "project_location": "Uttara Sector 4",
            "property_type": "Commercial Clinic",
            "service_scope": "Full Interior & Layout",
            "status": "new_enquiry",
        }, format="json", **self.auth_headers)
        self.assertEqual(create_res.status_code, 201)
        enquiry_id = create_res.json()["data"]["id"]

        # 2. Get detail with composite followUps
        detail_res = self.client.get(f"/api/admin/enquiries/{enquiry_id}/", **self.auth_headers)
        self.assertEqual(detail_res.status_code, 200)
        body = detail_res.json()["data"]
        self.assertIn("enquiry", body)
        self.assertIn("followUps", body)

        # 3. Add follow-up note
        fu_res = self.client.post(f"/api/admin/enquiries/{enquiry_id}/follow-ups/", {
            "channel": "call",
            "summary": "Discussed initial clinic blueprint and patient flow requirements",
            "next_action": "Conduct site inspection on Saturday",
            "scheduled_at": (timezone.now() + datetime.timedelta(days=3)).isoformat(),
        }, format="json", **self.auth_headers)
        self.assertEqual(fu_res.status_code, 201)

        # 4. Patch enquiry stage and check automatic note creation
        patch_res = self.client.patch(f"/api/admin/enquiries/{enquiry_id}/", {
            "status": "site_visit",
            "status_reason": "Client confirmed weekend schedule",
        }, format="json", **self.auth_headers)
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["data"]["status"], "site_visit")

        # 5. Convert enquiry to Client Project
        convert_res = self.client.post(f"/api/admin/enquiries/{enquiry_id}/convert-to-project/", {
            "title": "Dr. Rafiq's Dental Clinic Interior",
            "agreed_budget": 1800000,
        }, format="json", **self.auth_headers)
        self.assertEqual(convert_res.status_code, 201)
        project_id = convert_res.json()["data"]["id"]
        self.assertEqual(convert_res.json()["data"]["title"], "Dr. Rafiq's Dental Clinic Interior")

        # Check idempotency of convert-to-project
        idempotent_res = self.client.post(f"/api/admin/enquiries/{enquiry_id}/convert-to-project/", {}, format="json", **self.auth_headers)
        self.assertEqual(idempotent_res.status_code, 200)
        self.assertEqual(idempotent_res.json()["data"]["id"], project_id)

        # 6. Check Project detail composite data
        proj_detail_res = self.client.get(f"/api/admin/client-projects/{project_id}/", **self.auth_headers)
        self.assertEqual(proj_detail_res.status_code, 200)
        p_body = proj_detail_res.json()["data"]
        self.assertIn("project", p_body)
        self.assertIn("proposals", p_body)
        self.assertIn("changeOrders", p_body)

        # 7. Create Proposal and Version
        prop_res = self.client.post(f"/api/admin/client-projects/{project_id}/proposals/", {
            "title": "Clinic Fit-Out Proposal v1",
            "scope_summary": "Sterilization room, consultation rooms, reception",
            "proposed_cost": 1800000,
            "timeline_days": 45,
        }, format="json", **self.auth_headers)
        self.assertEqual(prop_res.status_code, 201)
        proposal_id = prop_res.json()["data"]["id"]

        # 8. Create Revision Version 2
        v2_res = self.client.post(f"/api/admin/proposals/{proposal_id}/versions/", {
            "scope_summary": "Added specialized lead-lined X-ray partitioning",
            "proposed_cost": 1950000,
            "timeline_days": 50,
        }, format="json", **self.auth_headers)
        self.assertEqual(v2_res.status_code, 201)
        self.assertEqual(v2_res.json()["data"]["version"], 2)

        # 9. Approve Proposal at Version 2
        app_res = self.client.post(f"/api/admin/proposals/{proposal_id}/approve/", {
            "version": 2,
            "approval_notes": "Signed off by Dr. Rafiq",
        }, format="json", **self.auth_headers)
        self.assertEqual(app_res.status_code, 200)

        # Verify project's agreed_budget was updated to v2 cost
        proj = ClientProject.objects.get(pk=project_id)
        self.assertEqual(str(proj.agreed_budget), "1950000.00")
        self.assertEqual(proj.stage, "approved")

        # 10. Log Change Order & decide
        co_res = self.client.post(f"/api/admin/client-projects/{project_id}/change-orders/", {
            "title": "Acoustic Insulation for Consultation Room 2",
            "description": "Soundproofing rockwool panels",
            "proposed_cost": 45000,
            "timeline_impact_days": 3,
        }, format="json", **self.auth_headers)
        self.assertEqual(co_res.status_code, 201)
        co_id = co_res.json()["data"]["id"]

        co_dec_res = self.client.post(f"/api/admin/change-orders/{co_id}/decision/", {
            "status": "approved",
            "client_notes": "Agreed via phone call",
        }, format="json", **self.auth_headers)
        self.assertEqual(co_dec_res.status_code, 200)
        co = ChangeOrder.objects.get(pk=co_id)
        self.assertEqual(co.status, "approved")
