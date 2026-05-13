import * as React from "react";

import { cn } from "@/lib/utils";

interface PageTitleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

function PageTitle({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
  ...props
}: PageTitleProps) {
  return (
    <header
      data-slot="page-title"
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export { PageTitle };
