from django.contrib.auth.hashers import check_password, make_password
from django.db import models

from core.models import BaseModel


class Cashier(BaseModel):
    store = models.ForeignKey("store.Store", on_delete=models.CASCADE, related_name="cashiers")
    display_name = models.CharField(max_length=80)
    pin_hash = models.CharField(max_length=128)
    active = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    is_authenticated = True
    is_anonymous = False

    class Meta:
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
        "cashier.Cashier", on_delete=models.CASCADE, related_name="sessions"
    )
    store = models.ForeignKey(
        "store.Store", on_delete=models.CASCADE, related_name="cashier_sessions"
    )
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
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
