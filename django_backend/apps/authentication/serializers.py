from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
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
    password = serializers.CharField(write_only=True)

    class Meta:
        model = AdminUser
        fields = ["id", "email", "display_name", "password", "role", "active"]

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

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
