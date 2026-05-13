import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteStoreDialog } from "@/features/stores/components/delete-store-dialog";
import { StoreFormDialog } from "@/features/stores/components/store-form-dialog";
import { useStores } from "@/features/stores/hooks";
import type { Store } from "@/features/stores/types";

export function StoresPage() {
  const { data: stores, isLoading, isError, error } = useStores();
  const [formOpen, setFormOpen] = useState(false);
  const [editStore, setEditStore] = useState<Store | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStore, setDeleteStore] = useState<Store | null>(null);

  const openCreate = () => {
    setEditStore(undefined);
    setFormOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditStore(store);
    setFormOpen(true);
  };

  const openDelete = (store: Store) => {
    setDeleteStore(store);
    setDeleteOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Toko</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola outlet Anda. Setiap toko memiliki kode unik yang dipakai
            kasir untuk masuk.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Toko baru
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat…</p>
        ) : isError ? (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Gagal memuat toko"}
          </p>
        ) : !stores || stores.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="w-32">Dibuat</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-mono text-slate-900">
                    <Link
                      to="/dashboard/stores/$storeId"
                      params={{ storeId: store.id }}
                      className="hover:underline"
                    >
                      {store.code}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <Link
                      to="/dashboard/stores/$storeId"
                      params={{ storeId: store.id }}
                      className="hover:underline"
                    >
                      {store.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {store.address || "—"}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(store.created_on).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Ubah ${store.code}`}
                        onClick={() => openEdit(store)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Hapus ${store.code}`}
                        onClick={() => openDelete(store)}
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

      <StoreFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        store={editStore}
      />
      <DeleteStoreDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        store={deleteStore}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-base font-medium text-slate-900">Belum ada toko</h2>
      <p className="mt-1 text-sm text-slate-600">
        Buat toko pertama Anda untuk mulai menyiapkan kasir dan stok.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus className="mr-1 h-4 w-4" />
        Toko baru
      </Button>
    </div>
  );
}
