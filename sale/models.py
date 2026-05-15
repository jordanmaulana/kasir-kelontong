from django.db import models

from core.models import BaseModel


class Sale(BaseModel):
    store = models.ForeignKey("store.Store", on_delete=models.PROTECT, related_name="sales")
    cashier = models.ForeignKey("cashier.Cashier", on_delete=models.PROTECT, related_name="sales")
    subtotal = models.IntegerField()
    tendered = models.IntegerField()
    change = models.IntegerField()

    class Meta:
        ordering = ["-created_on"]
        indexes = [
            models.Index(fields=["store", "-created_on"]),
            models.Index(fields=["cashier", "-created_on"]),
        ]


class SaleLine(BaseModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="lines")
    product = models.ForeignKey("product.Product", on_delete=models.PROTECT, related_name="+")
    qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.IntegerField()
    line_total = models.IntegerField()
    is_bundle = models.BooleanField(default=False)
    bundle_qty = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["sale"]),
            models.Index(fields=["product", "-created_on"]),
        ]
