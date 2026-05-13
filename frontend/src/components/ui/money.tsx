import * as React from "react";

import { cn } from "@/lib/utils";

type MoneySize = "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

const sizeMap: Record<MoneySize, string> = {
  sm: "text-base",
  base: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
  "2xl": "text-3xl",
  "3xl": "text-3xl tracking-tight",
};

const idr = new Intl.NumberFormat("id-ID");

interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | null | undefined;
  size?: MoneySize;
  showSign?: boolean;
  muted?: boolean;
  prefix?: string;
}

function Money({
  value,
  size = "base",
  showSign = false,
  muted = false,
  prefix = "Rp",
  className,
  ...props
}: MoneyProps) {
  const n = Number.isFinite(value as number) ? (value as number) : 0;
  const sign = showSign && n > 0 ? "+" : n < 0 ? "−" : "";
  const formatted = idr.format(Math.abs(n));
  return (
    <span
      data-slot="money"
      className={cn(
        "font-mono font-bold tabular-nums whitespace-nowrap",
        sizeMap[size],
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
      {...props}
    >
      {sign}
      {prefix}
      <span className="mx-0.5" aria-hidden="true" />
      {formatted}
    </span>
  );
}

export { Money };
