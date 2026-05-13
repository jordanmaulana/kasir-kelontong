from django.contrib import admin

from tenant.models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_on")
    search_fields = ("name", "owner__username", "owner__email")
    readonly_fields = ("id", "created_on", "updated_on")
