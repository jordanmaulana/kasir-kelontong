import { api } from "@/lib/api";
import type {
  Cashier,
  CashierInput,
  CashierUpdate,
} from "@/features/cashiers/types";

export function listCashiers(storeId: string): Promise<Cashier[]> {
  return api<Cashier[]>(`/stores/${storeId}/cashiers/`);
}

export function createCashier(
  storeId: string,
  body: CashierInput
): Promise<Cashier> {
  return api<Cashier>(`/stores/${storeId}/cashiers/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCashier(
  storeId: string,
  id: string,
  body: CashierUpdate
): Promise<Cashier> {
  return api<Cashier>(`/stores/${storeId}/cashiers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deactivateCashier(
  storeId: string,
  id: string
): Promise<void> {
  return api<void>(`/stores/${storeId}/cashiers/${id}/`, {
    method: "DELETE",
  });
}
