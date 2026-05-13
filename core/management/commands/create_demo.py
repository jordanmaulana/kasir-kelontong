from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from cashier.models import Cashier
from profile.models import Profile
from store.models import Store
from tenant.models import Tenant


class Command(BaseCommand):
    help = "Create demo store owner, tenant, store, and cashier."

    @transaction.atomic
    def handle(self, *args, **options):
        user, user_created = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"},
        )
        if user_created:
            user.set_password("demo123")
            user.save()

        Profile.objects.get_or_create(user=user, defaults={"onboarded": True})

        tenant, _ = Tenant.objects.get_or_create(
            owner=user, defaults={"name": "Demo Tenant"}
        )

        store, _ = Store.objects.get_or_create(
            tenant=tenant,
            code="DEMO",
            defaults={"name": "Demo Store", "address": "Jl. Contoh No. 1"},
        )

        cashier, cashier_created = Cashier.objects.get_or_create(
            store=store,
            display_name="Demo Cashier",
        )
        if cashier_created:
            cashier.set_pin("1234")
            cashier.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo ready: user={user.username} tenant={tenant.name} "
                f"store={store.code} cashier={cashier.display_name} pin=1234"
            )
        )
