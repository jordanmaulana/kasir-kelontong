import { api, ApiError } from "@/lib/api";
import type { SalesReport } from "@/features/reports/types";

function buildPath(storeId: string, from: string, to: string, extra?: string) {
  const params = new URLSearchParams({ from, to });
  if (extra) params.set("export", extra);
  return `/stores/${storeId}/sales/report/?${params.toString()}`;
}

export function fetchSalesReport(
  storeId: string,
  from: string,
  to: string,
): Promise<SalesReport> {
  return api<SalesReport>(buildPath(storeId, from, to));
}

const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`;

export async function downloadSalesReportCsv(
  storeId: string,
  from: string,
  to: string,
): Promise<{ blob: Blob; filename: string }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Token ${token}`;
  const res = await fetch(`${API_BASE}${buildPath(storeId, from, to, "csv")}`, {
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = JSON.parse(text);
      if (data?.detail) detail = data.detail;
    } catch {
      /* not json */
    }
    throw new ApiError(res.status, detail, text);
  }
  const filename = parseFilename(res.headers.get("Content-Disposition"))
    ?? `sales-${storeId}-${from}-${to}.csv`;
  const blob = await res.blob();
  return { blob, filename };
}

function parseFilename(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1] : null;
}
