import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listMovements,
  listStock,
  submitAdjustment,
  submitReceiving,
  type MovementFilters,
} from "@/features/stock/api";
import type {
  AdjustmentInput,
  ReceivingInput,
} from "@/features/stock/types";

const stockKey = (storeId: string, q?: string) =>
  ["stock", storeId, q ?? ""] as const;
const movementsKey = (storeId: string, filters?: MovementFilters) =>
  ["movements", storeId, filters ?? {}] as const;

export function useStock(storeId: string, q?: string) {
  return useQuery({
    queryKey: stockKey(storeId, q),
    queryFn: () => listStock(storeId, q),
    enabled: !!storeId,
  });
}

export function useMovements(storeId: string, filters?: MovementFilters) {
  return useQuery({
    queryKey: movementsKey(storeId, filters),
    queryFn: () => listMovements(storeId, filters),
    enabled: !!storeId,
  });
}

function invalidateStock(qc: ReturnType<typeof useQueryClient>, storeId: string) {
  qc.invalidateQueries({ queryKey: ["stock", storeId] });
  qc.invalidateQueries({ queryKey: ["movements", storeId] });
}

export function useReceiving(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReceivingInput) => submitReceiving(storeId, body),
    onSuccess: () => invalidateStock(qc, storeId),
  });
}

export function useAdjustment(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdjustmentInput) => submitAdjustment(storeId, body),
    onSuccess: () => invalidateStock(qc, storeId),
  });
}
