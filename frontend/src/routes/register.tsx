import { createFileRoute } from "@tanstack/react-router";

import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

export const Route = createFileRoute("/register")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center px-4">
      <EmailAuthForm mode="register" />
    </div>
  ),
});
