import { api } from "@/lib/api";
import type { Product, ProductInput } from "@/features/products/types";

export function listProducts(q?: string): Promise<Product[]> {
  const path = q && q.trim() ? `/products/?q=${encodeURIComponent(q.trim())}` : "/products/";
  return api<Product[]>(path);
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
