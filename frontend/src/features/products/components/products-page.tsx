import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { PageTitle } from "@/components/ui/page-title";
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

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data: products, isLoading, isError, error } = useProducts(debounced);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                    {product.name}
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
