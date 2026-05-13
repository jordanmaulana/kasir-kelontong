import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "block w-full rounded-md border-2 border-input bg-card px-4 py-3 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 transition-colors focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive min-h-[7rem]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
