import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const idr = new Intl.NumberFormat("id-ID");

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
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Produk</h1>
          <p className="mt-1 text-sm text-slate-600">
            Katalog produk dipakai bersama oleh semua toko Anda. Stok per toko
            diatur terpisah.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Produk baru
        </Button>
      </div>

      <div className="mt-6">
        <Input
          type="search"
          placeholder="Cari nama atau barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat…</p>
        ) : isError ? (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Gagal memuat produk"}
          </p>
        ) : !products || products.length === 0 ? (
          debounced ? (
            <p className="text-sm text-slate-500">
              Tidak ada produk cocok untuk “{debounced}”.
            </p>
          ) : (
            <EmptyState onCreate={openCreate} />
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Barcode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-32 text-right">Harga</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-slate-700">
                    {product.barcode ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-900">
                    Rp {idr.format(product.sell_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Ubah ${product.name}`}
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Hapus ${product.name}`}
                        onClick={() => openDelete(product)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
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
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-base font-medium text-slate-900">Belum ada produk</h2>
      <p className="mt-1 text-sm text-slate-600">
        Tambahkan produk pertama Anda untuk mulai mengisi stok dan menjual.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus className="mr-1 h-4 w-4" />
        Produk baru
      </Button>
    </div>
  );
}
