import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/features/products/hooks";
import type { Product } from "@/features/products/types";
import { ApiError } from "@/lib/api";

const schema = z.object({
  barcode: z
    .string()
    .max(64)
    .regex(
      /^$|^[A-Za-z0-9-]{1,64}$/,
      "Barcode 1–64 karakter, huruf/angka/tanda hubung"
    )
    .optional(),
  name: z.string().min(1, "Nama wajib diisi").max(200),
  sell_price: z
    .number("Harga harus angka")
    .int("Harga harus bilangan bulat")
    .min(0, "Harga tidak boleh negatif"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { barcode: "", name: "", sell_price: 0 },
  });

  useEffect(() => {
    if (open) {
      reset({
        barcode: product?.barcode ?? "",
        name: product?.name ?? "",
        sell_price: product?.sell_price ?? 0,
      });
    }
  }, [open, product, reset]);

  const onSubmit = (values: FormValues) => {
    const body = {
      barcode: values.barcode?.trim() ? values.barcode.trim() : null,
      name: values.name.trim(),
      sell_price: values.sell_price,
    };
    const onSuccess = () => {
      toast.success(isEdit ? "Produk diperbarui" : "Produk berhasil dibuat");
      onOpenChange(false);
    };
    const onError = (err: unknown) => {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        if (data && typeof data === "object") {
          for (const key of ["barcode", "name", "sell_price"] as const) {
            const messages = data[key];
            if (Array.isArray(messages) && messages.length > 0) {
              setError(key, { message: String(messages[0]) });
            }
          }
        }
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Permintaan gagal");
      }
    };
    if (isEdit && product) {
      update.mutate({ id: product.id, body }, { onSuccess, onError });
    } else {
      create.mutate(body, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah produk" : "Produk baru"}</DialogTitle>
          <DialogDescription>
            Scan barcode atau isi manual. Barcode opsional untuk barang curah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="product-barcode">Barcode</Label>
            <Input
              id="product-barcode"
              autoFocus
              className="mt-1 font-mono"
              placeholder="Scan atau ketik (opsional)"
              maxLength={64}
              autoComplete="off"
              {...register("barcode")}
            />
            {errors.barcode && (
              <p className="mt-1 text-xs text-red-600">{errors.barcode.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="product-name">Nama</Label>
            <Input
              id="product-name"
              className="mt-1"
              placeholder="cth. Indomie Goreng"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="product-price">Harga jual (Rp)</Label>
            <Input
              id="product-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="mt-1"
              {...register("sell_price", { valueAsNumber: true })}
            />
            {errors.sell_price && (
              <p className="mt-1 text-xs text-red-600">
                {errors.sell_price.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Menyimpan…"
                : isEdit
                  ? "Simpan perubahan"
                  : "Buat produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
