from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.clients.models import Client, ClientProject, Proposal, ProposalVersion, ChangeOrder


class PortalDecisionValidationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.owner = Client.objects.create(name="Portal test", phone="01700000000", portal_token="a" * 48)
        self.project = ClientProject.objects.create(client=self.owner, title="Test project")
        self.proposal = Proposal.objects.create(project=self.project, title="Test proposal", status="sent")
        ProposalVersion.objects.create(proposal=self.proposal, version=1, scope_summary="Design", proposed_cost=100)
        self.change = ChangeOrder.objects.create(project=self.project, title="Change", description="Test")
        self.proposal_url = f"/api/portal/{self.owner.portal_token}/proposals/{self.proposal.id}/decision/"
        self.change_url = f"/api/portal/{self.owner.portal_token}/change-orders/{self.change.id}/decision/"

    def test_invalid_versions_do_not_modify_proposal(self):
        self.api.raise_request_exception = False
        for version in ["invalid", 999, 0, -1, True, 1.5, [], {}]:
            with self.subTest(version=version):
                response = self.api.post(self.proposal_url, {"decision": "approved", "version": version}, format="json")
                self.assertIn(response.status_code, [400, 404])
                self.proposal.refresh_from_db()
                self.assertEqual(self.proposal.status, "sent")

    def test_deleted_project_cannot_receive_decisions(self):
        self.project.deleted_at = timezone.now()
        self.project.save()
        for url in [self.proposal_url, self.change_url]:
            response = self.api.post(url, {"decision": "approved", "version": 1}, format="json")
            self.assertEqual(response.status_code, 404)

    def test_draft_proposal_cannot_be_approved(self):
        self.proposal.status = "draft"
        self.proposal.save()
        response = self.api.post(self.proposal_url, {"decision": "approved", "version": 1}, format="json")
        self.assertEqual(response.status_code, 409)

    def test_approval_uses_latest_version_and_updates_budget(self):
        response = self.api.post(self.proposal_url, {"decision": "approved"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.proposal.refresh_from_db()
        self.project.refresh_from_db()
        self.assertEqual(self.proposal.approved_version, 1)
        self.assertEqual(self.project.agreed_budget, 100)
        self.assertEqual(self.project.stage, "approved")

    def test_final_decisions_cannot_be_overwritten(self):
        for url in [self.proposal_url, self.change_url]:
            self.assertEqual(self.api.post(url, {"decision": "approved", "version": 1}, format="json").status_code, 200)
            self.assertEqual(self.api.post(url, {"decision": "rejected"}, format="json").status_code, 409)
