import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmailLogin, useRegister } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Masukkan email yang benar"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  mode: "register" | "login";
}

export function EmailAuthForm({ mode }: Props) {
  const navigate = useNavigate();
  const register = useRegister();
  const login = useEmailLogin();
  const mutation = mode === "register" ? register : login;

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) =>
    mutation.mutate(values, {
      onSuccess: () => navigate({ to: "/dashboard" }),
      onError: (err) => {
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error(err instanceof Error ? err.message : "Permintaan gagal");
        }
      },
    });

  const isRegister = mode === "register";
  const title = isRegister ? "Buat Akun" : "Masuk";
  const subtitle = isRegister
    ? "Daftar untuk mulai mengelola toko Anda."
    : "Selamat datang kembali. Silakan masuk.";
  const submitLabel = isRegister ? "Daftar" : "Masuk";

  return (
    <div className="w-full rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="nama@toko.id"
            aria-invalid={!!errors.email}
            {...registerField("email")}
          />
          {errors.email && (
            <p className="mt-2 text-sm font-semibold text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Kata Sandi</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Minimal 8 karakter"
            aria-invalid={!!errors.password}
            {...registerField("password")}
          />
          {errors.password && (
            <p className="mt-2 text-sm font-semibold text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? "Memproses…" : submitLabel}
        </Button>
      </form>
      <p className="mt-6 text-base text-muted-foreground">
        {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
        <Link
          to={isRegister ? "/login" : "/register"}
          className="font-bold text-foreground underline decoration-2 underline-offset-4 hover:decoration-accent"
        >
          {isRegister ? "Masuk di sini" : "Daftar gratis"}
        </Link>
      </p>
    </div>
  );
}
