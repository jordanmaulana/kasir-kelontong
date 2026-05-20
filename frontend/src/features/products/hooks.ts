import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "@/features/products/api";
import type { ProductInput } from "@/features/products/types";

const PRODUCTS_KEY = ["products"] as const;

export function useProducts({
  q,
  page,
  pageSize,
}: { q?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, q ?? "", page ?? 1, pageSize ?? 20] as const,
    queryFn: () => listProducts({ q, page, pageSize }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      if (variables.initial_store_id) {
        qc.invalidateQueries({ queryKey: ["stock", variables.initial_store_id] });
        qc.invalidateQueries({ queryKey: ["movements", variables.initial_store_id] });
      }
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ProductInput> }) =>
      updateProduct(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
