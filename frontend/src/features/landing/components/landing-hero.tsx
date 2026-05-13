import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(232,185,49,0.25),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 md:py-24">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center rounded-full bg-accent/20 px-4 py-1.5 text-sm font-bold uppercase tracking-[0.16em] text-foreground ring-1 ring-accent/40">
            Aplikasi kasir untuk warung &amp; kelontong
          </span>

          <h1
            id="hero-title"
            className="mt-7 text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Catat penjualan toko Anda.
            <span className="block text-[color:var(--color-muted-foreground)]">
              Tanpa ribet.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Aplikasi kasir sederhana untuk warung dan toko kelontong. Catat barang masuk,
            jualan harian, dan sisa stok — semua di satu tempat. Bisa dipakai di HP,
            tablet, atau komputer.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="accent" size="xl">
              <Link to="/register">
                Daftar Gratis
                <ArrowRight className="size-6" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/login">Masuk sebagai Pemilik</Link>
            </Button>
          </div>

          <div className="mt-8 rounded-lg border-2 border-dashed border-border bg-card/60 px-5 py-4">
            <Link
              to="/cashier"
              className="text-base font-bold text-foreground underline decoration-2 underline-offset-4 hover:decoration-accent"
            >
              Saya kasir, mau masuk →
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Kasir login pakai kode toko &amp; PIN 6 digit.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2 text-base text-muted-foreground">
            <ShieldCheck className="size-5 text-accent" strokeWidth={2.4} />
            <span>Gratis untuk 1 toko. Tanpa kartu kredit.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
