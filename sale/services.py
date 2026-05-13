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
def create_sale(*, store, cashier, lines, tendered):
    if not lines:
        raise SaleValidationError("Minimal 1 item")

    product_ids = [line["product_id"] for line in lines]
    if len(set(product_ids)) != len(product_ids):
        raise SaleValidationError("Produk duplikat dalam satu transaksi")

    products = {
        p.id: p
        for p in Product.objects.select_for_update().filter(id__in=product_ids, tenant=store.tenant)
    }
    missing = set(product_ids) - set(products.keys())
    if missing:
        raise SaleValidationError(f"Produk tidak ditemukan: {', '.join(sorted(missing))}")

    subtotal = 0
    resolved_lines = []
    for line in lines:
        product = products[line["product_id"]]
        qty = line["qty"]
        unit_price = product.sell_price
        line_total = qty * unit_price
        subtotal += line_total
        resolved_lines.append(
            {
                "product": product,
                "qty": qty,
                "unit_price": unit_price,
                "line_total": line_total,
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
        )
        record_movement(
            store=store,
            product=resolved["product"],
            delta=-resolved["qty"],
            reason=StockReason.SALE,
            actor=None,
            ref_type="sale",
            ref_id=sale.id,
        )

    return sale
