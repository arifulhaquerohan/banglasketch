from rest_framework import serializers
from .models import AdminUser, LoginHistory

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = [
            "id",
            "email",
            "display_name",
            "role",
            "active",
            "totp_enabled",
            "last_login_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "totp_enabled", "last_login_at", "created_at", "updated_at"]


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = AdminUser
        fields = ["id", "email", "display_name", "password", "role", "active"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = AdminUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ["id", "email", "success", "ip_address", "user_agent", "created_at"]
