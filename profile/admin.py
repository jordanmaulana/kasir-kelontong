from django.contrib import admin

from profile.models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "onboarded", "created_on")
    list_filter = ("onboarded",)
    search_fields = ("user__username", "user__email")
