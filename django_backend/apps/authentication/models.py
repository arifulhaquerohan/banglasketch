from django.db import models
import bcrypt

class AdminUser(models.Model):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("editor", "Editor"),
        ("viewer", "Viewer"),
    )

    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, default="editor", choices=ROLE_CHOICES)
    active = models.BooleanField(default=True)
    token_version = models.IntegerField(default=1)
    totp_secret = models.TextField(null=True, blank=True)
    totp_enabled = models.BooleanField(default=False)
    pending_totp_secret = models.TextField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "admin_users"
        verbose_name = "Admin User"
        verbose_name_plural = "Admin Users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.display_name} ({self.email}) [{self.role}]"

    def check_password(self, raw_password: str) -> bool:
        if not self.password_hash or not raw_password:
            return False
        try:
            return bcrypt.checkpw(
                raw_password.encode("utf-8"),
                self.password_hash.encode("utf-8"),
            )
        except Exception:
            return False

    def set_password(self, raw_password: str):
        salt = bcrypt.gensalt(rounds=10)
        self.password_hash = bcrypt.hashpw(raw_password.encode("utf-8"), salt).decode("utf-8")

    @property
    def is_authenticated(self):
        return True


class AdminCredential(models.Model):
    id = models.IntegerField(primary_key=True, default=1)
    password_hash = models.TextField()
    version = models.IntegerField(default=1)

    class Meta:
        db_table = "admin_credentials"
        verbose_name = "Legacy Admin Credential"
        verbose_name_plural = "Legacy Admin Credentials"

    def __str__(self):
        return f"AdminCredential (v{self.version})"


class AdminPasswordReset(models.Model):
    email = models.CharField(max_length=255)
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    used = models.BooleanField(default=False)
    ip_address = models.CharField(max_length=255, default="unknown")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "admin_password_resets"
        verbose_name = "Password Reset Request"
        verbose_name_plural = "Password Reset Requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reset OTP for {self.email} (Used: {self.used})"


class LoginHistory(models.Model):
    admin_user = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="login_records",
        db_column="admin_user_id",
    )
    email = models.CharField(max_length=255, null=True, blank=True)
    success = models.BooleanField()
    ip_address = models.CharField(max_length=255, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "login_history"
        verbose_name = "Login History Record"
        verbose_name_plural = "Login History"
        ordering = ["-created_at"]

    def __str__(self):
        status = "SUCCESS" if self.success else "FAILED"
        return f"[{status}] {self.email or 'unknown'} from {self.ip_address} at {self.created_at}"
