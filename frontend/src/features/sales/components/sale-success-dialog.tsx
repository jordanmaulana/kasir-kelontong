import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Sale } from "@/features/sales/types";

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);

interface Props {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}

export function SaleSuccessDialog({ sale, onClose, onNewSale }: Props) {
  const totalUnits = sale.lines.reduce((s, l) => s + l.qty, 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaksi tersimpan</DialogTitle>
          <DialogDescription>
            ID transaksi <span className="font-mono">{sale.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              Kembalian
            </p>
            <p className="mt-1 font-mono text-4xl font-bold text-emerald-700">
              Rp{fmtIDR(sale.change)}
            </p>
          </div>

          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Item</dt>
              <dd className="font-mono">
                {sale.lines.length} item · {totalUnits} unit
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Total bayar</dt>
              <dd className="font-mono">Rp{fmtIDR(sale.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Uang diterima</dt>
              <dd className="font-mono">Rp{fmtIDR(sale.tendered)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <dt className="font-medium text-slate-900">Kembalian</dt>
              <dd className="font-mono font-semibold">
                Rp{fmtIDR(sale.change)}
              </dd>
            </div>
          </dl>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={onNewSale} autoFocus>
            Transaksi baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
