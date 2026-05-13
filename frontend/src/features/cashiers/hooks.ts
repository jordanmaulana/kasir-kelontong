import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCashier,
  deactivateCashier,
  listCashiers,
  updateCashier,
} from "@/features/cashiers/api";
import type {
  CashierInput,
  CashierUpdate,
} from "@/features/cashiers/types";

const cashiersKey = (storeId: string) => ["cashiers", storeId] as const;

export function useCashiers(storeId: string) {
  return useQuery({
    queryKey: cashiersKey(storeId),
    queryFn: () => listCashiers(storeId),
    enabled: !!storeId,
  });
}

export function useCreateCashier(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CashierInput) => createCashier(storeId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cashiersKey(storeId) });
    },
  });
}

export function useUpdateCashier(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CashierUpdate }) =>
      updateCashier(storeId, id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cashiersKey(storeId) });
    },
  });
}

export function useDeactivateCashier(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCashier(storeId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cashiersKey(storeId) });
    },
  });
}
