import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteOnboarding, useLogout } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
});

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(120),
  code: z
    .string()
    .regex(/^[A-Z0-9]{3,10}$/, "Kode harus 3–10 huruf atau angka"),
  address: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

function OnboardingRoute() {
  const logout = useLogout();
  const onboarding = useCompleteOnboarding();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", address: "" },
  });

  const onSubmit = (values: FormValues) => {
    const body = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      address: values.address?.trim() || undefined,
    };
    onboarding.mutate(body, {
      onSuccess: () => {
        toast.success("Toko berhasil dibuat");
      },
      onError: (err) => {
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
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Siapkan toko pertama Anda
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kasir akan masuk menggunakan kode toko. Anda dapat menambah toko
              lain nanti.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="store-name">Nama toko</Label>
            <Input
              id="store-name"
              autoFocus
              className="mt-1"
              placeholder="Toko Pusat"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="store-code">Kode toko</Label>
            <Input
              id="store-code"
              className="mt-1 font-mono uppercase"
              placeholder="JKT01"
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
            <Label htmlFor="store-address">Alamat (opsional)</Label>
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
          <Button
            type="submit"
            className="w-full"
            disabled={onboarding.isPending}
          >
            {onboarding.isPending ? "Menyimpan…" : "Buat toko & lanjut"}
          </Button>
        </form>
      </div>
    </div>
  );
}
