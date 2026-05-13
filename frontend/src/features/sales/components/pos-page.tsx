import { LogOut, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCashierLogout } from "@/features/cashier-auth/hooks";
import { cashierSessionAtom } from "@/features/cashier-auth/state";
import { SaleSuccessDialog } from "@/features/sales/components/sale-success-dialog";
import { useCashierStock, useCreateSale } from "@/features/sales/hooks";
import type {
  CashierStockItem,
  Sale,
} from "@/features/sales/types";
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

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);

export function PosPage() {
  const [session] = useAtom(cashierSessionAtom);
  const logout = useCashierLogout();
  const navigate = useNavigate();

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
        (s) => s.barcode && s.barcode === term && !inCart.has(s.product_id)
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
            : l
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

  const incrementInCart = (productId: string) => {
    const fresh = stockById.get(productId);
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId
          ? { ...l, qty: l.qty + 1, available_qty: fresh?.qty ?? l.available_qty }
          : l
      )
    );
  };

  const updateQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId ? { ...l, qty: Math.max(1, qty) } : l
      )
    );
  };

  const decrementQty = (productId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId
          ? { ...l, qty: Math.max(1, l.qty - 1) }
          : l
      )
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
    // If already in cart by barcode match, bump qty
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
    (l) => l.qty > (stockById.get(l.product_id)?.qty ?? l.available_qty)
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
        onSuccess: (sale) => {
          setCompletedSale(sale);
        },
        onError: (err) => {
          if (err instanceof ApiError) toast.error(err.message);
          else toast.error(err instanceof Error ? err.message : "Gagal");
        },
      }
    );
  };

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate({ to: "/cashier" }),
    });
  };

  if (!session) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {session.store.name} ·{" "}
            <span className="font-mono">{session.store.code}</span>
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Kasir: {session.cashier.display_name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/cashier/pos/sales">Penjualan hari ini</Link>
          </Button>
          <Button variant="outline" onClick={onLogout} disabled={logout.isPending}>
            <LogOut className="mr-1 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Scan barcode atau cari produk (Enter untuk tambah)"
              className="pl-8"
              autoFocus
              inputMode="numeric"
            />
            {candidates.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                {candidates.map((p) => (
                  <button
                    key={p.product_id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => addProduct(p)}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {p.name}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {p.barcode ?? "—"} · Rp{fmtIDR(p.sell_price)} · stok{" "}
                        {p.qty}
                      </span>
                    </span>
                    <Plus className="h-4 w-4 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {lines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-base font-medium text-slate-900">
                Keranjang kosong
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Scan barcode atau ketik nama produk untuk memulai transaksi.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-36 text-right">Qty</TableHead>
                  <TableHead className="w-28 text-right">Harga</TableHead>
                  <TableHead className="w-32 text-right">Subtotal</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => {
                  const liveStock =
                    stockById.get(line.product_id)?.qty ?? line.available_qty;
                  const overstocked = line.qty > liveStock;
                  return (
                    <TableRow
                      key={line.product_id}
                      className={cn(overstocked && "bg-red-50")}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {line.product_name}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {line.barcode ?? "—"} · stok {liveStock}
                          {overstocked && (
                            <span className="ml-2 text-red-600">
                              melebihi stok
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => decrementQty(line.product_id)}
                            aria-label="Kurangi qty"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={line.qty}
                            onChange={(e) =>
                              updateQty(line.product_id, Number(e.target.value))
                            }
                            className="w-16 text-center"
                          />
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => incrementInCart(line.product_id)}
                            aria-label="Tambah qty"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        Rp{fmtIDR(line.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        Rp{fmtIDR(line.qty * line.unit_price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Hapus ${line.product_name}`}
                          onClick={() => removeLine(line.product_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-base font-medium text-slate-900">Ringkasan</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Jumlah item</dt>
              <dd className="font-mono">{lines.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Total unit</dt>
              <dd className="font-mono">
                {lines.reduce((s, l) => s + l.qty, 0)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="text-slate-900 font-medium">Total bayar</dt>
              <dd className="font-mono text-base font-semibold">
                Rp{fmtIDR(subtotal)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 space-y-2">
            <Label htmlFor="tendered">Uang tunai diterima</Label>
            <Input
              id="tendered"
              type="number"
              inputMode="numeric"
              min={0}
              value={tendered === 0 ? "" : tendered}
              onChange={(e) => setTendered(Number(e.target.value || 0))}
              placeholder="0"
              className="text-right font-mono text-lg"
            />
            <div className="grid grid-cols-3 gap-1">
              {[500, 1000, 2000, 5000, 10000, 20000, 50000, 100000].map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setTendered((t) => t + preset)}
                >
                  +{fmtIDR(preset)}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Kembalian</span>
              <span
                className={cn(
                  "font-mono text-2xl font-semibold",
                  tendered >= subtotal && subtotal > 0
                    ? "text-emerald-700"
                    : "text-slate-400"
                )}
              >
                Rp{fmtIDR(change)}
              </span>
            </div>
            {tendered > 0 && tendered < subtotal && (
              <p className="mt-1 text-xs text-red-600">
                Uang tunai kurang Rp{fmtIDR(subtotal - tendered)}
              </p>
            )}
          </div>

          <Button
            className="mt-5 h-12 w-full text-base"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {create.isPending ? "Memproses…" : "Bayar"}
          </Button>
          <Button
            className="mt-2 w-full"
            variant="outline"
            disabled={lines.length === 0 || create.isPending}
            onClick={reset}
          >
            Bersihkan keranjang
          </Button>
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
    </div>
  );
}
