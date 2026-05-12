import * as React from "react";
import { Label as RadixLabel } from "radix-ui";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof RadixLabel.Root>) {
  return (
    <RadixLabel.Root
      data-slot="label"
      className={cn(
        "block text-sm font-medium text-slate-700",
        className
      )}
      {...props}
    />
  );
}

export { Label };
