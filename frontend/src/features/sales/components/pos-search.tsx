import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCartActions,
  usePosStock,
} from "@/features/sales/components/pos-hooks";
import { QuickCreateProductDialog } from "@/features/sales/components/quick-create-product-dialog";
import {
  cartKeysAtom,
  idr,
  lineKey,
  linesAtom,
  searchAtom,
  searchInputRefAtom,
} from "@/features/sales/state";
import type { CashierStockItem } from "@/features/sales/types";
import type { Product } from "@/features/products/types";
import { formatQty } from "@/lib/format";

export function PosSearch() {
  const [search, setSearch] = useAtom(searchAtom);
  const lines = useAtomValue(linesAtom);
  const cartKeys = useAtomValue(cartKeysAtom);
  const setSearchInput = useSetAtom(searchInputRefAtom);
  const { candidates, exactBarcodeMatch } = usePosStock();
  const { addProduct, incrementInCart } = useCartActions();
  const [quickCreate, setQuickCreate] = useState<{
    open: boolean;
    barcode: string;
  }>({
    open: false,
    barcode: "",
  });

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
      return;
    }
    if (term && candidates.length === 0) {
      setQuickCreate({ open: true, barcode: term });
    }
  };

  const onProductCreated = (product: Product) => {
    const item: CashierStockItem = {
      product_id: product.id,
      name: product.name,
      barcode: product.barcode,
      sell_price: product.sell_price,
      qty: 0,
      last_movement_at: null,
      bundle_qty: product.bundle_qty,
      bundle_price: product.bundle_price,
      bundle_label: product.bundle_label,
      is_weighted: product.is_weighted,
      unit_label: product.unit_label,
    };
    addProduct(item, false);
  };

  return (
    <div className="relative shrink-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={setSearchInput}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={onSearchKeyDown}
        inputMode="text"
        placeholder="Scan barcode atau ketik nama produk…"
        className="h-10 pl-10 pr-4 text-base"
        autoFocus
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
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-base font-semibold text-foreground">
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
                    size="sm"
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
                      size="sm"
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
      <QuickCreateProductDialog
        open={quickCreate.open}
        barcode={quickCreate.barcode}
        onOpenChange={(open) => setQuickCreate((prev) => ({ ...prev, open }))}
        onCreated={onProductCreated}
      />
    </div>
  );
}
