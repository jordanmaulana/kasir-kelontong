import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdjustmentDialog } from "@/features/stock/components/adjustment-dialog";
import { useStock } from "@/features/stock/hooks";
import type { StockItem } from "@/features/stock/types";
import { formatQty } from "@/lib/format";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface Props {
  storeId: string;
}

export function StockTab({ storeId }: Props) {
  const [q, setQ] = useState("");
  const { data: items, isLoading, isError, error } = useStock(storeId, q);
  const [target, setTarget] = useState<StockItem | null>(null);

  const empty = useMemo(() => !items || items.length === 0, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Stok per Toko</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Jumlah saat ini per produk. Klik &ldquo;Sesuaikan&rdquo; untuk koreksi manual.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / barcode"
            className="pl-12"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-base text-muted-foreground">Memuat…</p>
      ) : isError ? (
        <p className="text-base font-semibold text-destructive">
          {error instanceof Error ? error.message : "Gagal memuat stok"}
        </p>
      ) : empty ? (
        <EmptyState hasQuery={q.length > 0} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="w-40">Barcode</TableHead>
              <TableHead className="w-32 text-right">Harga</TableHead>
              <TableHead className="w-28 text-right">Stok</TableHead>
              <TableHead className="w-48">Pergerakan Terakhir</TableHead>
              <TableHead className="w-40 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items!.map((item) => (
              <TableRow key={item.product_id} className="h-16">
                <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {item.barcode ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Money value={item.sell_price} size="base" muted />
                </TableCell>
                <TableCell className="text-right">
                  <QtyBadge item={item} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.last_movement_at
                    ? dateFmt.format(new Date(item.last_movement_at))
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setTarget(item)}>
                    <SlidersHorizontal className="size-5" />
                    Sesuaikan
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AdjustmentDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        storeId={storeId}
        item={target}
      />
    </div>
  );
}

function QtyBadge({ item }: { item: StockItem }) {
  const qty = item.qty;
  const cls =
    qty <= 0
      ? "bg-destructive/12 text-destructive ring-1 ring-destructive/30"
      : qty < 5
        ? "bg-[color:var(--color-warning)]/12 text-[color:var(--color-warning)] ring-1 ring-[color:var(--color-warning)]/30"
        : "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] ring-1 ring-[color:var(--color-success)]/30";
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center rounded-md px-3 py-1 text-base font-bold tabular-nums ${cls}`}
    >
      {formatQty(qty, { isWeighted: item.is_weighted, unitLabel: item.unit_label })}
    </span>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-10 text-center">
      <h3 className="text-lg font-bold text-foreground">
        {hasQuery ? "Tidak ada produk cocok" : "Belum ada stok"}
      </h3>
      <p className="mt-2 text-base text-muted-foreground">
        {hasQuery
          ? "Coba kata kunci lain atau hapus pencarian."
          : "Tambahkan produk di menu Katalog, lalu lakukan kulakan untuk mengisi stok."}
      </p>
    </div>
  );
}
