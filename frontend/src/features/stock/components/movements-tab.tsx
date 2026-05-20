import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/features/products/hooks";
import { useMovements } from "@/features/stock/hooks";
import type { StockMovement, StockReason } from "@/features/stock/types";
import { formatQty } from "@/lib/format";

const LIMIT = 200;

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

type ReasonFilter = StockReason | "all";

const REASON_LABEL: Record<ReasonFilter, string> = {
  all: "Semua",
  receiving: "Penerimaan",
  sale: "Penjualan",
  adjustment: "Penyesuaian",
  void: "Void",
};

const REASON_ORDER: ReasonFilter[] = ["all", "receiving", "sale", "adjustment", "void"];

const REASON_BADGE: Record<StockReason, string> = {
  receiving:
    "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] ring-1 ring-[color:var(--color-success)]/30",
  sale: "bg-accent text-accent-foreground ring-1 ring-accent-foreground/20",
  adjustment:
    "bg-[color:var(--color-warning)]/12 text-[color:var(--color-warning)] ring-1 ring-[color:var(--color-warning)]/30",
  void: "bg-destructive/12 text-destructive ring-1 ring-destructive/30",
};

interface Props {
  storeId: string;
}

export function MovementsTab({ storeId }: Props) {
  const [reason, setReason] = useState<ReasonFilter>("all");
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<{ id: string; name: string } | null>(null);

  const {
    data: movements,
    isLoading,
    isError,
    error,
  } = useMovements(storeId, {
    reason: reason === "all" ? undefined : reason,
    product: productFilter?.id,
    limit: LIMIT,
  });

  const { data: products } = useProducts(
    !productFilter && productQuery.trim() ? { q: productQuery, pageSize: 6 } : undefined,
  );

  const candidates = useMemo(() => {
    if (productFilter || !productQuery.trim()) return [];
    return (products?.results ?? []).slice(0, 6);
  }, [products, productQuery, productFilter]);

  const empty = !movements || movements.length === 0;
  const atLimit = movements?.length === LIMIT;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Riwayat Stok</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Catatan semua perubahan stok di toko ini.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {REASON_ORDER.map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant={reason === r ? "default" : "outline"}
              onClick={() => setReason(r)}
            >
              {REASON_LABEL[r]}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          {productFilter ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-base font-semibold text-accent-foreground">
              {productFilter.name}
              <button
                type="button"
                onClick={() => {
                  setProductFilter(null);
                  setProductQuery("");
                }}
                className="inline-flex size-5 items-center justify-center rounded-full hover:bg-accent-foreground/10"
                aria-label="Hapus filter produk"
              >
                <X className="size-4" />
              </button>
            </span>
          ) : (
            <>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Filter produk (nama / barcode)"
                className="pl-12"
              />
              {candidates.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                  {candidates.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductFilter({ id: p.id, name: p.name });
                        setProductQuery("");
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-base hover:bg-accent"
                    >
                      <span className="font-semibold text-foreground">{p.name}</span>
                      {p.barcode && (
                        <span className="font-mono text-sm text-muted-foreground">
                          {p.barcode}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {atLimit && (
        <p className="text-sm text-muted-foreground">
          Menampilkan {LIMIT} terakhir — perketat filter untuk hasil lebih spesifik.
        </p>
      )}

      {isLoading ? (
        <p className="text-base text-muted-foreground">Memuat…</p>
      ) : isError ? (
        <p className="text-base font-semibold text-destructive">
          {error instanceof Error ? error.message : "Gagal memuat riwayat"}
        </p>
      ) : empty ? (
        <EmptyState />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Waktu</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="w-32">Alasan</TableHead>
              <TableHead className="w-28 text-right">Δ Qty</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="w-56">Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements!.map((m) => (
              <MovementRow key={m.id} m={m} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function MovementRow({ m }: { m: StockMovement }) {
  const delta = Number(m.delta);
  const deltaCls =
    delta > 0
      ? "text-[color:var(--color-success)]"
      : delta < 0
        ? "text-destructive"
        : "text-muted-foreground";
  const sign = delta > 0 ? "+" : "";
  return (
    <TableRow className="h-14">
      <TableCell className="text-muted-foreground">
        {dateFmt.format(new Date(m.created_on))}
      </TableCell>
      <TableCell>
        <div className="font-semibold text-foreground">{m.product_name}</div>
        {m.barcode && (
          <div className="font-mono text-sm text-muted-foreground">{m.barcode}</div>
        )}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold ${REASON_BADGE[m.reason]}`}
        >
          {REASON_LABEL[m.reason]}
        </span>
      </TableCell>
      <TableCell className={`text-right font-bold tabular-nums ${deltaCls}`}>
        {sign}
        {formatQty(delta, { isWeighted: false, unitLabel: "" })}
      </TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground" title={m.note || undefined}>
        {m.note || "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">{m.actor_email ?? "—"}</TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-10 text-center">
      <h3 className="text-lg font-bold text-foreground">Belum ada pergerakan</h3>
      <p className="mt-2 text-base text-muted-foreground">
        Belum ada pergerakan untuk filter ini.
      </p>
    </div>
  );
}
