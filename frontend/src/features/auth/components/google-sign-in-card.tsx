import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { useGoogleSignIn } from "@/features/auth/hooks";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleSignInCard() {
  const ref = useRef<HTMLDivElement>(null);
  const signIn = useGoogleSignIn();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) =>
        signIn.mutate(credential, {
          onSuccess: () => navigate({ to: "/dashboard" }),
          onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal masuk"),
        }),
    });
    window.google.accounts.id.renderButton(ref.current, {
      type: "standard",
      theme: "outline",
      size: "large",
    });
  }, [clientId, signIn, navigate]);

  return (
    <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="mb-4 text-base font-semibold text-foreground">Atau gunakan akun Google</p>
      <div ref={ref} className="flex justify-center" />
      {!clientId && (
        <p className="mt-3 text-sm font-semibold text-destructive">
          VITE_GOOGLE_CLIENT_ID belum diatur.
        </p>
      )}
    </div>
  );
}
