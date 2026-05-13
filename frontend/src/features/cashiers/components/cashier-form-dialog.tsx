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
  useCreateCashier,
  useUpdateCashier,
} from "@/features/cashiers/hooks";
import type { Cashier } from "@/features/cashiers/types";
import { ApiError } from "@/lib/api";

const PIN_RE = /^\d{6}$/;

const createSchema = z
  .object({
    display_name: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi")
      .max(80, "Maksimal 80 karakter"),
    pin: z.string().regex(PIN_RE, "PIN harus 6 digit angka"),
    confirm_pin: z.string(),
  })
  .refine((d) => d.pin === d.confirm_pin, {
    path: ["confirm_pin"],
    message: "PIN tidak cocok",
  });

const editSchema = z
  .object({
    display_name: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi")
      .max(80, "Maksimal 80 karakter"),
    pin: z
      .string()
      .optional()
      .refine((v) => !v || PIN_RE.test(v), "PIN harus 6 digit angka"),
    confirm_pin: z.string().optional(),
  })
  .refine(
    (d) => !d.pin || d.pin === d.confirm_pin,
    { path: ["confirm_pin"], message: "PIN tidak cocok" }
  );

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type FormValues = CreateValues | EditValues;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  cashier?: Cashier;
}

export function CashierFormDialog({
  open,
  onOpenChange,
  storeId,
  cashier,
}: Props) {
  const isEdit = !!cashier;
  const create = useCreateCashier(storeId);
  const update = useUpdateCashier(storeId);
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: { display_name: "", pin: "", confirm_pin: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        display_name: cashier?.display_name ?? "",
        pin: "",
        confirm_pin: "",
      });
    }
  }, [open, cashier, reset]);

  const onSubmit = (values: FormValues) => {
    const display_name = values.display_name.trim();
    const onSuccess = () => {
      toast.success(isEdit ? "Kasir diperbarui" : "Kasir berhasil dibuat");
      onOpenChange(false);
    };
    const onError = (err: unknown) => {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        if (data && typeof data === "object") {
          for (const key of ["display_name", "pin"] as const) {
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
    if (isEdit && cashier) {
      const body: { display_name: string; pin?: string } = { display_name };
      if (values.pin) body.pin = values.pin;
      update.mutate({ id: cashier.id, body }, { onSuccess, onError });
    } else {
      create.mutate(
        { display_name, pin: (values as CreateValues).pin },
        { onSuccess, onError }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Kasir" : "Kasir Baru"}
          </DialogTitle>
          <DialogDescription>
            Kasir memakai kode toko + PIN 6 digit untuk masuk.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="cashier-name">Nama tampilan</Label>
            <Input
              id="cashier-name"
              autoFocus
              className=""
              maxLength={80}
              {...register("display_name")}
            />
            {errors.display_name && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.display_name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="cashier-pin">
              PIN {isEdit && <span className="text-slate-400">(opsional)</span>}
            </Label>
            <Input
              id="cashier-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              className="font-mono tracking-widest text-center text-2xl"
              placeholder={isEdit ? "Kosongkan jika tidak diubah" : "6 digit"}
              {...register("pin")}
            />
            {errors.pin && (
              <p className="mt-2 text-sm font-semibold text-destructive">{errors.pin.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cashier-confirm">Konfirmasi PIN</Label>
            <Input
              id="cashier-confirm"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              className="font-mono tracking-widest text-center text-2xl"
              placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Ulangi PIN"}
              {...register("confirm_pin")}
            />
            {errors.confirm_pin && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.confirm_pin.message}
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
            <Button type="submit" variant="accent" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Menyimpan…"
                : isEdit
                  ? "Simpan Perubahan"
                  : "Buat Kasir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
