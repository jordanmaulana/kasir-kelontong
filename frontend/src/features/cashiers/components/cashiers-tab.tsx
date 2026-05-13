import { Pencil, Plus, UserMinus, UserPlus } from "lucide-react";
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
  useUpdateCashier,
} from "@/features/cashiers/hooks";
import type { Cashier } from "@/features/cashiers/types";

interface Props {
  storeId: string;
}

export function CashiersTab({ storeId }: Props) {
  const { data: cashiers, isLoading, isError, error } = useCashiers(storeId);
  const reactivate = useUpdateCashier(storeId);
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
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-slate-900">Kasir</h2>
          <p className="text-sm text-slate-600">
            Buat akun kasir dengan PIN 6 digit. PIN unik dalam satu toko.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Kasir baru
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Gagal memuat kasir"}
        </p>
      ) : !cashiers || cashiers.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-40">Login terakhir</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashiers.map((cashier) => (
              <TableRow key={cashier.id}>
                <TableCell className="font-medium text-slate-900">
                  {cashier.display_name}
                </TableCell>
                <TableCell>
                  <StatusBadge active={cashier.active} />
                </TableCell>
                <TableCell className="text-slate-500">
                  {cashier.last_login_at
                    ? new Date(cashier.last_login_at).toLocaleString("id-ID")
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Ubah ${cashier.display_name}`}
                      onClick={() => openEdit(cashier)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {cashier.active ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Nonaktifkan ${cashier.display_name}`}
                        onClick={() => openDeactivate(cashier)}
                      >
                        <UserMinus className="h-4 w-4 text-red-600" />
                      </Button>
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Aktifkan ${cashier.display_name}`}
                        onClick={() => onReactivate(cashier)}
                        disabled={reactivate.isPending}
                      >
                        <UserPlus className="h-4 w-4 text-emerald-600" />
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
          ? "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
      }
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-base font-medium text-slate-900">Belum ada kasir</h3>
      <p className="mt-1 text-sm text-slate-600">
        Tambahkan kasir untuk toko ini agar mereka bisa masuk ke kasir.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus className="mr-1 h-4 w-4" />
        Kasir baru
      </Button>
    </div>
  );
}
