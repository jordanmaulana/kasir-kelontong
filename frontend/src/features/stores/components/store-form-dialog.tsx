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
import { useCreateStore, useUpdateStore } from "@/features/stores/hooks";
import type { Store } from "@/features/stores/types";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(120),
  code: z
    .string()
    .regex(
      /^[A-Z0-9]{3,10}$/,
      "Kode harus 3–10 huruf atau angka"
    ),
  address: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: Store;
}

export function StoreFormDialog({ open, onOpenChange, store }: Props) {
  const isEdit = !!store;
  const create = useCreateStore();
  const update = useUpdateStore();
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", address: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: store?.name ?? "",
        code: store?.code ?? "",
        address: store?.address ?? "",
      });
    }
  }, [open, store, reset]);

  const onSubmit = (values: FormValues) => {
    const body = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      address: values.address?.trim() ?? "",
    };
    const onSuccess = () => {
      toast.success(isEdit ? "Toko diperbarui" : "Toko berhasil dibuat");
      onOpenChange(false);
    };
    const onError = (err: unknown) => {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        if (data && typeof data === "object") {
          for (const key of ["name", "code", "address"] as const) {
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
    if (isEdit && store) {
      update.mutate({ id: store.id, body }, { onSuccess, onError });
    } else {
      create.mutate(body, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah toko" : "Toko baru"}</DialogTitle>
          <DialogDescription>
            Kasir akan memakai kode toko untuk masuk.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="store-name">Nama</Label>
            <Input
              id="store-name"
              autoFocus
              className="mt-1"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="store-code">Kode</Label>
            <Input
              id="store-code"
              className="mt-1 font-mono uppercase"
              placeholder="cth. JKT01"
              maxLength={10}
              {...register("code", {
                onChange: (e) => {
                  const upper = e.target.value.toUpperCase();
                  if (upper !== e.target.value) {
                    setValue("code", upper, { shouldValidate: true });
                  }
                },
              })}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="store-address">Alamat</Label>
            <Textarea
              id="store-address"
              rows={3}
              className="mt-1"
              {...register("address")}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">
                {errors.address.message}
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
                  : "Buat toko"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
