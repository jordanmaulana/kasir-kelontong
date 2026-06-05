import { atom } from "jotai";

import { evalExpr } from "@/features/sales/calc";
import type { Sale } from "@/features/sales/types";

const CALC_OPERATORS = "+-×÷";

export interface CartLine {
  product_id: string;
  product_name: string;
  barcode: string | null;
  qty: number;
  unit_price: number;
  available_qty: number;
  is_bundle: boolean;
  single_price: number;
  bundle_qty: number | null;
  bundle_price: number | null;
  bundle_label: string | null;
  is_weighted: boolean;
  unit_label: string;
}

export function lineKey(l: Pick<CartLine, "product_id" | "is_bundle">): string {
  return `${l.product_id}:${l.is_bundle ? "B" : "S"}`;
}

export const DENOMINATIONS = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

export const idr = new Intl.NumberFormat("id-ID");

// --- Primitive state atoms ------------------------------------------------

export const searchAtom = atom("");
export const linesAtom = atom<CartLine[]>([]);
export const tenderedAtom = atom(0);
export const completedSaleAtom = atom<Sale | null>(null);
export const fastModeAtom = atom(false);
export const fastExprAtom = atom("");

/** Shared handle to the search <input> so any action can refocus it. */
export const searchInputRefAtom = atom<HTMLInputElement | null>(null);

// --- Derived (read-only) atoms --------------------------------------------

export const cartKeysAtom = atom((get) => new Set(get(linesAtom).map(lineKey)));

export const lineSubtotalAtom = atom((get) =>
  get(linesAtom).reduce((s, l) => s + Math.round(l.qty * l.unit_price), 0),
);

export const fastAmountAtom = atom((get) =>
  get(fastModeAtom) ? (evalExpr(get(fastExprAtom)) ?? 0) : 0,
);

export const subtotalAtom = atom((get) =>
  get(fastModeAtom) ? get(fastAmountAtom) : get(lineSubtotalAtom),
);

export const changeAtom = atom((get) => Math.max(0, get(tenderedAtom) - get(subtotalAtom)));

// --- Write-only action atoms (pure client, no server data) ----------------

export const pushCalcAtom = atom(null, (get, set, token: string) => {
  set(fastExprAtom, (expr) => {
    const isOp = token.length === 1 && CALC_OPERATORS.includes(token);
    if (isOp) {
      if (!expr) return expr; // no leading operator
      const last = expr[expr.length - 1];
      if (CALC_OPERATORS.includes(last)) return expr.slice(0, -1) + token; // no doubles
    }
    return expr + token;
  });
});

export const calcBackspaceAtom = atom(null, (get, set) => {
  set(fastExprAtom, (expr) => expr.slice(0, -1));
});

export const calcClearAtom = atom(null, (get, set) => {
  set(fastExprAtom, "");
});

export const calcEqualsAtom = atom(null, (get, set) => {
  set(fastExprAtom, (expr) => {
    const result = evalExpr(expr);
    return result == null ? expr : String(result);
  });
});

export const resetPosAtom = atom(null, (get, set) => {
  set(linesAtom, []);
  set(tenderedAtom, 0);
  set(searchAtom, "");
  set(fastExprAtom, "");
  setTimeout(() => get(searchInputRefAtom)?.focus(), 0);
});

export const toggleFastModeAtom = atom(null, (get, set) => {
  const next = !get(fastModeAtom);
  set(fastModeAtom, next);
  // Keep each mode's inputs from leaking into the other.
  set(tenderedAtom, 0);
  if (next) set(linesAtom, []);
  else set(fastExprAtom, "");
  set(searchAtom, "");
});
