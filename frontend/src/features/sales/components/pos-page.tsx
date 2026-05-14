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
import { cn } from "@/lib/utils";

interface CartLine {
  product_id: string;
  product_name: string;
  barcode: string | null;
  qty: number;
  unit_price: number;
  available_qty: number;
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

  const candidates = useMemo(() => {
    if (!search.trim()) return [];
    const inCart = new Set(lines.map((l) => l.product_id));
    return (stock ?? []).filter((s) => !inCart.has(s.product_id)).slice(0, 6);
  }, [stock, search, lines]);

  const exactBarcodeMatch = useMemo(() => {
    const term = search.trim();
    if (!term) return null;
    const inCart = new Set(lines.map((l) => l.product_id));
    return (
      (stock ?? []).find(
        (s) => s.barcode && s.barcode === term && !inCart.has(s.product_id),
      ) ?? null
    );
  }, [stock, search, lines]);

  const addProduct = (p: CashierStockItem) => {
    setLines((prev) => {
      const found = prev.find((l) => l.product_id === p.product_id);
      if (found) {
        return prev.map((l) =>
          l.product_id === p.product_id
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
          unit_price: p.sell_price,
          available_qty: p.qty,
        },
      ];
    });
    setSearch("");
    searchRef.current?.focus();
  };

  useEffect(() => {
    if (!exactBarcodeMatch) return;
    const p = exactBarcodeMatch;
    const id = setTimeout(() => addProduct(p), 0);
    return () => clearTimeout(id);
  }, [exactBarcodeMatch]);

  const incrementInCart = (productId: string) => {
    const fresh = stockById.get(productId);
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId
          ? { ...l, qty: l.qty + 1, available_qty: fresh?.qty ?? l.available_qty }
          : l,
      ),
    );
  };

  const updateQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId ? { ...l, qty: Math.max(1, qty) } : l,
      ),
    );
  };

  const decrementQty = (productId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId ? { ...l, qty: Math.max(1, l.qty - 1) } : l,
      ),
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (exactBarcodeMatch) {
      addProduct(exactBarcodeMatch);
      return;
    }
    const term = search.trim();
    if (term) {
      const existing = lines.find((l) => l.barcode === term);
      if (existing) {
        incrementInCart(existing.product_id);
        setSearch("");
        return;
      }
    }
    if (candidates.length === 1) {
      addProduct(candidates[0]);
    }
  };

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const change = Math.max(0, tendered - subtotal);

  const hasOverstockedLine = lines.some(
    (l) => l.qty > (stockById.get(l.product_id)?.qty ?? l.available_qty),
  );

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
        lines: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
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
                {candidates.map((p) => (
                  <button
                    key={p.product_id}
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted focus-visible:bg-muted focus:outline-none"
                    onClick={() => addProduct(p)}
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-lg font-semibold text-foreground">
                        {p.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-mono">{p.barcode ?? "—"}</span>
                        <span className="mx-2">·</span>
                        <Money value={p.sell_price} size="sm" />
                        <span className="mx-2">·</span>
                        <span>stok {p.qty}</span>
                      </span>
                    </span>
                    <Plus className="size-6 shrink-0 text-accent" strokeWidth={2.5} />
                  </button>
                ))}
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
                const liveStock =
                  stockById.get(line.product_id)?.qty ?? line.available_qty;
                const overstocked = line.qty > liveStock;
                return (
                  <li
                    key={line.product_id}
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
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-mono">{line.barcode ?? "—"}</span>
                          <span className="mx-2">·</span>
                          <Money value={line.unit_price} size="sm" muted /> /pcs
                          <span className="mx-2">·</span>
                          stok {liveStock}
                          {overstocked && (
                            <span className="ml-2 font-bold text-destructive">
                              stok kurang
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => decrementQty(line.product_id)}
                            aria-label="Kurangi qty"
                          >
                            <Minus className="size-5" />
                          </Button>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={line.qty}
                            onChange={(e) =>
                              updateQty(line.product_id, Number(e.target.value))
                            }
                            className="h-12 w-20 text-center font-mono text-xl"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => incrementInCart(line.product_id)}
                            aria-label="Tambah qty"
                          >
                            <Plus className="size-5" />
                          </Button>
                        </div>
                        <div className="min-w-28 text-right">
                          <Money value={line.qty * line.unit_price} size="lg" />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${line.product_name}`}
                          onClick={() => removeLine(line.product_id)}
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
                {lines.length} item · {lines.reduce((s, l) => s + l.qty, 0)} unit
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
