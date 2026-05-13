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
import { useDeleteStore } from "@/features/stores/hooks";
import type { Store } from "@/features/stores/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store | null;
}

export function DeleteStoreDialog({ open, onOpenChange, store }: Props) {
  const remove = useDeleteStore();

  const onConfirm = () => {
    if (!store) return;
    remove.mutate(store.id, {
      onSuccess: () => {
        toast.success(`${store.code} dihapus`);
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
          <DialogTitle>Hapus Toko?</DialogTitle>
          <DialogDescription>
            {store ? (
              <>
                Hapus permanen <span className="font-mono">{store.code}</span>{" "}
                ({store.name})? Tindakan ini tidak dapat dibatalkan.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={remove.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Menghapus…" : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
