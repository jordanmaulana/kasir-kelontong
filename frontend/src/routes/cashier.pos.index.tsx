import { createFileRoute } from "@tanstack/react-router";

import { CashierGate } from "@/features/cashier-auth/components/cashier-gate";
import { PosPage } from "@/features/sales/components/pos-page";

export const Route = createFileRoute("/cashier/pos/")({
  component: () => (
    <CashierGate>
      <PosPage />
    </CashierGate>
  ),
});
