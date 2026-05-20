import random
from decimal import Decimal
from profile.models import Profile

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from cashier.models import Cashier
from catalog.models import BarcodeCatalog
from product.models import Product
from stock.models import StockReason, StoreStock
from stock.services import record_movement
from store.models import Store
from tenant.models import Tenant

DEMO_PRODUCT_COUNT = 50
DEMO_STOCK_QTY = Decimal("100")


class Command(BaseCommand):
    help = "Create demo store owner, tenant, store, cashier, products, and stock."

    @transaction.atomic
    def handle(self, *args, **options):
        user, user_created = User.objects.get_or_create(
            username="demo@example.com",
            defaults={"email": "demo@example.com"},
        )
        if user_created:
            user.set_password("demo1234")
            user.save()

        Profile.objects.get_or_create(user=user, defaults={"onboarded": True})

        tenant, _ = Tenant.objects.get_or_create(owner=user, defaults={"name": "Demo Tenant"})

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

        product_count, stock_count = self._seed_products_and_stock(user, tenant, store)

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo ready: user={user.username} tenant={tenant.name} "
                f"store={store.code} cashier={cashier.display_name} pin=1234 "
                f"products={product_count} stocks={stock_count}"
            )
        )

    def _seed_products_and_stock(self, user, tenant, store):
        existing_products = Product.objects.filter(tenant=tenant, archived_at__isnull=True)
        existing_count = existing_products.count()
        needed = DEMO_PRODUCT_COUNT - existing_count

        if needed > 0:
            used_barcodes = set(
                existing_products.exclude(barcode__isnull=True).values_list("barcode", flat=True)
            )
            catalog_qs = BarcodeCatalog.objects.exclude(barcode__in=used_barcodes).order_by("?")[
                :needed
            ]
            catalog_entries = list(catalog_qs)

            if not catalog_entries:
                self.stdout.write(
                    self.style.WARNING(
                        "BarcodeCatalog is empty. Run "
                        "`uv run manage.py import_barcode_catalog products.csv` first, "
                        "then re-run create_demo to seed products."
                    )
                )
            else:
                for entry in catalog_entries:
                    price = random.Random(entry.barcode).randrange(5_000, 50_001, 500)
                    Product.objects.create(
                        tenant=tenant,
                        barcode=entry.barcode,
                        name=entry.name,
                        sell_price=price,
                        unit_label="pcs",
                        actor=user,
                    )

        products = Product.objects.filter(tenant=tenant, archived_at__isnull=True)
        stocked_product_ids = set(
            StoreStock.objects.filter(store=store).values_list("product_id", flat=True)
        )
        for product in products:
            if product.id in stocked_product_ids:
                continue
            record_movement(
                store=store,
                product=product,
                delta=DEMO_STOCK_QTY,
                reason=StockReason.RECEIVING,
                actor=user,
                note="demo seed",
            )

        product_count = products.count()
        stock_count = StoreStock.objects.filter(store=store).count()
        return product_count, stock_count
