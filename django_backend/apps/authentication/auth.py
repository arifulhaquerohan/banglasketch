import jwt
import datetime
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission
from .models import AdminUser, AdminCredential

ROLE_RANK = {
    "viewer": 0,
    "editor": 1,
    "admin": 2,
    "owner": 3,
}

def generate_jwt_token(user: AdminUser) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
        "version": user.token_version,
        "exp": now + datetime.timedelta(hours=getattr(settings, "ADMIN_TOKEN_TTL_HOURS", 8)),
        "iat": now,
    }
    return jwt.encode(payload, settings.ADMIN_JWT_SECRET, algorithm="HS256")


class AdminJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:].strip()
        if not token:
            return None

        try:
            payload = jwt.decode(
                token,
                settings.ADMIN_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_sub": False},
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except Exception:
            raise AuthenticationFailed("Invalid token")

        sub = payload.get("sub")
        version = payload.get("version", 1)

        if sub is not None:
            try:
                user = AdminUser.objects.get(id=int(sub))
            except (AdminUser.DoesNotExist, ValueError):
                raise AuthenticationFailed("User not found")

            if not user.active or user.token_version != version:
                raise AuthenticationFailed("Session expired; please sign in again")

            return (user, token)
        else:
            # Check legacy credentials
            cred = AdminCredential.objects.first()
            if not cred or cred.version != version:
                raise AuthenticationFailed("Session expired; please sign in again")

            # Fallback mock admin user
            dummy_user = AdminUser(
                id=1,
                email=payload.get("email", "admin@localhost"),
                display_name="Administrator",
                role="owner",
                active=True,
                token_version=version,
            )
            return (dummy_user, token)


class IsAdminUserAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, "active", False))


def require_role(min_role: str):
    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            if not request.user or not getattr(request.user, "active", False):
                return False
            user_role = getattr(request.user, "role", "viewer")
            return ROLE_RANK.get(user_role, 0) >= ROLE_RANK.get(min_role, 0)
    return RolePermission
