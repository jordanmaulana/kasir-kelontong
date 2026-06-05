from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction

from product.models import Product
from sale.models import Sale, SaleLine
from stock.models import StockReason
from stock.services import record_movement


class InsufficientTenderError(Exception):
    """Raised when tendered amount is less than subtotal."""


class SaleValidationError(Exception):
    """Raised when sale input is invalid (unknown product, cross-tenant, etc.)."""


@transaction.atomic
def create_sale(*, store, cashier, lines, tendered, amount=None):
    if not lines:
        if amount is None:
            raise SaleValidationError("Minimal 1 item")
        subtotal = int(amount)
        if subtotal <= 0:
            raise SaleValidationError("Total harus lebih dari 0")
        if tendered < subtotal:
            raise InsufficientTenderError(
                f"Uang tunai kurang: butuh {subtotal}, diterima {tendered}"
            )
        return Sale.objects.create(
            store=store,
            cashier=cashier,
            subtotal=subtotal,
            tendered=tendered,
            change=tendered - subtotal,
        )

    product_ids = [line["product_id"] for line in lines]
    keys = [(line["product_id"], bool(line.get("is_bundle", False))) for line in lines]
    if len(set(keys)) != len(keys):
        raise SaleValidationError("Baris duplikat dalam satu transaksi")

    products = {
        p.id: p
        for p in Product.objects.select_for_update().filter(
            id__in=product_ids, tenant=store.tenant, archived_at__isnull=True
        )
    }
    missing = set(product_ids) - set(products.keys())
    if missing:
        raise SaleValidationError(f"Produk tidak ditemukan: {', '.join(sorted(missing))}")

    subtotal = 0
    resolved_lines = []
    for line in lines:
        product = products[line["product_id"]]
        qty = Decimal(str(line["qty"]))
        if qty <= 0:
            raise SaleValidationError(f"Jumlah {product.name} harus lebih dari 0")
        is_bundle = bool(line.get("is_bundle", False))
        if product.is_weighted and is_bundle:
            raise SaleValidationError(f"Produk timbang {product.name} tidak mendukung bundel")
        if not product.is_weighted and qty != qty.to_integral_value():
            raise SaleValidationError(f"Produk {product.name} hanya bisa dijual dalam satuan utuh")
        if is_bundle:
            if not product.has_bundle:
                raise SaleValidationError(f"Produk {product.name} tidak memiliki bundel")
            unit_price = product.bundle_price
            bundle_qty_snap = product.bundle_qty
            stock_delta = -(qty * bundle_qty_snap)
        else:
            unit_price = product.sell_price
            bundle_qty_snap = None
            stock_delta = -qty
        line_total = int((qty * unit_price).to_integral_value(rounding=ROUND_HALF_UP))
        subtotal += line_total
        resolved_lines.append(
            {
                "product": product,
                "qty": qty,
                "unit_price": unit_price,
                "line_total": line_total,
                "is_bundle": is_bundle,
                "bundle_qty": bundle_qty_snap,
                "stock_delta": stock_delta,
            }
        )

    if tendered < subtotal:
        raise InsufficientTenderError(f"Uang tunai kurang: butuh {subtotal}, diterima {tendered}")

    change = tendered - subtotal

    sale = Sale.objects.create(
        store=store,
        cashier=cashier,
        subtotal=subtotal,
        tendered=tendered,
        change=change,
    )

    for resolved in resolved_lines:
        SaleLine.objects.create(
            sale=sale,
            product=resolved["product"],
            qty=resolved["qty"],
            unit_price=resolved["unit_price"],
            line_total=resolved["line_total"],
            is_bundle=resolved["is_bundle"],
            bundle_qty=resolved["bundle_qty"],
        )
        record_movement(
            store=store,
            product=resolved["product"],
            delta=resolved["stock_delta"],
            reason=StockReason.SALE,
            actor=None,
            ref_type="sale",
            ref_id=sale.id,
        )

    return sale
