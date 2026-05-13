import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useEffect } from "react";

import { useCashierMe } from "@/features/cashier-auth/hooks";
import {
  cashierSessionAtom,
  cashierTokenAtom,
} from "@/features/cashier-auth/state";

interface Props {
  children: React.ReactNode;
}

export function CashierGate({ children }: Props) {
  const [token] = useAtom(cashierTokenAtom);
  const [session] = useAtom(cashierSessionAtom);
  const navigate = useNavigate();
  const meQuery = useCashierMe();

  useEffect(() => {
    if (!token) {
      navigate({ to: "/cashier" });
    }
  }, [token, navigate]);

  if (!token) return null;
  if (!session && meQuery.isLoading) {
    return <p className="p-8 text-center text-sm text-slate-500">Memuat…</p>;
  }
  if (!session) return null;
  return <>{children}</>;
}
