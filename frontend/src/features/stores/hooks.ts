import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createStore,
  deleteStore,
  listStores,
  updateStore,
} from "@/features/stores/api";
import type { StoreInput } from "@/features/stores/types";

const STORES_KEY = ["stores"] as const;

export function useStores() {
  return useQuery({
    queryKey: STORES_KEY,
    queryFn: listStores,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORES_KEY });
    },
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<StoreInput> }) =>
      updateStore(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORES_KEY });
    },
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORES_KEY });
    },
  });
}
