import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { useEmailLogin, useRegister } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Masukkan email yang valid"),
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

  const title = mode === "register" ? "Buat akun" : "Masuk";
  const submitLabel = mode === "register" ? "Daftar" : "Masuk";
  const altLink =
    mode === "register" ? (
      <p className="mt-4 text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Masuk
        </Link>
      </p>
    ) : (
      <p className="mt-4 text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Buat akun
        </Link>
      </p>
    );

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
            {...registerField("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Kata sandi
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
            {...registerField("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {mutation.isPending ? "Memproses…" : submitLabel}
        </button>
      </form>
      {altLink}
    </div>
  );
}
