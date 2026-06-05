import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { cashierSessionAtom } from "@/features/cashier-auth/state";
import { useCashierStock, useCreateSale } from "@/features/sales/hooks";
import type { CashierStockItem, Sale } from "@/features/sales/types";
import { ApiError } from "@/lib/api";

export interface CartLine {
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

export function lineKey(l: Pick<CartLine, "product_id" | "is_bundle">): string {
  return `${l.product_id}:${l.is_bundle ? "B" : "S"}`;
}

export const DENOMINATIONS = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

export const idr = new Intl.NumberFormat("id-ID");

export function usePosPage() {
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

  const canSubmit = lines.length > 0 && tendered >= subtotal && !create.isPending;

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

  return {
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
  };
}
