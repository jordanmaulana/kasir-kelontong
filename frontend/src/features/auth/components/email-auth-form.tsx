import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmailLogin, useRegister } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Masukkan email yang benar"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1, "Ulangi kata sandi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Kata sandi tidak sama",
  });

type FormValues = z.infer<typeof registerSchema>;

interface Props {
  mode: "register" | "login";
}

export function EmailAuthForm({ mode }: Props) {
  const navigate = useNavigate();
  const register = useRegister();
  const login = useEmailLogin();
  const isRegister = mode === "register";
  const mutation = isRegister ? register : login;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      isRegister ? registerSchema : loginSchema,
    ) as unknown as Resolver<FormValues>,
  });

  const onSubmit = (values: FormValues) =>
    mutation.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => navigate({ to: "/dashboard" }),
        onError: (err) => {
          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error(err instanceof Error ? err.message : "Permintaan gagal");
          }
        },
      },
    );

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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="Minimal 8 karakter"
              aria-invalid={!!errors.password}
              className="pr-12"
              {...registerField("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm font-semibold text-destructive">{errors.password.message}</p>
          )}
        </div>
        {isRegister && (
          <div>
            <Label htmlFor="confirmPassword">Ulangi Kata Sandi</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ketik ulang kata sandi"
                aria-invalid={!!errors.confirmPassword}
                className="pr-12"
                {...registerField("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm font-semibold text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}
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
