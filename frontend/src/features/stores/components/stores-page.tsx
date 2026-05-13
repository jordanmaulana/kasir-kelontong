import { Link } from "@tanstack/react-router";
import { MapPin, Pencil, Plus, Store as StoreIcon, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { DeleteStoreDialog } from "@/features/stores/components/delete-store-dialog";
import { StoreFormDialog } from "@/features/stores/components/store-form-dialog";
import { useStores } from "@/features/stores/hooks";
import type { Store } from "@/features/stores/types";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
    <div>
      <PageTitle
        eyebrow="Outlet"
        title="Toko Saya"
        subtitle="Kelola outlet dan kode kasir di sini. Tiap toko punya kode unik."
        actions={
          <Button onClick={openCreate} variant="accent" size="default">
            <Plus className="size-5" />
            Toko Baru
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-base text-muted-foreground">Memuat…</p>
      ) : isError ? (
        <p className="text-base font-semibold text-destructive">
          {error instanceof Error ? error.message : "Gagal memuat toko"}
        </p>
      ) : !stores || stores.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <article
              key={store.id}
              className="group flex flex-col gap-5 rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 font-mono text-base font-bold tracking-wider text-accent-foreground">
                  <StoreIcon className="size-4" strokeWidth={2.5} />
                  {store.code}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Ubah ${store.code}`}
                    onClick={() => openEdit(store)}
                  >
                    <Pencil className="size-5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Hapus ${store.code}`}
                    onClick={() => openDelete(store)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1">
                <Link
                  to="/dashboard/stores/$storeId"
                  params={{ storeId: store.id }}
                  className="block text-xl font-bold tracking-tight text-foreground hover:text-primary"
                >
                  {store.name}
                </Link>
                {store.address ? (
                  <p className="mt-2 flex items-start gap-2 text-base text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{store.address}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-base text-muted-foreground">Belum ada alamat.</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                <span>Dibuat {dateFmt.format(new Date(store.created_on))}</span>
                <Link
                  to="/dashboard/stores/$storeId"
                  params={{ storeId: store.id }}
                  className="font-bold text-foreground underline decoration-2 underline-offset-4 hover:decoration-accent"
                >
                  Buka →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <StoreFormDialog open={formOpen} onOpenChange={setFormOpen} store={editStore} />
      <DeleteStoreDialog open={deleteOpen} onOpenChange={setDeleteOpen} store={deleteStore} />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border bg-card/60 p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
        <StoreIcon className="size-8" strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Belum ada toko</h2>
        <p className="mt-2 max-w-md text-base text-muted-foreground">
          Buat toko pertama untuk mulai menyiapkan kasir dan stok barang.
        </p>
      </div>
      <Button variant="accent" size="lg" onClick={onCreate}>
        <Plus className="size-5" />
        Buat Toko
      </Button>
    </div>
  );
}
