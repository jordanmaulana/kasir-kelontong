import csv
import re
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import BarcodeCatalog

BARCODE_RE = re.compile(r"^[A-Za-z0-9-]{1,64}$")
BATCH_SIZE = 1000


class Command(BaseCommand):
    help = "Import barcode → product name pairs from a CSV into BarcodeCatalog (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            nargs="?",
            default=str(Path(settings.BASE_DIR) / "products.csv"),
            help="Path to CSV with columns: barcode,name (default: <BASE_DIR>/products.csv)",
        )

    def handle(self, *args, **options):
        path = Path(options["csv_path"])
        if not path.exists():
            raise CommandError(f"CSV not found: {path}")

        created = 0
        updated = 0
        skipped = 0
        batch: list[BarcodeCatalog] = []

        with path.open(newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            if (
                reader.fieldnames is None
                or "barcode" not in reader.fieldnames
                or "name" not in reader.fieldnames
            ):
                raise CommandError("CSV must have headers: barcode,name")

            for row in reader:
                barcode = (row.get("barcode") or "").strip()
                name = (row.get("name") or "").strip()
                if not barcode or not name or not BARCODE_RE.match(barcode):
                    skipped += 1
                    continue
                batch.append(BarcodeCatalog(barcode=barcode, name=name[:200]))
                if len(batch) >= BATCH_SIZE:
                    c, u = self._flush(batch)
                    created += c
                    updated += u
                    batch = []

            if batch:
                c, u = self._flush(batch)
                created += c
                updated += u

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog import done. created={created} updated={updated} skipped={skipped}"
            )
        )

    @staticmethod
    def _flush(batch: list[BarcodeCatalog]) -> tuple[int, int]:
        existing = set(
            BarcodeCatalog.objects.filter(barcode__in=[b.barcode for b in batch]).values_list(
                "barcode", flat=True
            )
        )
        with transaction.atomic():
            BarcodeCatalog.objects.bulk_create(
                batch,
                update_conflicts=True,
                unique_fields=["barcode"],
                update_fields=["name"],
            )
        created = sum(1 for b in batch if b.barcode not in existing)
        updated = len(batch) - created
        return created, updated
