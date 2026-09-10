from django.urls import re_path
from .views import (
    AdminLoginView,
    AdminVerifyView,
    AdminProfileView,
    AdminChangePasswordView,
    Admin2FASetupView,
    Admin2FAVerifyView,
    Admin2FADisableView,
    AdminRequestResetOTPView,
    AdminVerifyResetOTPView,
    AdminUsersListView,
    AdminUsersDetailView,
    AdminLoginHistoryView,
)

urlpatterns = [
    re_path(r"^login/?$", AdminLoginView.as_view(), name="admin_login"),
    re_path(r"^verify/?$", AdminVerifyView.as_view(), name="admin_verify"),
    re_path(r"^profile/?$", AdminProfileView.as_view(), name="admin_profile"),
    re_path(r"^change-password/?$", AdminChangePasswordView.as_view(), name="admin_change_password"),
    re_path(r"^2fa/setup/?$", Admin2FASetupView.as_view(), name="admin_2fa_setup"),
    re_path(r"^2fa/verify/?$", Admin2FAVerifyView.as_view(), name="admin_2fa_verify"),
    re_path(r"^2fa/disable/?$", Admin2FADisableView.as_view(), name="admin_2fa_disable"),
    re_path(r"^request-reset-otp/?$", AdminRequestResetOTPView.as_view(), name="admin_request_reset_otp"),
    re_path(r"^verify-reset-otp/?$", AdminVerifyResetOTPView.as_view(), name="admin_verify_reset_otp"),
    re_path(r"^users/?$", AdminUsersListView.as_view(), name="admin_users_list"),
    re_path(r"^users/(?P<pk>\d+)/?$", AdminUsersDetailView.as_view(), name="admin_users_detail"),
    re_path(r"^login-history/?$", AdminLoginHistoryView.as_view(), name="admin_login_history"),
]
