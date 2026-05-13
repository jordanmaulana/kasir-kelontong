import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import serializers

from cashier.models import Cashier, CashierSession
from profile.models import Profile
from store.models import Store

STORE_CODE_RE = re.compile(r"^[A-Z0-9]{3,10}$")
PIN_RE = re.compile(r"^\d{6}$")

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


class CashierSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    store = serializers.CharField(source="store_id", read_only=True)
    display_name = serializers.CharField(max_length=80)
    pin = serializers.CharField(write_only=True, required=False, allow_blank=False)
    active = serializers.BooleanField(required=False)
    last_login_at = serializers.DateTimeField(read_only=True)
    created_on = serializers.DateTimeField(read_only=True)
    updated_on = serializers.DateTimeField(read_only=True)

    def validate_display_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Nama wajib diisi")
        return name

    def validate_pin(self, value):
        if not PIN_RE.match(value):
            raise serializers.ValidationError("PIN harus 6 digit angka")
        return value

    def validate(self, attrs):
        pin = attrs.get("pin")
        if pin is None:
            if self.instance is None:
                raise serializers.ValidationError({"pin": "PIN wajib diisi"})
            return attrs
        store = self.context["store"]
        qs = Cashier.objects.filter(store=store, active=True)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        for row in qs:
            if row.check_pin(pin):
                raise serializers.ValidationError(
                    {"pin": "PIN sudah dipakai kasir lain"}
                )
        return attrs

    def create(self, validated_data):
        pin = validated_data.pop("pin")
        cashier = Cashier(
            store=self.context["store"],
            display_name=validated_data["display_name"],
            active=validated_data.get("active", True),
        )
        cashier.set_pin(pin)
        actor = validated_data.get("actor")
        if actor is not None:
            cashier.actor = actor
        cashier.save()
        return cashier

    def update(self, instance, validated_data):
        pin = validated_data.pop("pin", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if pin is not None:
            instance.set_pin(pin)
        instance.save()
        return instance


class CashierLoginSerializer(serializers.Serializer):
    store_code = serializers.CharField(max_length=10)
    pin = serializers.CharField(max_length=6)

    def validate_store_code(self, value):
        code = value.strip().upper()
        if not STORE_CODE_RE.match(code):
            raise serializers.ValidationError("Kode toko tidak valid")
        return code

    def validate_pin(self, value):
        if not PIN_RE.match(value):
            raise serializers.ValidationError("PIN harus 6 digit angka")
        return value


class CashierSessionSerializer(serializers.Serializer):
    token = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
    cashier = serializers.SerializerMethodField()
    store = serializers.SerializerMethodField()

    def get_cashier(self, obj):
        c = obj.cashier
        return {
            "id": c.id,
            "display_name": c.display_name,
            "last_login_at": c.last_login_at,
        }

    def get_store(self, obj):
        s = obj.store
        return {"id": s.id, "code": s.code, "name": s.name}


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
