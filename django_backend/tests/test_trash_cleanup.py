from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.authentication.models import AdminUser
from apps.core.models import AuditLog, BackgroundJob
from apps.core.management.commands.run_jobs import Command
from apps.core.services.media_cleanup import delete_media_from_cloudinary
from apps.projects.models import Project
from apps.blog.models import BlogPost


class TrashCleanupTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(AdminUser.objects.create(email="trash@example.com", role="admin", active=True))
        self.project = Project.objects.create(title="Deleted", slug="deleted", category="bedroom",
            deleted_at=timezone.now(), cloudinary_ids=["studio/a", "studio/b", "studio/a"])

    @patch("apps.core.management.commands.run_jobs.delete_media_from_cloudinary", return_value=True)
    def test_delete_preserves_unique_asset_ids_for_worker(self, delete):
        response = self.client.delete(f"/api/admin/trash/projects/{self.project.pk}")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Project.objects.filter(pk=self.project.pk).exists())
        self.assertEqual(list(BackgroundJob.objects.values_list("kind", flat=True)), ["media_cleanup"] * 2)
        Command().process_background_jobs()
        self.assertCountEqual([call.args[0] for call in delete.call_args_list], ["studio/a", "studio/b"])
        self.assertEqual(BackgroundJob.objects.filter(status="completed").count(), 2)

    def test_queue_failure_rolls_back_deletion_and_audit(self):
        with patch("apps.core.models.BackgroundJob.objects.create", side_effect=RuntimeError("queue unavailable")):
            response = self.client.delete(f"/api/admin/trash/projects/{self.project.pk}")
            self.assertEqual(response.status_code, 500)
        self.assertTrue(Project.objects.filter(pk=self.project.pk).exists())
        self.assertFalse(AuditLog.objects.filter(action="permanent_delete").exists())

    def test_blog_single_asset_and_live_record_protection(self):
        post = BlogPost.objects.create(title="Post", slug="post", cloudinary_id="studio/blog", deleted_at=timezone.now())
        self.assertEqual(self.client.delete(f"/api/admin/trash/blog_posts/{post.pk}").status_code, 200)
        self.assertEqual(BackgroundJob.objects.get().payload, {"public_id": "studio/blog"})
        self.project.deleted_at = None
        self.project.save()
        self.assertEqual(self.client.delete(f"/api/admin/trash/projects/{self.project.pk}").status_code, 404)

    @patch("cloudinary.uploader.destroy", return_value={"result": "not found"})
    def test_cleanup_retry_accepts_already_deleted_asset(self, destroy):
        self.assertTrue(delete_media_from_cloudinary("studio/already-deleted"))
