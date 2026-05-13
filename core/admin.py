from django.contrib import admin

from core.models import (
    AppSetting,
    Cashier,
    CashierSession,
    Profile,
    Store,
    Tenant,
)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_on")
    search_fields = ("name", "owner__username", "owner__email")
    readonly_fields = ("id", "created_on", "updated_on")


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "tenant", "created_on")
    list_filter = ("tenant",)
    search_fields = ("code", "name", "tenant__name")
    readonly_fields = ("id", "created_on", "updated_on")


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


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "onboarded", "created_on")
    list_filter = ("onboarded",)
    search_fields = ("user__username", "user__email")


@admin.register(AppSetting)
class AppSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "str_value", "int_value", "float_value", "bool_value")
    search_fields = ("key",)
