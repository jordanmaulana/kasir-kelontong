import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Store } from "lucide-react";

import { EmailAuthForm } from "@/features/auth/components/email-auth-form";
import { GoogleSignInCard } from "@/features/auth/components/google-sign-in-card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-5" /> Kembali
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="size-5" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">KasirKelontong</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-md space-y-5">
          <EmailAuthForm mode="login" />

          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>Atau</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInCard />

          <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-5 text-center">
            <p className="text-base text-foreground">Saya seorang kasir</p>
            <Link
              to="/cashier"
              className="mt-2 inline-flex items-center gap-1 text-base font-bold text-foreground underline decoration-2 underline-offset-4 hover:decoration-accent"
            >
              Masuk sebagai Kasir →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
