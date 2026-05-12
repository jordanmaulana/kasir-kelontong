import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import serializers

from core.models import Profile, Store

STORE_CODE_RE = re.compile(r"^[A-Z0-9]{3,10}$")

User = get_user_model()


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    onboarded = serializers.SerializerMethodField()

    def get_onboarded(self, obj):
        try:
            return obj.profile.onboarded
        except Profile.DoesNotExist:
            return False


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("Email sudah terdaftar")
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class StoreSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=120)
    address = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=1000
    )
    code = serializers.CharField(max_length=10)
    created_on = serializers.DateTimeField(read_only=True)
    updated_on = serializers.DateTimeField(read_only=True)

    def validate_code(self, value):
        code = value.strip().upper()
        if not STORE_CODE_RE.match(code):
            raise serializers.ValidationError(
                "Kode harus 3–10 huruf atau angka"
            )
        tenant = self.context["tenant"]
        qs = Store.objects.filter(tenant=tenant, code=code)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Kode sudah dipakai")
        return code

    def create(self, validated_data):
        return Store.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()

    def validate(self, attrs):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            raise serializers.ValidationError("Google OAuth belum dikonfigurasi")
        try:
            claims = id_token.verify_oauth2_token(
                attrs["credential"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError as exc:
            raise serializers.ValidationError(f"Kredensial Google tidak valid: {exc}") from exc
        if not claims.get("email_verified"):
            raise serializers.ValidationError("Email belum terverifikasi")
        attrs["claims"] = claims
        return attrs
