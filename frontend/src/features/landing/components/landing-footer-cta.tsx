import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingFooterCta() {
  return (
    <>
      <section
        aria-labelledby="final-cta-title"
        className="relative overflow-hidden bg-background py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,rgba(232,185,49,0.22),transparent_60%)]"
        />
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2
            id="final-cta-title"
            className="text-3xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            Siap rapikan catatan toko Anda?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Daftar sekarang, langsung bisa pakai. Tanpa biaya pasang.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="accent" size="xl">
              <Link to="/register">Daftar Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/login">Masuk</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-9">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-8 sm:text-left">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-accent" strokeWidth={2.4} />
            <span>© 2026 KasirKelontong. Dibuat untuk pedagang Indonesia.</span>
          </div>
          <div className="flex items-center gap-5">
            <span>Tentang</span>
            <span>Bantuan</span>
            <span>Kontak</span>
          </div>
        </div>
      </footer>
    </>
  );
}
