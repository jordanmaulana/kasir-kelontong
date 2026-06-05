import { useAtomValue, useSetAtom } from "jotai";
import { Delete } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  calcBackspaceAtom,
  calcClearAtom,
  calcEqualsAtom,
  fastAmountAtom,
  fastExprAtom,
  idr,
  pushCalcAtom,
} from "@/features/sales/state";

export function PosCalculator() {
  const fastExpr = useAtomValue(fastExprAtom);
  const fastAmount = useAtomValue(fastAmountAtom);
  const pushCalc = useSetAtom(pushCalcAtom);
  const calcBackspace = useSetAtom(calcBackspaceAtom);
  const calcClear = useSetAtom(calcClearAtom);
  const calcEquals = useSetAtom(calcEqualsAtom);

  return (
    <section className="flex min-h-0 flex-col gap-3">
      <div className="rounded-lg border-2 border-border bg-card p-6">
        <Label className="text-base">Total Belanja</Label>
        <div className="mt-3 rounded-md border-2 border-input bg-background px-4 py-2">
          <div className="h-6 truncate text-right font-mono text-base text-muted-foreground">
            {fastExpr || "0"}
          </div>
          <div className="text-right font-mono text-3xl font-bold tabular-nums">
            {idr.format(fastAmount)}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-14 text-lg font-bold text-destructive hover:bg-destructive/10"
            onClick={calcClear}
            disabled={fastExpr === ""}
          >
            C
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="Hapus karakter terakhir"
            className="h-14"
            onClick={calcBackspace}
            disabled={fastExpr === ""}
          >
            <Delete className="size-6" />
          </Button>
          <Button
            type="button"
            variant="accent"
            className="h-14 text-2xl"
            onClick={() => pushCalc("÷")}
          >
            ÷
          </Button>
          <Button
            type="button"
            variant="accent"
            className="h-14 text-2xl"
            onClick={() => pushCalc("×")}
          >
            ×
          </Button>

          {["7", "8", "9"].map((d) => (
            <Button
              key={d}
              type="button"
              variant="outline"
              className="h-14 text-xl font-semibold"
              onClick={() => pushCalc(d)}
            >
              {d}
            </Button>
          ))}
          <Button
            type="button"
            variant="accent"
            className="h-14 text-2xl"
            onClick={() => pushCalc("-")}
          >
            −
          </Button>

          {["4", "5", "6"].map((d) => (
            <Button
              key={d}
              type="button"
              variant="outline"
              className="h-14 text-xl font-semibold"
              onClick={() => pushCalc(d)}
            >
              {d}
            </Button>
          ))}
          <Button
            type="button"
            variant="accent"
            className="h-14 text-2xl"
            onClick={() => pushCalc("+")}
          >
            +
          </Button>

          {["1", "2", "3"].map((d) => (
            <Button
              key={d}
              type="button"
              variant="outline"
              className="h-14 text-xl font-semibold"
              onClick={() => pushCalc(d)}
            >
              {d}
            </Button>
          ))}
          <Button
            type="button"
            variant="accent"
            className="row-span-2 h-full text-2xl"
            onClick={calcEquals}
          >
            =
          </Button>

          <Button
            type="button"
            variant="outline"
            className="col-span-2 h-14 text-xl font-semibold"
            onClick={() => pushCalc("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 text-xl font-semibold"
            onClick={() => pushCalc("000")}
          >
            000
          </Button>
        </div>
      </div>
    </section>
  );
}
