import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.amber.50),transparent_60%)]"
      />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
            Aplikasi kasir untuk warung & toko kelontong
          </span>

          <h1
            id="hero-title"
            className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 md:text-6xl"
          >
            Catat penjualan toko Anda.
            <span className="block text-amber-700">Dari HP.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-neutral-600 md:text-xl">
            Aplikasi kasir sederhana untuk warung dan toko kelontong. Catat
            barang masuk, jualan harian, dan sisa stok — semua di satu tempat.
            Bisa dipakai di HP, tablet, atau komputer.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="min-h-14 bg-amber-600 px-8 text-base font-medium text-white hover:bg-amber-700"
            >
              <Link to="/register">
                Daftar Gratis
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-14 px-8 text-base font-medium"
            >
              <Link to="/login">Masuk sebagai Pemilik</Link>
            </Button>
          </div>

          <div className="mt-6">
            <Link
              to="/login"
              className="text-base font-medium text-neutral-800 underline underline-offset-4 hover:text-amber-700"
            >
              Saya kasir, mau masuk →
            </Link>
            <p className="mt-1 text-sm text-neutral-500">
              Kasir login lewat kode toko & PIN (segera hadir).
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-neutral-600">
            <ShieldCheck className="size-4 text-amber-600" />
            <span>Gratis untuk 1 toko. Tanpa kartu kredit.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
