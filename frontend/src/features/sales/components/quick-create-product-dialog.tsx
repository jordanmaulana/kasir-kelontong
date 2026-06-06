import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { lookupCashierBarcode } from "@/features/sales/api";
import { useCreateCashierProduct } from "@/features/sales/hooks";
import type { Product } from "@/features/products/types";
import { ApiError } from "@/lib/api";

const schema = z.object({
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
  barcode: string;
  onCreated: (product: Product) => void;
}

export function QuickCreateProductDialog({
  open,
  onOpenChange,
  barcode,
  onCreated,
}: Props) {
  const create = useCreateCashierProduct();

  const { data: lookup } = useQuery({
    queryKey: ["barcode-lookup", barcode],
    queryFn: () => lookupCashierBarcode(barcode),
    enabled: open && barcode.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", sell_price: undefined as unknown as number },
  });

  // Reset the form each time the dialog opens for a new barcode.
  useEffect(() => {
    if (open) reset({ name: "", sell_price: undefined as unknown as number });
  }, [open, barcode, reset]);

  // Pre-fill the name once the catalog lookup resolves, then jump to price.
  useEffect(() => {
    if (open && lookup?.name) {
      setValue("name", lookup.name);
      setFocus("sell_price", { shouldSelect: true });
    }
  }, [open, lookup, setValue, setFocus]);

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        barcode: barcode.trim() || null,
        name: values.name.trim(),
        sell_price: values.sell_price,
      },
      {
        onSuccess: (product) => {
          onCreated(product);
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError) toast.error(err.message);
          else
            toast.error(
              err instanceof Error ? err.message : "Gagal menyimpan produk",
            );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Produk baru</DialogTitle>
          <DialogDescription>
            Barcode ini belum terdaftar. Tambahkan produk baru untuk lanjut.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="quick-barcode">Barcode</Label>
            <Input
              id="quick-barcode"
              value={barcode}
              readOnly
              className="font-mono"
              tabIndex={-1}
            />
          </div>
          <div>
            <Label htmlFor="quick-name">Nama produk</Label>
            <Input
              id="quick-name"
              autoFocus
              placeholder="Contoh: Indomie Goreng"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="quick-price">Harga jual satuan (Rp)</Label>
            <Input
              id="quick-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="text-right font-mono text-lg"
              aria-invalid={!!errors.sell_price}
              {...register("sell_price", { valueAsNumber: true })}
            />
            {errors.sell_price && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.sell_price.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="accent" disabled={create.isPending}>
              {create.isPending ? "Menyimpan…" : "Simpan & tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
