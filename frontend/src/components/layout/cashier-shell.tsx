import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Home, ListChecks, LogOut, ScanLine, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCashierLogout } from "@/features/cashier-auth/hooks";
import { cashierSessionAtom } from "@/features/cashier-auth/state";
import { cn } from "@/lib/utils";

interface CashierShellProps {
  children: React.ReactNode;
  /** Max width of the inner content. Defaults to 6xl. */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  /**
   * Lock the shell to the viewport height on tablet/desktop (md+) so the page
   * fits without scrolling — children manage their own internal scroll. Phones
   * keep the normal scrolling layout with the bottom nav.
   */
  fill?: boolean;
}

const TABS = [
  { to: "/cashier/home", label: "Beranda", icon: Home },
  { to: "/cashier/pos", label: "Kasir", icon: ScanLine },
  { to: "/cashier/pos/sales", label: "Penjualan", icon: ListChecks },
] as const;

const maxWMap: Record<NonNullable<CashierShellProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-none",
};

export function CashierShell({ children, maxWidth = "6xl", fill = false }: CashierShellProps) {
  const [session] = useAtom(cashierSessionAtom);
  const logout = useCashierLogout();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!session) return null;

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate({ to: "/cashier" }),
    });
  };

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background pb-24 md:pb-0",
        fill && "md:h-dvh md:min-h-0 md:overflow-hidden",
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className={cn("mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6", maxWMap[maxWidth])}>
          <Link to="/cashier/home" className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Store className="size-5" strokeWidth={2.4} />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-base font-bold text-foreground">{session.store.name}</span>
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Kasir · {session.cashier.display_name}
              </span>
            </div>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            disabled={logout.isPending}
            aria-label="Keluar dari sesi kasir"
          >
            <LogOut className="size-5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8",
          fill && "md:min-h-0 md:overflow-hidden md:py-4 sm:md:py-5",
          maxWMap[maxWidth],
        )}
      >
        {children}
      </main>

      <nav
        aria-label="Navigasi kasir"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-3xl">
          {TABS.map((tab) => {
            const active =
              tab.to === "/cashier/pos"
                ? pathname === "/cashier/pos"
                : pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <li key={tab.to} className="flex-1">
                <Link
                  to={tab.to}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-sm font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6 transition-transform",
                      active && "scale-110 text-accent",
                    )}
                  />
                  <span>{tab.label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-1 w-12 rounded-b-full bg-accent"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
