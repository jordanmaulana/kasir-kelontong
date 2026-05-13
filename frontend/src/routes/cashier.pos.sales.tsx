import { createFileRoute } from "@tanstack/react-router";

import { CashierShell } from "@/components/layout/cashier-shell";
import { CashierGate } from "@/features/cashier-auth/components/cashier-gate";
import { TodaysSalesPage } from "@/features/sales/components/todays-sales-page";

export const Route = createFileRoute("/cashier/pos/sales")({
  component: () => (
    <CashierGate>
      <CashierShell maxWidth="4xl">
        <TodaysSalesPage />
      </CashierShell>
    </CashierGate>
  ),
});
