import { Link, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useTodaysSales } from "@/features/sales/hooks";

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function TodaysSalesPage() {
  const [session] = useAtom(cashierSessionAtom);
  const navigate = useNavigate();
  const logout = useCashierLogout();
  const { data, isLoading } = useTodaysSales();

  if (!session) return null;

  const totalRevenue = (data ?? []).reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Button size="sm" variant="ghost" asChild className="-ml-2 mb-1">
            <Link to="/cashier/pos">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Kembali ke kasir
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-slate-900">
            Penjualan hari ini
          </h1>
          <p className="text-sm text-slate-500">
            {session.cashier.display_name} · {session.store.name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            logout.mutate(undefined, {
              onSettled: () => navigate({ to: "/cashier" }),
            })
          }
        >
          Keluar
        </Button>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Jumlah transaksi</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {data?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Total pendapatan</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900">
            Rp{fmtIDR(totalRevenue)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-slate-500">Memuat…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            Belum ada transaksi hari ini.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Waktu</TableHead>
              <TableHead className="w-20 text-right">Item</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Diterima</TableHead>
              <TableHead className="text-right">Kembalian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm text-slate-600">
                  {fmtTime(row.created_on)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.line_count}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  Rp{fmtIDR(row.subtotal)}
                </TableCell>
                <TableCell className="text-right font-mono text-slate-600">
                  Rp{fmtIDR(row.tendered)}
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-700">
                  Rp{fmtIDR(row.change)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
