import { createFileRoute } from "@tanstack/react-router";

import { CashierGate } from "@/features/cashier-auth/components/cashier-gate";
import { TodaysSalesPage } from "@/features/sales/components/todays-sales-page";

export const Route = createFileRoute("/cashier/pos/sales")({
  component: () => (
    <CashierGate>
      <TodaysSalesPage />
    </CashierGate>
  ),
});
