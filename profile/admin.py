from profile.models import Profile

from django.contrib import admin


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "onboarded", "created_on")
    list_filter = ("onboarded",)
    search_fields = ("user__username", "user__email")
