import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeactivateCashier } from "@/features/cashiers/hooks";
import type { Cashier } from "@/features/cashiers/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  cashier: Cashier | null;
}

export function DeactivateCashierDialog({
  open,
  onOpenChange,
  storeId,
  cashier,
}: Props) {
  const deactivate = useDeactivateCashier(storeId);

  const onConfirm = () => {
    if (!cashier) return;
    deactivate.mutate(cashier.id, {
      onSuccess: () => {
        toast.success(`${cashier.display_name} dinonaktifkan`);
        onOpenChange(false);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Permintaan gagal"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nonaktifkan kasir?</DialogTitle>
          <DialogDescription>
            {cashier ? (
              <>
                Nonaktifkan <span className="font-medium">{cashier.display_name}</span>?
                Riwayat penjualan tetap tersimpan. PIN bisa dipakai ulang oleh
                kasir lain setelah ini.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deactivate.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={deactivate.isPending}
          >
            {deactivate.isPending ? "Memproses…" : "Nonaktifkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
