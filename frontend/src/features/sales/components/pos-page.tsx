import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/ui/money";
import { CashierShell } from "@/components/layout/cashier-shell";
import { cashierSessionAtom } from "@/features/cashier-auth/state";
import { SaleSuccessDialog } from "@/features/sales/components/sale-success-dialog";
import { useCashierStock, useCreateSale } from "@/features/sales/hooks";
import type { CashierStockItem, Sale } from "@/features/sales/types";
import { ApiError } from "@/lib/api";
import { formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CartLine {
  product_id: string;
  product_name: string;
  barcode: string | null;
  qty: number;
  unit_price: number;
  available_qty: number;
  is_bundle: boolean;
  single_price: number;
  bundle_qty: number | null;
  bundle_price: number | null;
  bundle_label: string | null;
  is_weighted: boolean;
  unit_label: string;
}

function lineKey(l: Pick<CartLine, "product_id" | "is_bundle">): string {
  return `${l.product_id}:${l.is_bundle ? "B" : "S"}`;
}

function stockNeeded(line: CartLine): number {
  return line.is_bundle && line.bundle_qty ? line.qty * line.bundle_qty : line.qty;
}

const DENOMINATIONS = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

const idr = new Intl.NumberFormat("id-ID");

export function PosPage() {
  const [session] = useAtom(cashierSessionAtom);

  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [tendered, setTendered] = useState<number>(0);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: stock } = useCashierStock(search.trim() ? search : undefined);
  const create = useCreateSale();

  const stockById = useMemo(() => {
    const map = new Map<string, CashierStockItem>();
    for (const s of stock ?? []) map.set(s.product_id, s);
    return map;
  }, [stock]);

  const cartKeys = useMemo(() => new Set(lines.map(lineKey)), [lines]);

  const candidates = useMemo(() => {
    if (!search.trim()) return [];
    return (stock ?? [])
      .filter((s) => {
        const hasBundle = s.bundle_qty != null && s.bundle_price != null;
        const singleIn = cartKeys.has(`${s.product_id}:S`);
        const bundleIn = cartKeys.has(`${s.product_id}:B`);
        if (hasBundle) return !(singleIn && bundleIn);
        return !singleIn;
      })
      .slice(0, 6);
  }, [stock, search, cartKeys]);

  const exactBarcodeMatch = useMemo(() => {
    const term = search.trim();
    if (!term) return null;
    return (
      (stock ?? []).find(
        (s) => s.barcode && s.barcode === term && !cartKeys.has(`${s.product_id}:S`),
      ) ?? null
    );
  }, [stock, search, cartKeys]);

  const addProduct = (p: CashierStockItem, asBundle = false) => {
    if (asBundle && (p.bundle_qty == null || p.bundle_price == null)) return;
    setLines((prev) => {
      const targetKey = `${p.product_id}:${asBundle ? "B" : "S"}`;
      const found = prev.find((l) => lineKey(l) === targetKey);
      if (found) {
        return prev.map((l) =>
          lineKey(l) === targetKey
            ? { ...l, qty: l.qty + 1, available_qty: p.qty }
            : l,
        );
      }
      return [
        ...prev,
        {
          product_id: p.product_id,
          product_name: p.name,
          barcode: p.barcode,
          qty: 1,
          unit_price: asBundle ? (p.bundle_price ?? 0) : p.sell_price,
          available_qty: p.qty,
          is_bundle: asBundle,
          single_price: p.sell_price,
          bundle_qty: p.bundle_qty,
          bundle_price: p.bundle_price,
          bundle_label: p.bundle_label,
          is_weighted: p.is_weighted,
          unit_label: p.unit_label,
        },
      ];
    });
    setSearch("");
    searchRef.current?.focus();
  };

  useEffect(() => {
    if (!exactBarcodeMatch) return;
    const p = exactBarcodeMatch;
    const id = setTimeout(() => addProduct(p, false), 0);
    return () => clearTimeout(id);
  }, [exactBarcodeMatch]);

  const stepFor = (l: Pick<CartLine, "is_weighted">) => (l.is_weighted ? 0.25 : 1);

  const incrementInCart = (key: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (lineKey(l) !== key) return l;
        const fresh = stockById.get(l.product_id);
        return { ...l, qty: l.qty + stepFor(l), available_qty: fresh?.qty ?? l.available_qty };
      }),
    );
  };

  const updateQty = (key: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (lineKey(l) !== key) return l;
        const safe = Number.isFinite(qty) ? qty : l.qty;
        const min = l.is_weighted ? 0.01 : 1;
        const next = l.is_weighted
          ? Math.max(min, Math.round(safe * 100) / 100)
          : Math.max(min, Math.floor(safe));
        return { ...l, qty: next };
      }),
    );
  };

  const decrementQty = (key: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (lineKey(l) !== key) return l;
        const min = l.is_weighted ? 0.01 : 1;
        const next = Math.max(min, l.qty - stepFor(l));
        return { ...l, qty: l.is_weighted ? Math.round(next * 100) / 100 : next };
      }),
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  };

  const toggleBundle = (key: string) => {
    setLines((prev) => {
      const target = prev.find((l) => lineKey(l) === key);
      if (!target) return prev;
      if (target.bundle_qty == null || target.bundle_price == null) return prev;
      const nextIsBundle = !target.is_bundle;
      const otherKey = `${target.product_id}:${nextIsBundle ? "B" : "S"}`;
      const collision = prev.some((l) => lineKey(l) === otherKey);
      if (collision) {
        toast.error(
          nextIsBundle
            ? `Baris ${target.bundle_label ?? "bundel"} sudah ada — ubah qty di sana`
            : "Baris satuan sudah ada — ubah qty di sana",
        );
        return prev;
      }
      const nextUnitPrice = nextIsBundle ? target.bundle_price : target.single_price;
      const liveStock = stockById.get(target.product_id)?.qty ?? target.available_qty;
      const needed = nextIsBundle ? target.qty * target.bundle_qty : target.qty;
      if (needed > liveStock) {
        toast.error(
          nextIsBundle
            ? `Stok tidak cukup untuk ${target.bundle_label ?? "bundel"}`
            : "Stok tidak cukup",
        );
        return prev;
      }
      return prev.map((l) =>
        lineKey(l) === key
          ? { ...l, is_bundle: nextIsBundle, unit_price: nextUnitPrice }
          : l,
      );
    });
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (exactBarcodeMatch) {
      addProduct(exactBarcodeMatch, false);
      return;
    }
    const term = search.trim();
    if (term) {
      const existing = lines.find((l) => !l.is_bundle && l.barcode === term);
      if (existing) {
        incrementInCart(lineKey(existing));
        setSearch("");
        return;
      }
    }
    if (candidates.length === 1) {
      addProduct(candidates[0], false);
    }
  };

  const subtotal = lines.reduce((s, l) => s + Math.round(l.qty * l.unit_price), 0);
  const change = Math.max(0, tendered - subtotal);

  const neededByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lines) {
      map.set(l.product_id, (map.get(l.product_id) ?? 0) + stockNeeded(l));
    }
    return map;
  }, [lines]);

  const overProducts = useMemo(() => {
    const set = new Set<string>();
    for (const [pid, need] of neededByProduct) {
      const stockQty =
        stockById.get(pid)?.qty ??
        lines.find((l) => l.product_id === pid)?.available_qty ??
        0;
      if (need > stockQty) set.add(pid);
    }
    return set;
  }, [neededByProduct, stockById, lines]);

  const hasOverstockedLine = overProducts.size > 0;

  const canSubmit =
    lines.length > 0 &&
    !hasOverstockedLine &&
    tendered >= subtotal &&
    !create.isPending;

  const reset = () => {
    setLines([]);
    setTendered(0);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const onSubmit = () => {
    create.mutate(
      {
        lines: lines.map((l) => ({
          product_id: l.product_id,
          qty: l.qty,
          is_bundle: l.is_bundle,
        })),
        tendered,
      },
      {
        onSuccess: (sale) => setCompletedSale(sale),
        onError: (err) => {
          if (err instanceof ApiError) toast.error(err.message);
          else toast.error(err instanceof Error ? err.message : "Gagal");
        },
      },
    );
  };

  if (!session) return null;

  return (
    <CashierShell maxWidth="6xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="space-y-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Scan barcode atau ketik nama produk…"
              className="h-16 pl-14 pr-4 text-xl"
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
            <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-12 text-center">
              <h3 className="text-xl font-bold text-foreground">Keranjang kosong</h3>
              <p className="mt-2 text-base text-muted-foreground">
                Scan barcode atau ketik nama produk untuk memulai transaksi.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => {
                const key = lineKey(line);
                const liveStock =
                  stockById.get(line.product_id)?.qty ?? line.available_qty;
                const overstocked = overProducts.has(line.product_id);
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
                    className={cn(
                      "rounded-lg border-2 bg-card p-5 shadow-sm transition-colors",
                      overstocked
                        ? "border-destructive/60 bg-destructive/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          {overstocked && (
                            <span className="ml-2 font-bold text-destructive">
                              stok kurang
                            </span>
                          )}
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

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-6 shadow-md">
            <div className="border-b border-border pb-5">
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

            <div className="mt-5 space-y-3">
              <Label htmlFor="tendered">Uang dari Pembeli</Label>
              <Input
                id="tendered"
                type="number"
                inputMode="numeric"
                min={0}
                value={tendered === 0 ? "" : tendered}
                onChange={(e) => setTendered(Number(e.target.value || 0))}
                placeholder="0"
                className="h-14 text-right font-mono text-2xl"
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {DENOMINATIONS.map((preset) => (
                  <Button
                    key={preset}
                    size="default"
                    variant="outline"
                    type="button"
                    className="h-12 px-3 text-base"
                    onClick={() => setTendered((t) => t + preset)}
                  >
                    + {idr.format(preset)}
                  </Button>
                ))}
                <Button
                  size="default"
                  variant="ghost"
                  type="button"
                  className="h-12 col-span-2 sm:col-span-3 lg:col-span-2 px-3 text-base text-muted-foreground hover:text-foreground"
                  onClick={() => setTendered(subtotal)}
                  disabled={subtotal === 0}
                >
                  Uang pas
                </Button>
              </div>
            </div>

            <div className="mt-5 rounded-md bg-muted p-4">
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

            <Button
              variant="accent"
              size="xl"
              className="mt-5 w-full"
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              {create.isPending ? "Memproses…" : "Bayar Sekarang"}
            </Button>
            <Button
              variant="outline"
              size="default"
              className="mt-3 w-full"
              disabled={lines.length === 0 || create.isPending}
              onClick={reset}
            >
              Kosongkan Keranjang
            </Button>
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
