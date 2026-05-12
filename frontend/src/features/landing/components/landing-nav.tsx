import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Store className="size-6 text-amber-600" strokeWidth={2.25} />
          <span className="text-lg font-semibold text-neutral-900">
            KasirKelontong
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            className="min-h-12 px-4 text-base font-medium text-neutral-800"
          >
            <Link to="/login">Masuk</Link>
          </Button>
          <Button
            asChild
            className="min-h-12 bg-amber-600 px-5 text-base font-medium text-white hover:bg-amber-700"
          >
            <Link to="/register">Daftar Gratis</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
