import { api, ApiError } from "@/lib/api";
import type { PaginatedProducts, Product, ProductInput } from "@/features/products/types";

export interface BarcodeLookup {
  barcode: string;
  name: string;
}

export async function lookupBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<BarcodeLookup | null> {
  try {
    return await api<BarcodeLookup>(
      `/barcode-lookup/?barcode=${encodeURIComponent(barcode)}`,
      { signal },
    );
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
}

export function listProducts(params: {
  q?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedProducts> {
  const search = new URLSearchParams();
  const q = params.q?.trim();
  if (q) search.set("q", q);
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  return api<PaginatedProducts>(`/products/?${search.toString()}`);
}

export function createProduct(body: ProductInput): Promise<Product> {
  return api<Product>("/products/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(
  id: string,
  body: Partial<ProductInput>
): Promise<Product> {
  return api<Product>(`/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return api<void>(`/products/${id}/`, { method: "DELETE" });
}
