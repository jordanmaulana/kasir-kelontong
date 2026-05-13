from django.contrib import admin

from .models import StockMovement, StoreStock


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("created_on", "store", "product", "delta", "reason", "actor")
    list_filter = ("reason", "store")
    search_fields = ("product__name", "product__barcode", "store__code", "note")
    readonly_fields = (
        "id",
        "store",
        "product",
        "delta",
        "reason",
        "ref_type",
        "ref_id",
        "note",
        "actor",
        "created_on",
        "updated_on",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(StoreStock)
class StoreStockAdmin(admin.ModelAdmin):
    list_display = ("store", "product", "qty", "last_movement_at")
    list_filter = ("store",)
    search_fields = ("product__name", "product__barcode", "store__code")
    readonly_fields = ("id", "created_on", "updated_on", "last_movement_at")
