import { Search, SlidersHorizontal } from "lucide-react";
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
import { AdjustmentDialog } from "@/features/stock/components/adjustment-dialog";
import { useStock } from "@/features/stock/hooks";
import type { StockItem } from "@/features/stock/types";
import { formatIDR } from "@/features/stock/format";

interface Props {
  storeId: string;
}

export function StockTab({ storeId }: Props) {
  const [q, setQ] = useState("");
  const { data: items, isLoading, isError, error } = useStock(storeId, q);
  const [target, setTarget] = useState<StockItem | null>(null);

  const empty = useMemo(() => !items || items.length === 0, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-slate-900">Stok per toko</h2>
          <p className="text-sm text-slate-600">
            Jumlah saat ini per produk. Klik "Sesuaikan" untuk koreksi manual.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / barcode"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Gagal memuat stok"}
        </p>
      ) : empty ? (
        <EmptyState hasQuery={q.length > 0} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="w-32 font-mono text-xs">Barcode</TableHead>
              <TableHead className="w-24 text-right">Harga</TableHead>
              <TableHead className="w-20 text-right">Stok</TableHead>
              <TableHead className="w-40">Pergerakan terakhir</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items!.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell className="font-medium text-slate-900">
                  {item.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {item.barcode ?? "—"}
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {formatIDR(item.sell_price)}
                </TableCell>
                <TableCell className="text-right">
                  <QtyBadge qty={item.qty} />
                </TableCell>
                <TableCell className="text-slate-500">
                  {item.last_movement_at
                    ? new Date(item.last_movement_at).toLocaleString("id-ID")
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTarget(item)}
                  >
                    <SlidersHorizontal className="mr-1 h-4 w-4" />
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

function QtyBadge({ qty }: { qty: number }) {
  const cls =
    qty <= 0
      ? "bg-red-50 text-red-700"
      : qty < 5
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {qty}
    </span>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-base font-medium text-slate-900">
        {hasQuery ? "Tidak ada produk cocok" : "Belum ada produk"}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        {hasQuery
          ? "Coba kata kunci lain atau hapus filter."
          : "Tambahkan produk di menu Katalog dulu, lalu lakukan penerimaan stok."}
      </p>
    </div>
  );
}
