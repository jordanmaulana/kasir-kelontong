import { api } from "@/lib/api";
import type { Store, StoreInput } from "@/features/stores/types";

export function listStores(): Promise<Store[]> {
  return api<Store[]>("/stores/");
}

export function createStore(body: StoreInput): Promise<Store> {
  return api<Store>("/stores/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateStore(
  id: string,
  body: Partial<StoreInput>
): Promise<Store> {
  return api<Store>(`/stores/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteStore(id: string): Promise<void> {
  return api<void>(`/stores/${id}/`, { method: "DELETE" });
}
