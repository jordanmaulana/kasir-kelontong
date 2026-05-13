import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { LogOut } from "lucide-react";

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

        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <h2 className="text-base font-medium text-slate-900">
            POS akan hadir di F7
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Halaman checkout barcode + kasir sedang disiapkan.
          </p>
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
