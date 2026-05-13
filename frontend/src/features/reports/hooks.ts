import { useQuery } from "@tanstack/react-query";

import { fetchSalesReport } from "@/features/reports/api";

const reportKey = (storeId: string, from: string, to: string) =>
  ["reports", "sales", storeId, from, to] as const;

export function useSalesReport(storeId: string, from: string, to: string) {
  return useQuery({
    queryKey: reportKey(storeId, from, to),
    queryFn: () => fetchSalesReport(storeId, from, to),
    enabled: !!storeId && !!from && !!to,
  });
}
