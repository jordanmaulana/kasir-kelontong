import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Store } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-7" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Langkah Awal
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                Siapkan toko pertama
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Kasir akan masuk pakai kode toko ini. Anda bisa menambah toko lain nanti.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="size-5" />
            Keluar
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="store-name">Nama toko</Label>
            <Input
              id="store-name"
              autoFocus
              placeholder="Contoh: Toko Berkah Jaya"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-2 text-sm font-semibold text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="store-code">Kode toko</Label>
            <Input
              id="store-code"
              className="font-mono uppercase tracking-widest"
              placeholder="Contoh: JKT01"
              maxLength={10}
              aria-invalid={!!errors.code}
              {...register("code", {
                onChange: (e) => {
                  const upper = e.target.value.toUpperCase();
                  if (upper !== e.target.value) {
                    setValue("code", upper, { shouldValidate: true });
                  }
                },
              })}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              3–10 huruf atau angka. Kasir pakai kode ini untuk masuk.
            </p>
            {errors.code && (
              <p className="mt-2 text-sm font-semibold text-destructive">{errors.code.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="store-address">Alamat (opsional)</Label>
            <Textarea
              id="store-address"
              rows={3}
              placeholder="Alamat toko untuk catatan internal"
              {...register("address")}
            />
            {errors.address && (
              <p className="mt-2 text-sm font-semibold text-destructive">{errors.address.message}</p>
            )}
          </div>
          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={onboarding.isPending}
          >
            {onboarding.isPending ? "Menyimpan…" : "Buat Toko & Lanjut"}
          </Button>
        </form>
      </div>
    </div>
  );
}
