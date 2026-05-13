import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { EmailAuthForm } from "@/features/auth/components/email-auth-form";
import { GoogleSignInCard } from "@/features/auth/components/google-sign-in-card";

export const Route = createFileRoute("/login")({
  component: () => (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4">
        <EmailAuthForm mode="login" />
        <div className="flex w-full items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-200" />
          <span>atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleSignInCard />
        <p className="mt-2 text-sm text-slate-600">
          Anda kasir?{" "}
          <Link to="/cashier" className="font-medium text-slate-900 underline">
            Masuk sebagai Kasir
          </Link>
        </p>
      </div>
    </div>
  ),
});
