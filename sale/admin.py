from django.contrib import admin

from sale.models import Sale, SaleLine


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("id", "store", "cashier", "subtotal", "tendered", "change", "created_on")
    list_filter = ("store",)
    search_fields = ("id",)


@admin.register(SaleLine)
class SaleLineAdmin(admin.ModelAdmin):
    list_display = ("id", "sale", "product", "qty", "unit_price", "line_total")
