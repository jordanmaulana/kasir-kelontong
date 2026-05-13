from bson.objectid import ObjectId
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import User
from django.db import models


def make_object_id():
    return str(ObjectId())


class BaseModel(models.Model):
    id = models.CharField(primary_key=True, default=make_object_id, editable=False)
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)
    actor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        abstract = True
        ordering = ["id"]
        indexes = [models.Index(fields=["created_on"])]

    def __str__(self):
        return f"{self.id}"


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="profile",
    )
    onboarded = models.BooleanField(default=False)
    created_on = models.DateTimeField(auto_now_add=True)
    updated_on = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "core"

    def __str__(self):
        return f"Profile<{self.user.username}>"


class Tenant(BaseModel):
    name = models.CharField(max_length=120)
    owner = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="tenant"
    )

    class Meta:
        app_label = "core"
        ordering = ["created_on"]

    def __str__(self):
        return f"Tenant<{self.name}>"


class Store(BaseModel):
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="stores"
    )
    name = models.CharField(max_length=120)
    address = models.TextField(blank=True, default="")
    code = models.CharField(max_length=10)

    class Meta:
        app_label = "core"
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "code"], name="uniq_store_code_per_tenant"
            )
        ]

    def __str__(self):
        return f"Store<{self.code}>"


class Cashier(BaseModel):
    store = models.ForeignKey(
        Store, on_delete=models.CASCADE, related_name="cashiers"
    )
    display_name = models.CharField(max_length=80)
    pin_hash = models.CharField(max_length=128)
    active = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    is_authenticated = True
    is_anonymous = False

    class Meta:
        app_label = "core"
        ordering = ["display_name"]

    def set_pin(self, raw_pin: str) -> None:
        self.pin_hash = make_password(raw_pin)

    def check_pin(self, raw_pin: str) -> bool:
        return check_password(raw_pin, self.pin_hash)

    def __str__(self):
        return f"Cashier<{self.display_name}>"


class CashierSession(BaseModel):
    token = models.CharField(max_length=40, unique=True, db_index=True)
    cashier = models.ForeignKey(
        Cashier, on_delete=models.CASCADE, related_name="sessions"
    )
    store = models.ForeignKey(
        Store, on_delete=models.CASCADE, related_name="cashier_sessions"
    )
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        app_label = "core"
        ordering = ["-created_on"]

    @classmethod
    def issue(cls, cashier):
        import secrets
        from datetime import timedelta
        from django.utils import timezone

        return cls.objects.create(
            token=secrets.token_hex(20),
            cashier=cashier,
            store=cashier.store,
            expires_at=timezone.now() + timedelta(hours=8),
        )

    def is_expired(self) -> bool:
        from django.utils import timezone

        return self.expires_at <= timezone.now()


class AppSetting(models.Model):
    key = models.CharField()
    should_be_unique = models.BooleanField(default=True)
    str_value = models.TextField(null=True, blank=True)
    int_value = models.IntegerField(null=True, blank=True)
    float_value = models.FloatField(null=True, blank=True)
    bool_value = models.BooleanField(default=True)

    class Meta:
        app_label = "core"

    @staticmethod
    def get(key, value_type, default=None):
        if value_type not in ["str", "int", "float", "bool"]:
            raise ValueError("Value type should be one of str, int, float, or bool")
        try:
            setting = AppSetting.objects.get(key__iexact=key)
            return getattr(setting, f"{value_type}_value")
        except AppSetting.DoesNotExist:
            return default

    def __str__(self):
        return self.key
