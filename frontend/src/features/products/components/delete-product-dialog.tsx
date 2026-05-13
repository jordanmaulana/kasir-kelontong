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
import { useDeleteProduct } from "@/features/products/hooks";
import type { Product } from "@/features/products/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function DeleteProductDialog({ open, onOpenChange, product }: Props) {
  const remove = useDeleteProduct();

  const onConfirm = () => {
    if (!product) return;
    remove.mutate(product.id, {
      onSuccess: () => {
        toast.success(`${product.name} dihapus`);
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
          <DialogTitle>Hapus produk?</DialogTitle>
          <DialogDescription>
            {product ? (
              <>
                Hapus permanen <span className="font-medium">{product.name}</span>
                {product.barcode ? (
                  <>
                    {" "}(<span className="font-mono">{product.barcode}</span>)
                  </>
                ) : null}
                ? Tindakan ini tidak dapat dibatalkan.
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
