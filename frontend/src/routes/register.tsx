import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Store } from "lucide-react";

import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
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
        <div className="w-full max-w-md">
          <EmailAuthForm mode="register" />
        </div>
      </main>
    </div>
  );
}
