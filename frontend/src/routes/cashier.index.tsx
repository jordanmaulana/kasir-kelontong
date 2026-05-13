import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ChevronLeft } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <CashierLoginForm />
        <p className="mt-6 text-sm text-slate-600">
          Anda admin?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Masuk sebagai Admin
          </Link>
        </p>
      </div>
    </div>
  );
}
