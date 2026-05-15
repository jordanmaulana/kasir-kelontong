import { Pencil, Plus, UserMinus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CashierFormDialog } from "@/features/cashiers/components/cashier-form-dialog";
import { DeactivateCashierDialog } from "@/features/cashiers/components/deactivate-cashier-dialog";
import {
  useCashiers,
  useImpersonateCashier,
  useUpdateCashier,
} from "@/features/cashiers/hooks";
import type { Cashier } from "@/features/cashiers/types";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface Props {
  storeId: string;
}

export function CashiersTab({ storeId }: Props) {
  const { data: cashiers, isLoading, isError, error } = useCashiers(storeId);
  const reactivate = useUpdateCashier(storeId);
  const impersonate = useImpersonateCashier(storeId);
  const [formOpen, setFormOpen] = useState(false);
  const [editCashier, setEditCashier] = useState<Cashier | undefined>();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Cashier | null>(null);

  const openCreate = () => {
    setEditCashier(undefined);
    setFormOpen(true);
  };

  const openEdit = (cashier: Cashier) => {
    setEditCashier(cashier);
    setFormOpen(true);
  };

  const openDeactivate = (cashier: Cashier) => {
    setDeactivateTarget(cashier);
    setDeactivateOpen(true);
  };

  const onReactivate = (cashier: Cashier) => {
    reactivate.mutate(
      { id: cashier.id, body: { active: true } },
      {
        onSuccess: () => toast.success(`${cashier.display_name} diaktifkan`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Permintaan gagal"),
      },
    );
  };

  const onImpersonate = (cashier: Cashier) => {
    if (!cashier.active || impersonate.isPending) return;
    impersonate.mutate(cashier.id, {
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Gagal membuka POS"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Daftar Kasir</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Buat akun kasir dengan PIN 6 digit. PIN unik dalam satu toko.
          </p>
        </div>
        <Button onClick={openCreate} variant="accent">
          <Plus className="size-5" />
          Kasir Baru
        </Button>
      </div>

      {isLoading ? (
        <p className="text-base text-muted-foreground">Memuat…</p>
      ) : isError ? (
        <p className="text-base font-semibold text-destructive">
          {error instanceof Error ? error.message : "Gagal memuat kasir"}
        </p>
      ) : !cashiers || cashiers.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-48">Login terakhir</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashiers.map((cashier) => (
              <TableRow
                key={cashier.id}
                className={
                  "h-16 " +
                  (cashier.active
                    ? "cursor-pointer hover:bg-muted/50"
                    : "")
                }
                onClick={
                  cashier.active ? () => onImpersonate(cashier) : undefined
                }
                title={
                  cashier.active
                    ? "Buka POS sebagai kasir ini"
                    : undefined
                }
              >
                <TableCell className="font-semibold text-foreground">
                  {cashier.display_name}
                </TableCell>
                <TableCell>
                  <StatusBadge active={cashier.active} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cashier.last_login_at
                    ? dateFmt.format(new Date(cashier.last_login_at))
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Ubah ${cashier.display_name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(cashier);
                      }}
                    >
                      <Pencil className="size-5" />
                    </Button>
                    {cashier.active ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Nonaktifkan ${cashier.display_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeactivate(cashier);
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="size-5" />
                      </Button>
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Aktifkan ${cashier.display_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReactivate(cashier);
                        }}
                        disabled={reactivate.isPending}
                        className="text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/10"
                      >
                        <UserPlus className="size-5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CashierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        cashier={editCashier}
      />
      <DeactivateCashierDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        storeId={storeId}
        cashier={deactivateTarget}
      />
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-success)]/12 px-3 py-1 text-sm font-bold text-[color:var(--color-success)]"
          : "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground"
      }
    >
      <span
        aria-hidden="true"
        className={
          "size-2 rounded-full " +
          (active ? "bg-[color:var(--color-success)]" : "bg-muted-foreground/50")
        }
      />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border bg-card/60 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent/20">
        <Users className="size-7" strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">Belum ada kasir</h3>
        <p className="mt-1 max-w-md text-base text-muted-foreground">
          Tambahkan kasir untuk toko ini supaya mereka bisa masuk ke layar kasir.
        </p>
      </div>
      <Button variant="accent" onClick={onCreate}>
        <Plus className="size-5" />
        Tambah Kasir
      </Button>
    </div>
  );
}
