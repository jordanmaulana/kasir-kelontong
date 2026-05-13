import { Link, createFileRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ListChecks, ScanLine } from "lucide-react";

import { CashierShell } from "@/components/layout/cashier-shell";
import { CashierGate } from "@/features/cashier-auth/components/cashier-gate";
import { cashierSessionAtom } from "@/features/cashier-auth/state";

export const Route = createFileRoute("/cashier/home")({
  component: () => (
    <CashierGate>
      <CashierShell maxWidth="4xl">
        <CashierHome />
      </CashierShell>
    </CashierGate>
  ),
});

function CashierHome() {
  const [session] = useAtom(cashierSessionAtom);
  if (!session) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Beranda Kasir
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Halo, {session.cashier.display_name}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Anda sudah masuk di toko{" "}
          <span className="font-semibold text-foreground">{session.store.name}</span>.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          to="/cashier/pos"
          className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-md"
        >
          <div className="flex size-14 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
            <ScanLine className="size-7" strokeWidth={2.4} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Mulai Transaksi
          </span>
          <span className="text-base text-muted-foreground">
            Buka layar kasir. Scan barcode atau cari produk untuk mulai berjualan.
          </span>
          <span className="mt-2 inline-flex items-center text-base font-bold text-foreground underline decoration-2 underline-offset-4 group-hover:decoration-accent">
            Buka kasir →
          </span>
        </Link>

        <Link
          to="/cashier/pos/sales"
          className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-md"
        >
          <div className="flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ListChecks className="size-7" strokeWidth={2.4} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Penjualan Hari Ini
          </span>
          <span className="text-base text-muted-foreground">
            Lihat daftar transaksi yang sudah Anda kerjakan hari ini.
          </span>
          <span className="mt-2 inline-flex items-center text-base font-bold text-foreground underline decoration-2 underline-offset-4 group-hover:decoration-accent">
            Lihat penjualan →
          </span>
        </Link>
      </div>
    </div>
  );
}
