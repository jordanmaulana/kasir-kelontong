import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const logout = useLogout();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold">Onboarding</h1>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Replace with your project's onboarding form.
        </p>
      </div>
    </div>
  );
}
