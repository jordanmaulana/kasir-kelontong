import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ListChecks, LogOut, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CashierGate } from "@/features/cashier-auth/components/cashier-gate";
import { useCashierLogout } from "@/features/cashier-auth/hooks";
import { cashierSessionAtom } from "@/features/cashier-auth/state";

export const Route = createFileRoute("/cashier/home")({
  component: () => (
    <CashierGate>
      <CashierHome />
    </CashierGate>
  ),
});

function CashierHome() {
  const [session] = useAtom(cashierSessionAtom);
  const logout = useCashierLogout();
  const navigate = useNavigate();

  if (!session) return null;

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate({ to: "/cashier" }),
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Toko</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {session.store.name}{" "}
          <span className="font-mono text-base text-slate-500">
            ({session.store.code})
          </span>
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          Halo,{" "}
          <span className="font-medium text-slate-900">
            {session.cashier.display_name}
          </span>
          . Anda sudah masuk.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/cashier/pos"
            className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <ScanLine className="h-7 w-7 text-emerald-600" />
            <span className="text-base font-medium text-slate-900">
              Mulai transaksi
            </span>
            <span className="text-xs text-slate-600">
              Buka layar kasir untuk scan barcode dan terima pembayaran.
            </span>
          </Link>
          <Link
            to="/cashier/pos/sales"
            className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <ListChecks className="h-7 w-7 text-sky-600" />
            <span className="text-base font-medium text-slate-900">
              Penjualan hari ini
            </span>
            <span className="text-xs text-slate-600">
              Lihat daftar transaksi yang sudah kamu kerjakan hari ini.
            </span>
          </Link>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onLogout} disabled={logout.isPending}>
            <LogOut className="mr-1 h-4 w-4" />
            {logout.isPending ? "Keluar…" : "Keluar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
