import { Minus, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/ui/money";
import { CashierShell } from "@/components/layout/cashier-shell";
import { SaleSuccessDialog } from "@/features/sales/components/sale-success-dialog";
import { DENOMINATIONS, idr, lineKey, usePosPage } from "@/features/sales/components/pos-page-hooks";
import { formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PosPage() {
  const {
    session,
    search,
    setSearch,
    searchRef,
    lines,
    tendered,
    setTendered,
    completedSale,
    setCompletedSale,
    stockById,
    cartKeys,
    candidates,
    addProduct,
    incrementInCart,
    updateQty,
    decrementQty,
    removeLine,
    toggleBundle,
    onSearchKeyDown,
    onSubmit,
    reset,
    subtotal,
    change,
    canSubmit,
    create,
  } = usePosPage();

  if (!session) return null;

  return (
    <CashierShell maxWidth="6xl" fill>
      <div className="grid gap-4 md:h-full md:min-h-0 lg:grid-cols-[1fr_400px]">
        <section className="flex min-h-0 flex-col gap-3">
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Scan barcode atau ketik nama produk…"
              className="h-12 pl-12 pr-4 text-lg"
              autoFocus
              inputMode="numeric"
            />
            {candidates.length > 0 && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border-2 border-border bg-card shadow-xl">
                {candidates.map((p) => {
                  const hasBundle = p.bundle_qty != null && p.bundle_price != null;
                  const singleIn = cartKeys.has(`${p.product_id}:S`);
                  const bundleIn = cartKeys.has(`${p.product_id}:B`);
                  return (
                    <div
                      key={p.product_id}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-lg font-semibold text-foreground">
                          {p.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          <span className="font-mono">{p.barcode ?? "—"}</span>
                          <span className="mx-2">·</span>
                          <span>
                            stok{" "}
                            {formatQty(p.qty, {
                              isWeighted: p.is_weighted,
                              unitLabel: p.unit_label,
                            })}
                          </span>
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          size="default"
                          variant="outline"
                          disabled={singleIn}
                          onClick={() => addProduct(p, false)}
                        >
                          <Plus className="mr-1 size-4" />
                          Satuan {idr.format(p.sell_price)}
                        </Button>
                        {hasBundle && (
                          <Button
                            type="button"
                            size="default"
                            variant="accent"
                            disabled={bundleIn}
                            onClick={() => addProduct(p, true)}
                          >
                            <Plus className="mr-1 size-4" />
                            {p.bundle_label ?? "Bundel"} {p.bundle_qty}pcs{" "}
                            {idr.format(p.bundle_price ?? 0)}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {lines.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-6 text-center">
              <h3 className="text-xl font-bold text-foreground">Keranjang kosong</h3>
              <p className="mt-2 text-base text-muted-foreground">
                Scan barcode atau ketik nama produk untuk memulai transaksi.
              </p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto md:pr-1">
              {lines.map((line) => {
                const key = lineKey(line);
                const liveStock =
                  stockById.get(line.product_id)?.qty ?? line.available_qty;
                const hasBundleConfig =
                  line.bundle_qty != null && line.bundle_price != null;
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
          )}
        </section>

        <aside className="lg:h-full lg:min-h-0">
          <div className="rounded-lg border border-border bg-card p-4 shadow-md lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
            <div className="border-b border-border pb-3 lg:shrink-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Total Belanja
              </p>
              <div className="mt-2">
                <Money value={subtotal} size="3xl" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {lines.length} item
              </p>
            </div>

            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <div className="mt-4 space-y-3">
              <Label htmlFor="tendered">Uang dari Pembeli</Label>
              <Input
                id="tendered"
                type="number"
                inputMode="numeric"
                min={0}
                value={tendered === 0 ? "" : tendered}
                onChange={(e) => setTendered(Number(e.target.value || 0))}
                placeholder="0"
                className="h-12 text-right font-mono text-xl"
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
                {DENOMINATIONS.map((preset) => (
                  <Button
                    key={preset}
                    size="default"
                    variant="outline"
                    type="button"
                    className="h-10 px-3 text-base"
                    onClick={() => setTendered((t) => t + preset)}
                  >
                    + {idr.format(preset)}
                  </Button>
                ))}
                <Button
                  size="default"
                  variant="ghost"
                  type="button"
                  className="h-10 col-span-2 sm:col-span-3 lg:col-span-3 px-3 text-base text-muted-foreground hover:text-foreground"
                  onClick={() => setTendered(subtotal)}
                  disabled={subtotal === 0}
                >
                  Uang pas
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-muted p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-semibold text-muted-foreground">
                  Kembalian
                </span>
                <Money
                  value={change}
                  size="xl"
                  className={cn(
                    tendered >= subtotal && subtotal > 0
                      ? "text-[color:var(--color-success)]"
                      : "text-muted-foreground/60",
                  )}
                />
              </div>
              {tendered > 0 && tendered < subtotal && (
                <p className="mt-2 text-sm font-bold text-destructive">
                  Kurang <Money value={subtotal - tendered} size="sm" className="text-destructive" />
                </p>
              )}
            </div>

            </div>

            <div className="mt-4 lg:mt-0 lg:shrink-0 lg:pt-4">
              <Button
                variant="accent"
                size="xl"
                className="w-full"
                disabled={!canSubmit}
                onClick={onSubmit}
              >
                {create.isPending ? "Memproses…" : "Bayar Sekarang"}
              </Button>
              <Button
                variant="outline"
                size="default"
                className="mt-2 w-full"
                disabled={lines.length === 0 || create.isPending}
                onClick={reset}
              >
                Kosongkan Keranjang
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {completedSale && (
        <SaleSuccessDialog
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            reset();
          }}
        />
      )}
    </CashierShell>
  );
}
