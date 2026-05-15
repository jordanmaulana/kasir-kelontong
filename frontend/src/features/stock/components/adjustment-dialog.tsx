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
import { formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  mode: z.enum(["target", "delta"]),
  target_qty: z.string().optional(),
  delta: z.string().optional(),
  note: z
    .string()
    .trim()
    .min(1, "Catatan wajib diisi")
    .max(500, "Maksimal 500 karakter"),
});

function makeSchema(isWeighted: boolean) {
  return baseSchema.superRefine((data, ctx) => {
    if (data.mode === "target") {
      const n = Number(data.target_qty);
      const invalid = !data.target_qty || Number.isNaN(n) || n < 0;
      if (invalid || (!isWeighted && !Number.isInteger(n))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["target_qty"],
          message: isWeighted
            ? "Masukkan jumlah ≥ 0"
            : "Masukkan bilangan bulat ≥ 0",
        });
      }
    } else {
      const n = Number(data.delta);
      const invalid = !data.delta || Number.isNaN(n) || n === 0;
      if (invalid || (!isWeighted && !Number.isInteger(n))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["delta"],
          message: isWeighted
            ? "Masukkan selisih ≠ 0"
            : "Masukkan bilangan bulat ≠ 0",
        });
      }
    }
  });
}

type FormValues = z.infer<typeof baseSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  item: StockItem | null;
}

export function AdjustmentDialog({ open, onOpenChange, storeId, item }: Props) {
  const adjust = useAdjustment(storeId);
  const isWeighted = !!item?.is_weighted;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(makeSchema(isWeighted)),
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
              : err.message,
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
          <DialogTitle>Sesuaikan Stok</DialogTitle>
          <DialogDescription>
            {item.name} — stok saat ini{" "}
            <strong className="font-mono text-foreground">
              {formatQty(item.qty, {
                isWeighted: item.is_weighted,
                unitLabel: item.unit_label,
              })}
            </strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <fieldset>
            <Label>Cara penyesuaian</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                className={cn(
                  "flex cursor-pointer flex-col rounded-md border-2 p-4 transition-colors",
                  mode === "target"
                    ? "border-foreground bg-muted"
                    : "border-border bg-card hover:border-foreground/40",
                )}
              >
                <input type="radio" value="target" className="sr-only" {...register("mode")} />
                <span className="text-base font-bold">Set ke Jumlah</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  Tentukan jumlah akhir stok
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer flex-col rounded-md border-2 p-4 transition-colors",
                  mode === "delta"
                    ? "border-foreground bg-muted"
                    : "border-border bg-card hover:border-foreground/40",
                )}
              >
                <input type="radio" value="delta" className="sr-only" {...register("mode")} />
                <span className="text-base font-bold">Tambah / Kurangi</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  Selisih dari jumlah sekarang
                </span>
              </label>
            </div>
          </fieldset>

          {mode === "target" ? (
            <div>
              <Label htmlFor="adj-target">
                Jumlah akhir{isWeighted ? ` (${item.unit_label})` : ""}
              </Label>
              <Input
                id="adj-target"
                type="number"
                inputMode={isWeighted ? "decimal" : "numeric"}
                min={0}
                step={isWeighted ? 0.01 : 1}
                className="text-right font-mono text-xl"
                aria-invalid={!!errors.target_qty}
                {...register("target_qty")}
              />
              {errors.target_qty && (
                <p className="mt-2 text-sm font-semibold text-destructive">
                  {errors.target_qty.message}
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="adj-delta">
                Selisih (boleh negatif){isWeighted ? ` (${item.unit_label})` : ""}
              </Label>
              <Input
                id="adj-delta"
                type="number"
                inputMode={isWeighted ? "decimal" : "numeric"}
                step={isWeighted ? 0.01 : 1}
                className="text-right font-mono text-xl"
                placeholder={isWeighted ? "+0.25 atau -0.5" : "+5 atau -3"}
                aria-invalid={!!errors.delta}
                {...register("delta")}
              />
              {errors.delta && (
                <p className="mt-2 text-sm font-semibold text-destructive">
                  {errors.delta.message}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="adj-note">Catatan</Label>
            <Textarea
              id="adj-note"
              rows={3}
              placeholder="Contoh: rusak, hilang, stok opname"
              aria-invalid={!!errors.note}
              {...register("note")}
            />
            {errors.note && (
              <p className="mt-2 text-sm font-semibold text-destructive">{errors.note.message}</p>
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
            <Button type="submit" variant="accent" disabled={adjust.isPending}>
              {adjust.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

