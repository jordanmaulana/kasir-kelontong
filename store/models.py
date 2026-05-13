from django.db import models

from core.models import BaseModel


class Store(BaseModel):
    tenant = models.ForeignKey("tenant.Tenant", on_delete=models.CASCADE, related_name="stores")
    name = models.CharField(max_length=120)
    address = models.TextField(blank=True, default="")
    code = models.CharField(max_length=10)

    class Meta:
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(fields=["tenant", "code"], name="uniq_store_code_per_tenant")
        ]

    def __str__(self):
        return f"Store<{self.code}>"
