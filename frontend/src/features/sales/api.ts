import { cashierApi } from "@/features/cashier-auth/api";
import type {
  CashierStockItem,
  CreateSaleInput,
  Sale,
  SaleSummary,
} from "@/features/sales/types";
import type { Product } from "@/features/products/types";
import { ApiError } from "@/lib/api";

export interface CashierProductInput {
  barcode?: string | null;
  name: string;
  sell_price: number;
}

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

export function createCashierProduct(body: CashierProductInput): Promise<Product> {
  return cashierApi<Product>("/cashier/products/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function lookupCashierBarcode(
  barcode: string,
): Promise<{ barcode: string; name: string } | null> {
  try {
    return await cashierApi<{ barcode: string; name: string }>(
      `/barcode-lookup/?barcode=${encodeURIComponent(barcode)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
}
