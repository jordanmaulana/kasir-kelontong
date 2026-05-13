from django.contrib import admin

from cashier.models import Cashier, CashierSession


@admin.register(Cashier)
class CashierAdmin(admin.ModelAdmin):
    list_display = ("display_name", "store", "active", "last_login_at")
    list_filter = ("active", "store")
    search_fields = ("display_name", "store__code", "store__name")
    readonly_fields = ("id", "pin_hash", "last_login_at", "created_on", "updated_on")


@admin.register(CashierSession)
class CashierSessionAdmin(admin.ModelAdmin):
    list_display = ("cashier", "store", "expires_at", "created_on")
    list_filter = ("store",)
    search_fields = ("cashier__display_name", "token")
    readonly_fields = (
        "id",
        "token",
        "cashier",
        "store",
        "expires_at",
        "created_on",
        "updated_on",
    )

    def has_add_permission(self, request):
        return False
