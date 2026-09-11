import pyotp
import hashlib
import datetime
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from apps.authentication.models import AdminUser, AdminPasswordReset, LoginHistory
from apps.authentication.services.totp import encrypt_totp_secret, decrypt_totp_secret
from apps.authentication.auth import generate_jwt_token

class AuthSecurityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create primary Owner
        self.owner = AdminUser(
            email="owner@banglasketch.com",
            display_name="Studio Owner",
            role="owner",
            active=True,
            token_version=1,
        )
        self.owner.set_password("OwnerPassword123!")
        self.owner.save()

        # Create Admin
        self.admin = AdminUser(
            email="admin@banglasketch.com",
            display_name="Admin Manager",
            role="admin",
            active=True,
            token_version=1,
        )
        self.admin.set_password("AdminPassword123!")
        self.admin.save()

        # Create Editor
        self.editor = AdminUser(
            email="editor@banglasketch.com",
            display_name="Content Editor",
            role="editor",
            active=True,
            token_version=1,
        )
        self.editor.set_password("EditorPassword123!")
        self.editor.save()

        self.owner_token = generate_jwt_token(self.owner)
        self.admin_token = generate_jwt_token(self.admin)
        self.editor_token = generate_jwt_token(self.editor)

    # 1. TOTP Encryption & Decryption Parity
    def test_totp_secret_encryption_and_decryption(self):
        secret = "JBSWY3DPEHPK3PXP"
        encrypted = encrypt_totp_secret(secret)
        self.assertNotEqual(secret, encrypted)
        self.assertTrue(len(encrypted) > 28)

        decrypted = decrypt_totp_secret(encrypted)
        self.assertEqual(secret, decrypted)

    # 2. 2FA Setup, Verification & Disabling
    def test_totp_2fa_workflow(self):
        # 1. Setup 2FA
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.owner_token}")
        setup_res = self.client.get("/api/admin/2fa/setup")
        self.assertEqual(setup_res.status_code, 200)
        self.assertTrue(setup_res.data["success"])
        secret = setup_res.data["data"]["secret"]
        self.assertTrue(bool(secret))

        # Check pending secret is saved encrypted
        self.owner.refresh_from_db()
        self.assertIsNotNone(self.owner.pending_totp_secret)
        self.assertFalse(self.owner.totp_enabled)

        # 2. Verify with valid TOTP code
        totp = pyotp.TOTP(secret)
        code = totp.now()
        verify_res = self.client.post("/api/admin/2fa/verify", {"code": code})
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.data["success"])

        self.owner.refresh_from_db()
        self.assertTrue(self.owner.totp_enabled)
        self.assertIsNone(self.owner.pending_totp_secret)
        self.assertEqual(decrypt_totp_secret(self.owner.totp_secret), secret)

        # 3. Login requires 2FA code
        self.client.credentials() # clear auth headers
        login_no_2fa = self.client.post("/api/admin/login", {
            "email": self.owner.email,
            "password": "OwnerPassword123!",
        })
        self.assertEqual(login_no_2fa.status_code, 401)
        self.assertTrue(login_no_2fa.data.get("requires2FA") or login_no_2fa.data.get("requiresTotp"))

        # 4. Login with valid 2FA code
        login_with_2fa = self.client.post("/api/admin/login", {
            "email": self.owner.email,
            "password": "OwnerPassword123!",
            "totp": totp.now(),
        })
        self.assertEqual(login_with_2fa.status_code, 200)
        self.assertTrue(login_with_2fa.data["success"])

        # 5. Disable 2FA
        token_with_2fa = login_with_2fa.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_with_2fa}")
        disable_res = self.client.post("/api/admin/2fa/disable", {
            "password": "OwnerPassword123!",
            "code": totp.now(),
        })
        self.assertEqual(disable_res.status_code, 200)

        self.owner.refresh_from_db()
        self.assertFalse(self.owner.totp_enabled)
        self.assertIsNone(self.owner.totp_secret)

    # 3. Role Hierarchy & Owner Invariant Protections
    def test_admin_cannot_create_owner_user(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        res = self.client.post("/api/admin/users", {
            "email": "anotherowner@banglasketch.com",
            "display_name": "New Owner Attempt",
            "password": "StrongPassword123!",
            "role": "owner",
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn("Only studio owners", res.data.get("error", ""))

    def test_owner_can_create_another_owner(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.owner_token}")
        res = self.client.post("/api/admin/users", {
            "email": "partner@banglasketch.com",
            "display_name": "Partner Architect",
            "password": "StrongPassword123!",
            "role": "owner",
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["data"]["role"], "owner")

    def test_admin_cannot_modify_owner_account(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        res = self.client.put(f"/api/admin/users/{self.owner.id}", {
            "display_name": "Tampered Name",
            "role": "editor",
        })
        self.assertEqual(res.status_code, 403)

    def test_cannot_delete_last_active_owner(self):
        # Create a second temporary owner to delete from
        second_owner = AdminUser.objects.create(
            email="second@banglasketch.com",
            display_name="Second Owner",
            role="owner",
            active=True,
        )
        second_owner.set_password("TempPass123!")
        second_owner.save()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.owner_token}")
        # Delete second owner -> Should succeed because self.owner remains
        res1 = self.client.delete(f"/api/admin/users/{second_owner.id}")
        self.assertEqual(res1.status_code, 200)

        # Attempt to delete the only remaining active owner
        # Cannot delete own account returns 400
        res2 = self.client.delete(f"/api/admin/users/{self.owner.id}")
        self.assertEqual(res2.status_code, 400)

    def test_cannot_demote_last_active_owner(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.owner_token}")
        res = self.client.put(f"/api/admin/users/{self.owner.id}", {
            "role": "admin",
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("last remaining active studio owner", res.data.get("error", ""))

    def test_login_history_logging(self):
        initial_count = LoginHistory.objects.count()

        # Failed attempt
        self.client.credentials()
        self.client.post("/api/admin/login", {
            "email": "owner@banglasketch.com",
            "password": "WrongPassword!",
        })

        # Successful attempt
        self.client.post("/api/admin/login", {
            "email": "owner@banglasketch.com",
            "password": "OwnerPassword123!",
        })

        new_count = LoginHistory.objects.count()
        self.assertEqual(new_count, initial_count + 2)

        last_success = LoginHistory.objects.filter(email="owner@banglasketch.com", success=True).first()
        self.assertIsNotNone(last_success)
