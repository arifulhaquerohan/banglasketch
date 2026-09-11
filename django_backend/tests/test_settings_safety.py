import os
from pathlib import Path
import subprocess
import sys
from django.test import SimpleTestCase


class SettingsSafetyTests(SimpleTestCase):
    def test_base_directory_is_backend_root(self):
        from config.settings.base import BASE_DIR
        self.assertEqual(BASE_DIR, Path(__file__).resolve().parents[1])

    def test_production_requires_secrets_without_node_env(self):
        secrets = ("DJANGO_SECRET_KEY", "ADMIN_JWT_SECRET", "TOTP_ENCRYPTION_KEY")
        for missing in secrets:
            with self.subTest(missing=missing):
                env = {key: value for key, value in os.environ.items() if key not in (*secrets, "NODE_ENV")}
                env.update({key: "test-only-secret" for key in secrets if key != missing})
                result = subprocess.run(
                    [sys.executable, "-c", "from unittest.mock import patch; "
                     "patch('dotenv.load_dotenv').start(); import config.settings.production"],
                    cwd=Path(__file__).resolve().parents[1], env=env, capture_output=True, text=True,
                )
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(f"{missing} must be set in production", result.stderr)
