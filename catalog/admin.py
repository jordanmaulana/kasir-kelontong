from django.contrib import admin

from catalog.models import BarcodeCatalog


@admin.register(BarcodeCatalog)
class BarcodeCatalogAdmin(admin.ModelAdmin):
    list_display = ("barcode", "name")
    search_fields = ("barcode", "name")
