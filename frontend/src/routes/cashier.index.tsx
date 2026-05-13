import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ChevronLeft, Store } from "lucide-react";
import { useEffect } from "react";

import { CashierLoginForm } from "@/features/cashier-auth/components/cashier-login-form";
import { cashierTokenAtom } from "@/features/cashier-auth/state";

export const Route = createFileRoute("/cashier/")({
  component: CashierLoginPage,
});

function CashierLoginPage() {
  const [token] = useAtom(cashierTokenAtom);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate({ to: "/cashier/home" });
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-5" /> Kembali
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="size-5" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            KasirKelontong
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:py-14">
        <CashierLoginForm />
        <div className="mt-8 rounded-lg border-2 border-dashed border-border bg-card/60 px-6 py-4 text-center">
          <p className="text-base text-foreground">Saya pemilik / admin</p>
          <Link
            to="/login"
            className="mt-1 inline-flex text-base font-bold text-foreground underline decoration-2 underline-offset-4 hover:decoration-accent"
          >
            Masuk sebagai Admin →
          </Link>
        </div>
      </main>
    </div>
  );
}
