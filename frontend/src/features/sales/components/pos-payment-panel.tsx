import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/ui/money";
import { useCheckout } from "@/features/sales/components/pos-hooks";
import {
  DENOMINATIONS,
  changeAtom,
  fastAmountAtom,
  fastModeAtom,
  idr,
  linesAtom,
  resetPosAtom,
  subtotalAtom,
  tenderedAtom,
} from "@/features/sales/state";
import { cn } from "@/lib/utils";

export function PosPaymentPanel() {
  const subtotal = useAtomValue(subtotalAtom);
  const change = useAtomValue(changeAtom);
  const fastMode = useAtomValue(fastModeAtom);
  const fastAmount = useAtomValue(fastAmountAtom);
  const lines = useAtomValue(linesAtom);
  const [tendered, setTendered] = useAtom(tenderedAtom);
  const reset = useSetAtom(resetPosAtom);
  const { canSubmit, onSubmit, create } = useCheckout();

  return (
    <aside className="lg:h-full lg:min-h-0">
      <div className="rounded-lg border border-border bg-card p-3 shadow-md lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
        <div className="border-b border-border pb-2 lg:shrink-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Total Belanja
          </p>
          <div className="mt-1">
            <Money value={subtotal} size="xl" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {fastMode ? "Mode Cepat" : `${lines.length} item`}
          </p>
        </div>

        <div className="mt-2 space-y-2 lg:flex-1">
          <Label htmlFor="tendered">Uang dari Pembeli</Label>
          <Input
            id="tendered"
            type="number"
            inputMode="numeric"
            min={0}
            value={tendered === 0 ? "" : tendered}
            onChange={(e) => setTendered(Number(e.target.value || 0))}
            placeholder="0"
            className="h-11 text-right font-mono text-xl"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {DENOMINATIONS.map((preset) => (
              <Button
                key={preset}
                size="default"
                variant="outline"
                type="button"
                className="h-9 px-3 text-base"
                onClick={() => setTendered((t) => t + preset)}
              >
                + {idr.format(preset)}
              </Button>
            ))}
            <Button
              size="default"
              variant="ghost"
              type="button"
              className="h-9 col-span-2 sm:col-span-3 lg:col-span-4 px-3 text-base text-muted-foreground hover:text-foreground"
              onClick={() => setTendered(subtotal)}
              disabled={subtotal === 0}
            >
              Uang pas
            </Button>
          </div>
        </div>

        <div className="mt-2 rounded-md bg-muted p-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-base font-semibold text-muted-foreground">Kembalian</span>
            <Money
              value={change}
              size="lg"
              className={cn(
                tendered >= subtotal && subtotal > 0
                  ? "text-[color:var(--color-success)]"
                  : "text-muted-foreground/60",
              )}
            />
          </div>
          {tendered > 0 && tendered < subtotal && (
            <p className="mt-2 text-sm font-bold text-destructive">
              Kurang <Money value={subtotal - tendered} size="sm" className="text-destructive" />
            </p>
          )}
        </div>

        <div className="mt-3 lg:mt-0 lg:shrink-0 lg:pt-3">
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {create.isPending ? "Memproses…" : "Bayar Sekarang"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            disabled={
              (fastMode ? fastAmount === 0 && tendered === 0 : lines.length === 0) ||
              create.isPending
            }
            onClick={reset}
          >
            {fastMode ? "Reset" : "Kosongkan Keranjang"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
