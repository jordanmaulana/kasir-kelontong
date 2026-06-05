import { useAtomValue } from "jotai";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { useCartActions } from "@/features/sales/components/pos-hooks";
import { cartKeysAtom, idr, lineKey, linesAtom } from "@/features/sales/state";
import { formatQty } from "@/lib/format";

export function PosCart() {
  const lines = useAtomValue(linesAtom);
  const cartKeys = useAtomValue(cartKeysAtom);
  const { stockById, incrementInCart, updateQty, decrementQty, removeLine, toggleBundle } =
    useCartActions();

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-6 text-center">
        <h3 className="text-xl font-bold text-foreground">Keranjang kosong</h3>
        <p className="mt-2 text-base text-muted-foreground">
          Scan barcode atau ketik nama produk untuk memulai transaksi.
        </p>
      </div>
    );
  }

  return (
    <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto md:pr-1">
      {lines.map((line) => {
        const key = lineKey(line);
        const liveStock = stockById.get(line.product_id)?.qty ?? line.available_qty;
        const hasBundleConfig = line.bundle_qty != null && line.bundle_price != null;
        const otherVariantInCart = cartKeys.has(
          `${line.product_id}:${line.is_bundle ? "S" : "B"}`,
        );
        const priceLabel = line.is_bundle
          ? `/${line.bundle_label ?? "bundel"}`
          : `/${line.unit_label || "pcs"}`;
        return (
          <li
            key={key}
            className="rounded-lg border-2 border-border bg-card p-3 shadow-sm transition-colors"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-foreground">
                  {line.product_name}
                  {line.is_bundle && line.bundle_label && (
                    <span className="ml-2 rounded bg-accent/15 px-2 py-0.5 text-sm font-semibold text-accent">
                      {line.bundle_label} × {line.bundle_qty}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-mono">{line.barcode ?? "—"}</span>
                  <span className="mx-2">·</span>
                  <Money value={line.unit_price} size="sm" muted /> {priceLabel}
                  <span className="mx-2">·</span>
                  stok{" "}
                  {formatQty(liveStock, {
                    isWeighted: line.is_weighted,
                    unitLabel: line.unit_label,
                  })}
                </p>
                {hasBundleConfig && !otherVariantInCart && (
                  <button
                    type="button"
                    onClick={() => toggleBundle(key)}
                    className="mt-2 inline-flex items-center gap-1 rounded border border-accent/40 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10"
                  >
                    {line.is_bundle
                      ? "Ganti ke satuan"
                      : `Ganti ke ${line.bundle_label ?? "bundel"} (${line.bundle_qty} pcs · ${idr.format(line.bundle_price ?? 0)})`}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => decrementQty(key)}
                    aria-label="Kurangi qty"
                  >
                    <Minus className="size-5" />
                  </Button>
                  <Input
                    type="number"
                    inputMode={line.is_weighted ? "decimal" : "numeric"}
                    min={line.is_weighted ? 0.01 : 1}
                    step={line.is_weighted ? 0.25 : 1}
                    value={line.qty}
                    onChange={(e) => updateQty(key, Number(e.target.value))}
                    className="h-12 w-24 text-center font-mono text-xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => incrementInCart(key)}
                    aria-label="Tambah qty"
                  >
                    <Plus className="size-5" />
                  </Button>
                  {line.is_weighted && (
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                      {line.unit_label}
                    </span>
                  )}
                </div>
                <div className="min-w-28 text-right">
                  <Money value={Math.round(line.qty * line.unit_price)} size="lg" />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Hapus ${line.product_name}`}
                  onClick={() => removeLine(key)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
