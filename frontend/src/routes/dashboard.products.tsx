import { createFileRoute } from "@tanstack/react-router";

import { ProductsPage } from "@/features/products/components/products-page";

export interface ProductsSearch {
  page: number;
  q: string;
}

export const Route = createFileRoute("/dashboard/products")({
  validateSearch: (search: Record<string, unknown>): ProductsSearch => {
    const rawPage = Number(search.page);
    return {
      page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
      q: typeof search.q === "string" ? search.q : "",
    };
  },
  component: ProductsPage,
});
