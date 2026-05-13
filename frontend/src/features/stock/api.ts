import { api } from "@/lib/api";
import type {
  AdjustmentInput,
  ReceivingInput,
  StockItem,
  StockMovement,
} from "@/features/stock/types";

export function listStock(storeId: string, q?: string): Promise<StockItem[]> {
  const path =
    q && q.trim()
      ? `/stores/${storeId}/stock/?q=${encodeURIComponent(q.trim())}`
      : `/stores/${storeId}/stock/`;
  return api<StockItem[]>(path);
}

export interface MovementFilters {
  product?: string;
  reason?: string;
  limit?: number;
}

export function listMovements(
  storeId: string,
  filters?: MovementFilters
): Promise<StockMovement[]> {
  const params = new URLSearchParams();
  if (filters?.product) params.set("product", filters.product);
  if (filters?.reason) params.set("reason", filters.reason);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  const path = `/stores/${storeId}/stock/movements/${qs ? `?${qs}` : ""}`;
  return api<StockMovement[]>(path);
}

export function submitReceiving(
  storeId: string,
  body: ReceivingInput
): Promise<StockMovement[]> {
  return api<StockMovement[]>(`/stores/${storeId}/receiving/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function submitAdjustment(
  storeId: string,
  body: AdjustmentInput
): Promise<StockMovement> {
  return api<StockMovement>(`/stores/${storeId}/adjustments/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
