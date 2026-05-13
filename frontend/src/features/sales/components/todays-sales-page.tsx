import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cashierSessionAtom } from "@/features/cashier-auth/state";
import { useTodaysSales } from "@/features/sales/hooks";

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export function TodaysSalesPage() {
  const [session] = useAtom(cashierSessionAtom);
  const { data, isLoading } = useTodaysSales();

  if (!session) return null;

  const totalRevenue = (data ?? []).reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="space-y-6">
      <div>
        <Button size="sm" variant="ghost" asChild className="-ml-3">
          <Link to="/cashier/pos">
            <ArrowLeft className="size-5" />
            Kembali ke Kasir
          </Link>
        </Button>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Penjualan Hari Ini
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {session.cashier.display_name} · {session.store.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Jumlah Transaksi
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            {data?.length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Total Pendapatan
          </p>
          <div className="mt-2">
            <Money value={totalRevenue} size="2xl" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-base text-muted-foreground">Memuat…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-12 text-center">
          <h2 className="text-xl font-bold text-foreground">Belum ada transaksi</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Transaksi hari ini akan muncul di sini saat Anda mulai berjualan.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Waktu</TableHead>
              <TableHead className="w-20 text-right">Item</TableHead>
              <TableHead className="w-40 text-right">Total</TableHead>
              <TableHead className="w-40 text-right">Diterima</TableHead>
              <TableHead className="w-40 text-right">Kembalian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="h-16">
                <TableCell className="font-mono text-base text-muted-foreground">
                  {timeFmt.format(new Date(row.created_on))}
                </TableCell>
                <TableCell className="text-right font-mono">{row.line_count}</TableCell>
                <TableCell className="text-right">
                  <Money value={row.subtotal} size="base" />
                </TableCell>
                <TableCell className="text-right">
                  <Money value={row.tendered} size="base" muted />
                </TableCell>
                <TableCell className="text-right">
                  <Money
                    value={row.change}
                    size="base"
                    className="text-[color:var(--color-success)]"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
