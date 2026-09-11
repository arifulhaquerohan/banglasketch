from io import BytesIO
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.authentication.models import AdminUser
from apps.core.views import AdminUploadView, AdminCloudinarySignView


@override_settings(CLOUDINARY_CLOUD_NAME="test", CLOUDINARY_API_KEY="test", CLOUDINARY_API_SECRET="test")
class MediaUploadTests(SimpleTestCase):
    def request(self, file=None, role="editor", folder="projects"):
        request = APIRequestFactory().post("/api/admin/upload", {
            "file": file or self.image(), "folder": folder,
        }, format="multipart")
        if role:
            force_authenticate(request, user=AdminUser(id=1, role=role, active=True))
        return AdminUploadView.as_view()(request)

    def image(self):
        data = BytesIO()
        Image.new("RGB", (2, 2)).save(data, "PNG")
        return SimpleUploadedFile("photo.png", data.getvalue(), content_type="image/png")

    @patch("apps.core.services.media_upload.cloudinary.uploader.upload")
    def test_editor_upload_uses_fixed_policy(self, upload):
        upload.return_value = {"secure_url": "https://res.cloudinary.com/test/image/upload/a.png", "public_id": "a"}
        response = self.request()
        self.assertEqual(response.status_code, 200)
        options = upload.call_args.kwargs
        self.assertFalse(options["overwrite"])
        self.assertEqual(options["resource_type"], "image")
        self.assertEqual(options["access_mode"], "public")
        self.assertEqual(options["type"], "upload")
        self.assertEqual(options["folder"], "banglasketch/projects")
        self.assertRegex(options["public_id"], r"^[a-f0-9]{32}$")
        self.assertNotIn("test", str(response.data.get("api_secret", "")))
        self.assertTrue(response.data["data"]["metadata_removed"])
        self.assertEqual(response.data["data"]["visibility"], "public_website_asset")

    @patch("apps.core.services.media_upload.cloudinary.uploader.upload")
    def test_hidden_image_metadata_is_removed_before_storage(self, upload):
        data = BytesIO()
        image = Image.new("RGB", (4, 4), "red")
        exif = image.getexif()
        exif[270] = "private location notes"
        image.save(data, "JPEG", exif=exif)
        upload.return_value = {
            "secure_url": "https://res.cloudinary.com/test/image/upload/photo.jpg",
            "public_id": "banglasketch/projects/photo",
            "format": "jpg",
            "bytes": 100,
        }

        response = self.request(SimpleUploadedFile("photo.jpg", data.getvalue(), content_type="image/jpeg"))

        self.assertEqual(response.status_code, 200)
        stored_file = upload.call_args.args[0]
        stored_file.seek(0)
        with Image.open(stored_file) as stored_image:
            self.assertEqual(dict(stored_image.getexif()), {})

    @patch("apps.core.services.media_upload.cloudinary.uploader.upload")
    def test_denies_anonymous_and_viewer(self, upload):
        for role in (None, "viewer"):
            self.assertIn(self.request(role=role).status_code, (401, 403))
        upload.assert_not_called()

    @patch("apps.core.services.media_upload.cloudinary.uploader.upload")
    def test_rejects_fake_images_and_svg(self, upload):
        for body in (b"not an image", b'<svg xmlns="http://www.w3.org/2000/svg"/>'):
            response = self.request(SimpleUploadedFile("fake.png", body, content_type="image/png"))
            self.assertEqual(response.status_code, 400)
        upload.assert_not_called()

    @patch("apps.core.services.media_upload.cloudinary.uploader.upload")
    def test_rejects_oversize_and_traversal(self, upload):
        self.assertEqual(self.request(SimpleUploadedFile("big.png", b"x" * (10 * 1024 * 1024 + 1))).status_code, 400)
        self.assertEqual(self.request(folder="../private").status_code, 400)
        with patch("apps.core.services.media_upload.MAX_PIXELS", 1):
            self.assertEqual(self.request().status_code, 400)
        upload.assert_not_called()

    @patch("apps.core.services.media_upload.cloudinary.uploader.upload", side_effect=RuntimeError("private-provider-details"))
    def test_provider_failure_does_not_leak_details(self, upload):
        response = self.request()
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private-provider-details", str(response.data))

    def test_browser_signatures_retired(self):
        request = APIRequestFactory().get("/api/admin/cloudinary-sign")
        force_authenticate(request, user=AdminUser(id=1, role="editor", active=True))
        response = AdminCloudinarySignView.as_view()(request)
        self.assertEqual(response.status_code, 410)
        self.assertNotIn("signature", response.data)
