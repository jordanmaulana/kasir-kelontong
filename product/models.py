from django.db import models
from django.db.models import Q

from core.models import BaseModel


class Product(BaseModel):
    tenant = models.ForeignKey("tenant.Tenant", on_delete=models.CASCADE, related_name="products")
    barcode = models.CharField(max_length=64, null=True, blank=True)
    name = models.CharField(max_length=200)
    sell_price = models.PositiveIntegerField(default=0)
    bundle_qty = models.PositiveIntegerField(null=True, blank=True)
    bundle_price = models.PositiveIntegerField(null=True, blank=True)
    bundle_label = models.CharField(max_length=32, null=True, blank=True)
    is_weighted = models.BooleanField(default=False)
    unit_label = models.CharField(max_length=8, default="pcs")
    archived_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "barcode"],
                condition=Q(barcode__isnull=False) & Q(archived_at__isnull=True),
                name="uniq_product_barcode_per_tenant",
            ),
        ]

    @property
    def has_bundle(self) -> bool:
        return self.bundle_qty is not None and self.bundle_price is not None

    def __str__(self):
        return self.name
