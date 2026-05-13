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
      className={cn("mb-2 block text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export { Label };
