import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingFooterCta() {
  return (
    <>
      <section
        aria-labelledby="final-cta-title"
        className="relative overflow-hidden bg-white py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,theme(colors.amber.50),transparent_60%)]"
        />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2
            id="final-cta-title"
            className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl"
          >
            Siap rapikan catatan toko Anda?
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Daftar sekarang, langsung bisa pakai. Tanpa biaya pasang.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="min-h-14 bg-amber-600 px-8 text-base font-medium text-white hover:bg-amber-700"
            >
              <Link to="/register">Daftar Gratis</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-14 px-8 text-base font-medium"
            >
              <Link to="/login">Masuk</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-neutral-500 sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-amber-600" />
            <span>
              © 2026 KasirKelontong. Dibuat untuk pedagang Indonesia.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Tentang</span>
            <span>Bantuan</span>
            <span>Kontak</span>
          </div>
        </div>
      </footer>
    </>
  );
}
