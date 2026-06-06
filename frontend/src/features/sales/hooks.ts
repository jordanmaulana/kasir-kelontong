import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCashierProduct,
  createSale,
  listCashierStock,
  listTodaysSales,
  type CashierProductInput,
} from "@/features/sales/api";
import type { CreateSaleInput } from "@/features/sales/types";

export function useCashierStock(q?: string) {
  return useQuery({
    queryKey: ["cashier-stock", q ?? ""],
    queryFn: () => listCashierStock(q),
  });
}

export function useTodaysSales() {
  return useQuery({
    queryKey: ["cashier-sales", "today"],
    queryFn: listTodaysSales,
  });
}

export function useCreateCashierProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CashierProductInput) => createCashierProduct(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashier-stock"] });
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSaleInput) => createSale(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashier-stock"] });
      qc.invalidateQueries({ queryKey: ["cashier-sales"] });
    },
  });
}
