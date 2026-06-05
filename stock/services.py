from decimal import Decimal

from django.db import transaction

from stock.models import StockMovement, StoreStock


class OutOfStockError(Exception):
    """Raised when a sale would push stock below zero."""


@transaction.atomic
def record_movement(
    *,
    store,
    product,
    delta,
    reason,
    actor=None,
    ref_type="",
    ref_id="",
    note="",
):
    if product.tenant_id != store.tenant_id:
        raise ValueError("Product and store belong to different tenants")
    delta = Decimal(delta)
    stock, _ = StoreStock.objects.select_for_update().get_or_create(
        store=store,
        product=product,
        defaults={"qty": Decimal("0")},
    )
    new_qty = stock.qty + delta
    movement = StockMovement.objects.create(
        store=store,
        product=product,
        delta=delta,
        reason=reason,
        ref_type=ref_type,
        ref_id=ref_id,
        note=note,
        actor=actor,
    )
    stock.qty = new_qty
    stock.last_movement_at = movement.created_on
    stock.actor = actor
    stock.save(update_fields=["qty", "last_movement_at", "actor", "updated_on"])
    return movement
