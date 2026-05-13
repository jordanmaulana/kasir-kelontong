from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "barcode", "sell_price", "tenant", "created_on")
    list_filter = ("tenant",)
    search_fields = ("name", "barcode", "tenant__name")
    readonly_fields = ("id", "created_on", "updated_on")
