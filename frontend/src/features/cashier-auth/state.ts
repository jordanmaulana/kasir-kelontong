import { atom } from "jotai";

import { getCashierToken } from "@/features/cashier-auth/api";
import type { CashierSession } from "@/features/cashier-auth/types";

export const cashierTokenAtom = atom<string | null>(
  typeof window === "undefined" ? null : getCashierToken()
);

export const cashierSessionAtom = atom<CashierSession | null>(null);
