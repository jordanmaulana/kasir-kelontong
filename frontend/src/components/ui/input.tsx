import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "block w-full rounded-md border-2 border-input bg-card px-4 h-12 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 transition-colors focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
