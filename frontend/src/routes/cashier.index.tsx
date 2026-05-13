import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
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
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <CashierLoginForm />
    </div>
  );
}
