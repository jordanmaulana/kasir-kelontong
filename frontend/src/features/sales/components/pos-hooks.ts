import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import { useCashierStock, useCreateSale } from "@/features/sales/hooks";
import {
  cartKeysAtom,
  completedSaleAtom,
  fastAmountAtom,
  fastModeAtom,
  type CartLine,
  lineKey,
  linesAtom,
  searchAtom,
  searchInputRefAtom,
  subtotalAtom,
  tenderedAtom,
} from "@/features/sales/state";
import type { CashierStockItem, Sale } from "@/features/sales/types";
import { ApiError } from "@/lib/api";

/** Builds a product_id → stock-item map from the current cashier-stock query. */
function useStockById() {
  const search = useAtomValue(searchAtom);
  const { data: stock } = useCashierStock(search.trim() ? search : undefined);
  return useMemo(() => {
    const map = new Map<string, CashierStockItem>();
    for (const s of stock ?? []) map.set(s.product_id, s);
    return map;
  }, [stock]);
}

const stepFor = (l: Pick<CartLine, "is_weighted">) => (l.is_weighted ? 0.25 : 1);

/**
 * Cart mutations. Reads live stock from the shared cashier-stock query (same
 * query key as {@link usePosStock}, so the cache is reused) to refresh each
 * line's `available_qty`.
 */
export function useCartActions() {
  const setLines = useSetAtom(linesAtom);
  const setSearch = useSetAtom(searchAtom);
  const searchInput = useAtomValue(searchInputRefAtom);
  const stockById = useStockById();

  const addProduct = (p: CashierStockItem, asBundle = false) => {
    if (asBundle && (p.bundle_qty == null || p.bundle_price == null)) return;
    setLines((prev) => {
      const targetKey = `${p.product_id}:${asBundle ? "B" : "S"}`;
      const found = prev.find((l) => lineKey(l) === targetKey);
      if (found) {
        return prev.map((l) =>
          lineKey(l) === targetKey ? { ...l, qty: l.qty + 1, available_qty: p.qty } : l,
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
    searchInput?.focus();
  };

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
        lineKey(l) === key ? { ...l, is_bundle: nextIsBundle, unit_price: nextUnitPrice } : l,
      );
    });
  };

  return {
    stockById,
    addProduct,
    incrementInCart,
    updateQty,
    decrementQty,
    removeLine,
    toggleBundle,
  };
}

/**
 * Search-driven product lookups: the candidate list, the exact-barcode match,
 * and the effect that auto-adds a scanned barcode.
 */
export function usePosStock() {
  const search = useAtomValue(searchAtom);
  const cartKeys = useAtomValue(cartKeysAtom);
  const { data: stock } = useCashierStock(search.trim() ? search : undefined);
  const { stockById, addProduct } = useCartActions();

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

  useEffect(() => {
    if (!exactBarcodeMatch) return;
    const p = exactBarcodeMatch;
    const id = setTimeout(() => addProduct(p, false), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactBarcodeMatch]);

  return { stockById, candidates, exactBarcodeMatch };
}

/** Submission: pay button enablement, the mutation, and success/error handling. */
export function useCheckout() {
  const lines = useAtomValue(linesAtom);
  const tendered = useAtomValue(tenderedAtom);
  const fastMode = useAtomValue(fastModeAtom);
  const fastAmount = useAtomValue(fastAmountAtom);
  const subtotal = useAtomValue(subtotalAtom);
  const setCompletedSale = useSetAtom(completedSaleAtom);
  const create = useCreateSale();

  const canSubmit =
    (fastMode ? fastAmount > 0 : lines.length > 0) &&
    tendered >= subtotal &&
    !create.isPending;

  const onSubmit = () => {
    const onResult = {
      onSuccess: (sale: Sale) => setCompletedSale(sale),
      onError: (err: unknown) => {
        if (err instanceof ApiError) toast.error(err.message);
        else toast.error(err instanceof Error ? err.message : "Gagal");
      },
    };
    if (fastMode) {
      create.mutate({ amount: fastAmount, tendered }, onResult);
      return;
    }
    create.mutate(
      {
        lines: lines.map((l) => ({
          product_id: l.product_id,
          qty: l.qty,
          is_bundle: l.is_bundle,
        })),
        tendered,
      },
      onResult,
    );
  };

  return { canSubmit, onSubmit, create };
}
