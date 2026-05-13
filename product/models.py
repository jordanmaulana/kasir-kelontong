from django.db import models
from django.db.models import Q

from core.models import BaseModel


class Product(BaseModel):
    tenant = models.ForeignKey(
        "tenant.Tenant", on_delete=models.CASCADE, related_name="products"
    )
    barcode = models.CharField(max_length=64, null=True, blank=True)
    name = models.CharField(max_length=200)
    sell_price = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "barcode"],
                condition=Q(barcode__isnull=False),
                name="uniq_product_barcode_per_tenant",
            ),
        ]

    def __str__(self):
        return self.name
