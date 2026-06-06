import { CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import type { Sale } from "@/features/sales/types";

interface Props {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}

export function SaleSuccessDialog({ sale, onClose, onNewSale }: Props) {
  const hasWeighted = sale.lines.some((l) => l.is_weighted);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]">
              <CheckCircle2 className="size-6" strokeWidth={2.4} />
            </div>
            <DialogTitle>Transaksi Berhasil</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-[color:var(--color-success)]/12 p-4 text-center ring-1 ring-[color:var(--color-success)]/25">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-success)]">
              Kembalian
            </p>
            <div className="mt-2">
              <Money
                value={sale.change}
                size="2xl"
                className="text-[color:var(--color-success)]"
              />
            </div>
          </div>

          <dl className="space-y-2 text-sm">
            {sale.lines.length > 0 && (
              <div className="flex items-baseline justify-between">
                <dt className="text-muted-foreground">Item</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {sale.lines.length} item{hasWeighted ? " (termasuk timbang)" : ""}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Total bayar</dt>
              <dd>
                <Money value={sale.subtotal} size="sm" />
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Uang diterima</dt>
              <dd>
                <Money value={sale.tendered} size="sm" />
              </dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="accent" onClick={onNewSale} autoFocus>
            Transaksi Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
