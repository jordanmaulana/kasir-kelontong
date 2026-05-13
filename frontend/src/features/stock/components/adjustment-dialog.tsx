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
import { Textarea } from "@/components/ui/textarea";
import { useAdjustment } from "@/features/stock/hooks";
import type { AdjustmentInput, StockItem } from "@/features/stock/types";
import { ApiError } from "@/lib/api";

const schema = z
  .object({
    mode: z.enum(["target", "delta"]),
    target_qty: z.string().optional(),
    delta: z.string().optional(),
    note: z
      .string()
      .trim()
      .min(1, "Catatan wajib diisi")
      .max(500, "Maksimal 500 karakter"),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "target") {
      const n = Number(data.target_qty);
      if (!data.target_qty || Number.isNaN(n) || n < 0 || !Number.isInteger(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["target_qty"],
          message: "Masukkan bilangan bulat ≥ 0",
        });
      }
    } else {
      const n = Number(data.delta);
      if (!data.delta || Number.isNaN(n) || n === 0 || !Number.isInteger(n)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delta"],
          message: "Masukkan bilangan bulat ≠ 0",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  item: StockItem | null;
}

export function AdjustmentDialog({ open, onOpenChange, storeId, item }: Props) {
  const adjust = useAdjustment(storeId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mode: "target", target_qty: "", delta: "", note: "" },
  });

  const mode = watch("mode");

  useEffect(() => {
    if (open && item) {
      reset({
        mode: "target",
        target_qty: String(item.qty),
        delta: "",
        note: "",
      });
    }
  }, [open, item, reset]);

  if (!item) return null;

  const onSubmit = (values: FormValues) => {
    const body: AdjustmentInput =
      values.mode === "target"
        ? {
            product_id: item.product_id,
            target_qty: Number(values.target_qty),
            note: values.note,
          }
        : {
            product_id: item.product_id,
            delta: Number(values.delta),
            note: values.note,
          };
    adjust.mutate(body, {
      onSuccess: () => {
        toast.success("Stok disesuaikan");
        onOpenChange(false);
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          toast.error(
            typeof err.data === "object" && err.data && "detail" in err.data
              ? String((err.data as { detail: unknown }).detail)
              : err.message
          );
        } else {
          toast.error(err instanceof Error ? err.message : "Permintaan gagal");
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sesuaikan stok</DialogTitle>
          <DialogDescription>
            {item.name} — stok saat ini <strong>{item.qty}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset className="space-y-2">
            <Label>Mode</Label>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" value="target" {...register("mode")} />
                Set ke jumlah
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" value="delta" {...register("mode")} />
                Ubah dengan delta
              </label>
            </div>
          </fieldset>

          {mode === "target" ? (
            <div>
              <Label htmlFor="adj-target">Jumlah akhir</Label>
              <Input
                id="adj-target"
                type="number"
                inputMode="numeric"
                min={0}
                className="mt-1"
                {...register("target_qty")}
              />
              {errors.target_qty && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.target_qty.message}
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="adj-delta">Delta (boleh negatif)</Label>
              <Input
                id="adj-delta"
                type="number"
                inputMode="numeric"
                className="mt-1"
                placeholder="+5 atau -3"
                {...register("delta")}
              />
              {errors.delta && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.delta.message}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="adj-note">Catatan</Label>
            <Textarea
              id="adj-note"
              rows={2}
              className="mt-1"
              placeholder="cth. rusak, hilang, stok opname"
              {...register("note")}
            />
            {errors.note && (
              <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adjust.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
