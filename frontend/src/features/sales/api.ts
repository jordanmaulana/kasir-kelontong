import { cashierApi } from "@/features/cashier-auth/api";
import type {
  CashierStockItem,
  CreateSaleInput,
  Sale,
  SaleSummary,
} from "@/features/sales/types";

export function listCashierStock(q?: string): Promise<CashierStockItem[]> {
  const path =
    q && q.trim()
      ? `/cashier/stock/?q=${encodeURIComponent(q.trim())}`
      : "/cashier/stock/";
  return cashierApi<CashierStockItem[]>(path);
}

export function createSale(body: CreateSaleInput): Promise<Sale> {
  return cashierApi<Sale>("/cashier/sales/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listTodaysSales(): Promise<SaleSummary[]> {
  return cashierApi<SaleSummary[]>("/cashier/sales/today/");
}
