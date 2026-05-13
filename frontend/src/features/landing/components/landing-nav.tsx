import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Store className="size-6" strokeWidth={2.4} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            KasirKelontong
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost">
            <Link to="/login">Masuk</Link>
          </Button>
          <Button asChild variant="accent">
            <Link to="/register">Daftar Gratis</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
