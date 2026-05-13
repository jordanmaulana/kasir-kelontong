from django.db import models

from core.models import BaseModel


class StockReason(models.TextChoices):
    RECEIVING = "receiving", "Penerimaan"
    SALE = "sale", "Penjualan"
    ADJUSTMENT = "adjustment", "Penyesuaian"
    VOID = "void", "Void"


class StockMovement(BaseModel):
    store = models.ForeignKey(
        "store.Store", on_delete=models.PROTECT, related_name="stock_movements"
    )
    product = models.ForeignKey(
        "product.Product", on_delete=models.PROTECT, related_name="stock_movements"
    )
    delta = models.IntegerField()
    reason = models.CharField(max_length=16, choices=StockReason.choices)
    ref_type = models.CharField(max_length=32, blank=True, default="")
    ref_id = models.CharField(max_length=32, blank=True, default="")
    note = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_on"]
        indexes = [
            models.Index(fields=["store", "product", "-created_on"]),
            models.Index(fields=["store", "-created_on"]),
        ]


class StoreStock(BaseModel):
    store = models.ForeignKey(
        "store.Store", on_delete=models.CASCADE, related_name="stocks"
    )
    product = models.ForeignKey(
        "product.Product", on_delete=models.CASCADE, related_name="stocks"
    )
    qty = models.IntegerField(default=0)
    last_movement_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["store", "product"], name="uniq_storestock_store_product"
            ),
        ]
        indexes = [models.Index(fields=["store"])]
