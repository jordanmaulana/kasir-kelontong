import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Package, Store } from "lucide-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { userAtom } from "@/features/auth/state";
import { useLogout } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/products", label: "Produk", icon: Package },
] as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex h-14 items-center gap-3 rounded-md px-4 text-base font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-accent"
              />
            )}
            <Icon className="size-6 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
        <Store className="size-5" strokeWidth={2.4} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-foreground">
          KasirKelontong
        </span>
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Pengelola Toko
        </span>
      </div>
    </div>
  );
}

function UserFooter({ email, onLogout, busy }: { email: string; onLogout: () => void; busy: boolean }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-5">
      <div className="text-sm text-muted-foreground">Masuk sebagai</div>
      <div className="truncate text-base font-semibold text-foreground" title={email}>
        {email}
      </div>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={onLogout}
        disabled={busy}
        className="w-full justify-start"
      >
        <LogOut className="size-5" />
        Keluar
      </Button>
    </div>
  );
}

export function AppShell() {
  const [user] = useAtom(userAtom);
  const logout = useLogout();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => logout.mutate();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row lg:overflow-hidden lg:h-screen">
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-border bg-card lg:flex">
        <div className="flex flex-col gap-8 px-5 py-7">
          <Brand />
          <NavLinks pathname={pathname} />
        </div>
        {user && <UserFooter email={user.email} onLogout={handleLogout} busy={logout.isPending} />}
      </aside>

      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Brand />
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Buka menu">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex h-full flex-col justify-between">
              <div className="flex flex-col gap-8 px-5 pb-6 pt-8">
                <Brand />
                <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              </div>
              {user && (
                <UserFooter email={user.email} onLogout={handleLogout} busy={logout.isPending} />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <section className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
