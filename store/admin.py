from django.contrib import admin

from store.models import Store


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "tenant", "created_on")
    list_filter = ("tenant",)
    search_fields = ("code", "name", "tenant__name")
    readonly_fields = ("id", "created_on", "updated_on")
