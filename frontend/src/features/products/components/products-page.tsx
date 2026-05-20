import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { PageTitle } from "@/components/ui/page-title";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProductDialog } from "@/features/products/components/delete-product-dialog";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import { useProducts } from "@/features/products/hooks";
import type { Product } from "@/features/products/types";
import { Route } from "@/routes/dashboard.products";

const PAGE_SIZE = 20;

export function ProductsPage() {
  const { page, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchInput, setSearchInput] = useState(q);
  const [debounced, setDebounced] = useState(q);
  const { data, isLoading, isError, error } = useProducts({
    q: debounced,
    page,
    pageSize: PAGE_SIZE,
  });
  const products = data?.results;
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (debounced === q) return;
    navigate({
      search: (prev) => ({ ...prev, q: debounced, page: 1 }),
      replace: true,
    });
  }, [debounced, q, navigate]);

  useEffect(() => {
    if (data && page > data.total_pages) {
      navigate({
        search: (prev) => ({ ...prev, page: data.total_pages }),
        replace: true,
      });
    }
  }, [data, page, navigate]);

  const goToPage = (next: number) => {
    navigate({ search: (prev) => ({ ...prev, page: next }) });
  };

  const openCreate = () => {
    setEditProduct(undefined);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const openDelete = (product: Product) => {
    setDeleteProduct(product);
    setDeleteOpen(true);
  };

  return (
    <div>
      <PageTitle
        eyebrow="Katalog"
        title="Produk"
        subtitle="Katalog dipakai bersama semua toko. Stok per toko diatur terpisah."
        actions={
          <Button onClick={openCreate} variant="accent" size="default">
            <Plus className="size-5" />
            Produk Baru
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari nama atau barcode…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-12"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-base text-muted-foreground">Memuat…</p>
        ) : isError ? (
          <p className="text-base font-semibold text-destructive">
            {error instanceof Error ? error.message : "Gagal memuat produk"}
          </p>
        ) : !products || products.length === 0 ? (
          debounced ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-10 text-center">
              <p className="text-base text-muted-foreground">
                Tidak ada produk cocok untuk &ldquo;{debounced}&rdquo;.
              </p>
            </div>
          ) : (
            <EmptyState onCreate={openCreate} />
          )
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Barcode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-44 text-right">Harga Jual</TableHead>
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="h-16">
                  <TableCell className="font-mono text-muted-foreground">
                    {product.barcode ?? "—"}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <div>{product.name}</div>
                    {product.bundle_qty != null && product.bundle_price != null && (
                      <div className="mt-1 text-xs font-medium text-muted-foreground">
                        {product.bundle_label ?? "Bundel"} · {product.bundle_qty} pcs ·{" "}
                        <Money value={product.bundle_price} size="sm" muted />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={product.sell_price} size="base" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Ubah ${product.name}`}
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="size-5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Hapus ${product.name}`}
                        onClick={() => openDelete(product)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              onPageChange={goToPage}
            />
          )}
          </>
        )}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editProduct}
      />
      <DeleteProductDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        product={deleteProduct}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border bg-card/60 p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent/20">
        <Package className="size-8" strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Belum ada produk</h2>
        <p className="mt-2 max-w-md text-base text-muted-foreground">
          Tambah produk pertama untuk mulai mengisi stok dan berjualan.
        </p>
      </div>
      <Button variant="accent" size="lg" onClick={onCreate}>
        <Plus className="size-5" />
        Tambah Produk
      </Button>
    </div>
  );
}
