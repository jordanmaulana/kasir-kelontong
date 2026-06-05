import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { CashierShell } from "@/components/layout/cashier-shell";
import { cashierSessionAtom } from "@/features/cashier-auth/state";
import { PosCalculator } from "@/features/sales/components/pos-calculator";
import { PosCart } from "@/features/sales/components/pos-cart";
import { PosModeToggle } from "@/features/sales/components/pos-mode-toggle";
import { PosPaymentPanel } from "@/features/sales/components/pos-payment-panel";
import { PosSearch } from "@/features/sales/components/pos-search";
import { SaleSuccessDialog } from "@/features/sales/components/sale-success-dialog";
import { completedSaleAtom, fastModeAtom, resetPosAtom } from "@/features/sales/state";

export function PosPage() {
  const session = useAtomValue(cashierSessionAtom);
  const fastMode = useAtomValue(fastModeAtom);
  const [completedSale, setCompletedSale] = useAtom(completedSaleAtom);
  const reset = useSetAtom(resetPosAtom);

  if (!session) return null;

  return (
    <CashierShell maxWidth="6xl" fill>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PosModeToggle />

        <div className="grid min-h-0 flex-1 gap-4 md:min-h-0 lg:grid-cols-[1fr_400px]">
          {fastMode ? (
            <PosCalculator />
          ) : (
            <section className="flex min-h-0 flex-col gap-3">
              <PosSearch />
              <PosCart />
            </section>
          )}

          <PosPaymentPanel />
        </div>
      </div>

      {completedSale && (
        <SaleSuccessDialog
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            reset();
          }}
        />
      )}
    </CashierShell>
  );
}
