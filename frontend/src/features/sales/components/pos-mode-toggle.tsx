import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { fastModeAtom, toggleFastModeAtom } from "@/features/sales/state";

export function PosModeToggle() {
  const fastMode = useAtomValue(fastModeAtom);
  const toggleFastMode = useSetAtom(toggleFastModeAtom);

  return (
    <div className="flex shrink-0 gap-2 rounded-lg border border-border bg-card p-1">
      <Button
        type="button"
        size="sm"
        variant={fastMode ? "ghost" : "accent"}
        className="flex-1"
        onClick={() => fastMode && toggleFastMode()}
      >
        Kasir
      </Button>
      <Button
        type="button"
        size="sm"
        variant={fastMode ? "accent" : "ghost"}
        className="flex-1"
        onClick={() => !fastMode && toggleFastMode()}
      >
        Mode Cepat
      </Button>
    </div>
  );
}
