import pyotp
import hashlib
import secrets
import datetime
import bcrypt
import logging
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView

logger = logging.getLogger(__name__)
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import AdminUser, AdminCredential, AdminPasswordReset, LoginHistory
from .serializers import AdminUserSerializer, AdminUserCreateSerializer, LoginHistorySerializer
from .auth import generate_jwt_token, IsAdminUserAuthenticated, require_role
from .services.totp import encrypt_totp_secret, decrypt_totp_secret
from apps.core.services.rate_limit import PostgresRateLimiter

def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")

def mask_email(email_str):
    if not email_str or "@" not in email_str:
        return email_str
    parts = email_str.split("@", 1)
    user_part, domain = parts[0], parts[1]
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            email = getattr(settings, "ADMIN_RECOVERY_EMAIL", "").strip().lower() or getattr(settings, "EMAIL_HOST_USER", "").strip().lower()

        password = request.data.get("password", "")
        totp_code = (request.data.get("totp_code") or request.data.get("totp") or "").strip()
        ip = get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")

        # Rate limiting: 5 attempts per 15 minutes in production
        if not settings.DEBUG:
            limiter = PostgresRateLimiter("login", 15 * 60 * 1000, 5)
            allowed, hits, reset_at = limiter.check_and_increment(ip)
            if not allowed:
                return Response({
                    "success": False,
                    "error": "Too many login attempts. Try again in 15 minutes."
                }, status=429)

        if not password:
            return Response({"success": False, "error": "Password required"}, status=400)

        user = AdminUser.objects.filter(email=email).first()
        if not user or not user.check_password(password) or not user.active:
            LoginHistory.objects.create(
                admin_user=user if user else None,
                email=email,
                success=False,
                ip_address=ip,
                user_agent=user_agent,
            )
            return Response({"success": False, "error": "Wrong email or password"}, status=401)

        # 2FA Check
        if user.totp_enabled:
            if not totp_code:
                return Response({
                    "success": False,
                    "requiresTotp": True,
                    "requires2FA": True,
                    "error": "A valid two-factor code is required",
                }, status=401)

            totp_secret = decrypt_totp_secret(user.totp_secret)
            totp = pyotp.TOTP(totp_secret)
            if not totp.verify(totp_code, valid_window=1):
                LoginHistory.objects.create(
                    admin_user=user,
                    email=email,
                    success=False,
                    ip_address=ip,
                    user_agent=user_agent,
                )
                return Response({"success": False, "error": "A valid two-factor code is required", "requiresTotp": True}, status=401)

        # Login Success
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at"])

        LoginHistory.objects.create(
            admin_user=user,
            email=email,
            success=True,
            ip_address=ip,
            user_agent=user_agent,
        )

        token = generate_jwt_token(user)
        return Response({
            "success": True,
            "token": token,
            "user": AdminUserSerializer(user).data,
        })


class AdminVerifyView(APIView):
    permission_classes = [IsAdminUserAuthenticated]

    def get(self, request):
        return Response({
            "success": True,
            "user": AdminUserSerializer(request.user).data,
        })


class AdminProfileView(APIView):
    permission_classes = [IsAdminUserAuthenticated]

    def get(self, request):
        return Response({
            "success": True,
            "data": AdminUserSerializer(request.user).data,
        })

    def put(self, request):
        user = request.user
        display_name = request.data.get("display_name", "").strip()
        if display_name:
            user.display_name = display_name
            user.save(update_fields=["display_name", "updated_at"])
        return Response({
            "success": True,
            "data": AdminUserSerializer(user).data,
        })


class AdminChangePasswordView(APIView):
    permission_classes = [IsAdminUserAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")

        if not current_password or not new_password:
            return Response({"success": False, "error": "Current and new passwords required"}, status=400)

        if len(new_password) < 8:
            return Response({"success": False, "error": "New password must be at least 8 characters"}, status=400)

        user = request.user
        if not user.check_password(current_password):
            return Response({"success": False, "error": "Incorrect current password"}, status=400)

        user.set_password(new_password)
        user.token_version += 1
        user.save(update_fields=["password_hash", "token_version", "updated_at"])

        new_token = generate_jwt_token(user)
        return Response({
            "success": True,
            "token": new_token,
            "message": "Password changed successfully",
        })


class Admin2FASetupView(APIView):
    permission_classes = [IsAdminUserAuthenticated]

    def get(self, request):
        user = request.user
        secret = pyotp.random_base32()
        encrypted_secret = encrypt_totp_secret(secret)
        user.pending_totp_secret = encrypted_secret
        user.save(update_fields=["pending_totp_secret"])

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="Banglasketch Studio")

        return Response({
            "success": True,
            "data": {
                "secret": secret,
                "qrCode": uri,
            }
        })


class Admin2FAVerifyView(APIView):
    permission_classes = [IsAdminUserAuthenticated]

    def post(self, request):
        code = request.data.get("code", "").strip()
        user = request.user

        if not user.pending_totp_secret:
            return Response({"success": False, "error": "2FA setup was not initiated"}, status=400)

        decrypted_secret = decrypt_totp_secret(user.pending_totp_secret)
        totp = pyotp.TOTP(decrypted_secret)
        if not totp.verify(code, valid_window=1):
            return Response({"success": False, "error": "Invalid verification code"}, status=400)

        user.totp_secret = user.pending_totp_secret
        user.pending_totp_secret = None
        user.totp_enabled = True
        user.save(update_fields=["totp_secret", "pending_totp_secret", "totp_enabled", "updated_at"])

        return Response({"success": True, "message": "Two-factor authentication enabled successfully"})


class Admin2FADisableView(APIView):
    permission_classes = [IsAdminUserAuthenticated]

    def post(self, request):
        password = request.data.get("password", "")
        code = request.data.get("code", "").strip()
        user = request.user

        if not user.check_password(password):
            return Response({"success": False, "error": "Incorrect password"}, status=400)

        if user.totp_enabled and user.totp_secret:
            decrypted_secret = decrypt_totp_secret(user.totp_secret)
            totp = pyotp.TOTP(decrypted_secret)
            if not totp.verify(code, valid_window=1):
                return Response({"success": False, "error": "Invalid 2FA code"}, status=400)

        user.totp_enabled = False
        user.totp_secret = None
        user.pending_totp_secret = None
        user.save(update_fields=["totp_enabled", "totp_secret", "pending_totp_secret", "updated_at"])

        return Response({"success": True, "message": "Two-factor authentication disabled successfully"})


class AdminRequestResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip = get_client_ip(request)
        if not settings.DEBUG:
            limiter = PostgresRateLimiter("otp_request", 60 * 1000, 3)
            allowed, hits, reset_at = limiter.check_and_increment(ip)
            if not allowed:
                return Response({
                    "success": False,
                    "error": "Too many OTP requests. Please wait a minute."
                }, status=429)

        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"success": False, "error": "Email is required"}, status=400)

        user = AdminUser.objects.filter(email=email, active=True).first()
        if user:
            otp = f"{secrets.randbelow(1000000):06d}"
            otp_hash = hashlib.sha256(otp.encode("utf-8")).hexdigest()
            expires_at = timezone.now() + datetime.timedelta(minutes=15)

            AdminPasswordReset.objects.create(
                email=email,
                otp_hash=otp_hash,
                expires_at=expires_at,
                ip_address=ip,
            )

            try:
                send_mail(
                    subject="Banglasketch Admin Password Reset Code",
                    message=f"Your verification code is: {otp}\nThis code will expire in 15 minutes.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"Failed to send password reset email to {email}: {e}")

        return Response({
            "success": True,
            "message": "If an account exists with this email, a verification code has been sent.",
            "maskedEmail": mask_email(email),
        })


class AdminVerifyResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip = get_client_ip(request)
        if not settings.DEBUG:
            limiter = PostgresRateLimiter("otp_verify", 15 * 60 * 1000, 10)
            allowed, hits, reset_at = limiter.check_and_increment(ip)
            if not allowed:
                return Response({
                    "success": False,
                    "error": "Too many attempts. Please try again later."
                }, status=429)

        email = (request.data.get("email") or "").strip().lower()
        otp = str(request.data.get("otp") or "").strip()
        new_password = request.data.get("newPassword") or request.data.get("new_password") or request.data.get("password")

        if not otp:
            return Response({"success": False, "error": "Verification code (OTP) is required"}, status=400)

        now = timezone.now()

        # Fallback to configured recovery email if not provided in payload
        if not email:
            recovery_email = (
                getattr(settings, "ADMIN_RECOVERY_EMAIL", None)
                or getattr(settings, "ADMIN_NOTIFICATION_EMAIL", None)
                or getattr(settings, "EMAIL_HOST_USER", None)
            )
            if recovery_email:
                email = recovery_email.strip().lower()

        # Query active, unexpired, unused reset requests
        if not email:
            return Response({"success": False, "error": "Email is required to verify the reset request."}, status=400)

        qs = AdminPasswordReset.objects.filter(used=False, expires_at__gt=now, email=email)

        otp_sha256 = hashlib.sha256(otp.encode("utf-8")).hexdigest()
        reset_entry = None

        # Look up candidate reset entries (most recent first)
        for candidate in qs.order_by("-created_at")[:20]:
            if candidate.otp_hash == otp_sha256:
                reset_entry = candidate
                break
            if candidate.otp_hash.startswith("$2"):
                try:
                    if bcrypt.checkpw(otp.encode("utf-8"), candidate.otp_hash.encode("utf-8")):
                        reset_entry = candidate
                        break
                except Exception:
                    pass

        if not reset_entry:
            return Response({"success": False, "error": "Invalid or expired recovery code. Please try again."}, status=400)

        target_email = reset_entry.email or email
        user = AdminUser.objects.filter(email=target_email, active=True).first()

        # If a new password is provided (complete reset step)
        if new_password:
            if len(new_password) < 8:
                return Response({"success": False, "error": "Master password must be at least 8 characters long."}, status=400)

            if user:
                user.set_password(new_password)
                user.token_version += 1
                user.save(update_fields=["password_hash", "token_version", "updated_at"])

                try:
                    AdminCredential.objects.update_or_create(
                        id=1,
                        defaults={"password_hash": user.password_hash, "version": user.token_version}
                    )
                except Exception as e:
                    logger.error(f"Failed to update admin credentials: {e}")

            reset_entry.used = True
            reset_entry.save(update_fields=["used"])

            return Response({
                "success": True,
                "message": "Master password has been reset successfully.",
            })

        # If only verifying the OTP code (two-step flow)
        reset_token = secrets.token_hex(32)
        reset_entry.used = True
        reset_entry.save(update_fields=["used"])

        return Response({
            "success": True,
            "resetToken": reset_token,
            "email": target_email,
        })


class AdminUsersListView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request):
        users = AdminUser.objects.all().order_by("-created_at")
        serializer = AdminUserSerializer(users, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        target_role = request.data.get("role", "editor")
        if target_role == "owner" and request.user.role != "owner":
            return Response({"success": False, "error": "Only studio owners can create other owner accounts."}, status=403)

        serializer = AdminUserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"success": True, "data": AdminUserSerializer(user).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminUsersDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def put(self, request, pk):
        try:
            user = AdminUser.objects.get(pk=pk)
        except AdminUser.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=404)

        # Hierarchy check: only an owner can edit an owner or elevate someone to owner
        target_role = request.data.get("role", user.role)
        if (user.role == "owner" or target_role == "owner") and request.user.role != "owner":
            return Response({"success": False, "error": "Only studio owners can modify owner accounts or roles."}, status=403)

        # Last active owner protection
        new_active = request.data.get("active", user.active)
        if user.role == "owner" and (target_role != "owner" or not new_active):
            other_active_owners = AdminUser.objects.filter(role="owner", active=True).exclude(pk=user.pk).count()
            if other_active_owners == 0:
                return Response({
                    "success": False,
                    "error": "Cannot demote or deactivate the last remaining active studio owner."
                }, status=400)

        for field in ["display_name", "role", "active"]:
            if field in request.data:
                setattr(user, field, request.data[field])

        if "password" in request.data and request.data["password"]:
            user.set_password(request.data["password"])
            user.token_version += 1

        user.save()
        return Response({"success": True, "data": AdminUserSerializer(user).data})

    def delete(self, request, pk):
        if int(pk) == request.user.id:
            return Response({"success": False, "error": "Cannot delete your own account"}, status=400)

        try:
            user = AdminUser.objects.get(pk=pk)
        except AdminUser.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=404)

        if user.role == "owner":
            if request.user.role != "owner":
                return Response({"success": False, "error": "Only studio owners can delete owner accounts."}, status=403)
            other_active_owners = AdminUser.objects.filter(role="owner", active=True).exclude(pk=user.pk).count()
            if other_active_owners == 0:
                return Response({
                    "success": False,
                    "error": "Cannot delete the last remaining active studio owner."
                }, status=400)

        user.delete()
        return Response({"success": True, "message": "User deleted"})


class AdminLoginHistoryView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request):
        records = LoginHistory.objects.all().order_by("-created_at")[:100]
        serializer = LoginHistorySerializer(records, many=True)
        return Response({"success": True, "data": serializer.data})
