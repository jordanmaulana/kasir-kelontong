from django.db import models


class BarcodeCatalog(models.Model):
    """Global, read-only barcode → product name reference shipped with the app."""

    barcode = models.CharField(max_length=64, primary_key=True)
    name = models.CharField(max_length=200)

    class Meta:
        db_table = "barcode_catalog"

    def __str__(self) -> str:
        return f"{self.barcode} — {self.name}"
