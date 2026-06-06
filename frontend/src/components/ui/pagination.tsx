import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Token = number | "ellipsis-left" | "ellipsis-right";

function buildPages(current: number, total: number): Token[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const tokens: Token[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) tokens.push("ellipsis-left");
  for (let p = left; p <= right; p += 1) tokens.push(p);
  if (right < total - 1) tokens.push("ellipsis-right");
  tokens.push(total);
  return tokens;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const tokens = buildPages(page, totalPages);
  const atFirst = page <= 1;
  const atLast = page >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Navigasi halaman"
      className={cn("mt-6 flex items-center justify-center gap-1", className)}
    >
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Halaman pertama"
        disabled={atFirst}
        onClick={() => onPageChange(1)}
      >
        <ChevronsLeft className="size-5" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Halaman sebelumnya"
        disabled={atFirst}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-5" />
      </Button>

      {tokens.map((token) =>
        typeof token === "number" ? (
          <Button
            key={token}
            size="icon-sm"
            variant={token === page ? "accent" : "ghost"}
            aria-label={`Halaman ${token}`}
            aria-current={token === page ? "page" : undefined}
            onClick={() => onPageChange(token)}
            className="w-auto! min-w-10 px-2 tabular-nums"
          >
            {token}
          </Button>
        ) : (
          <span
            key={token}
            aria-hidden="true"
            className="flex size-10 items-center justify-center text-muted-foreground"
          >
            <MoreHorizontal className="size-5" />
          </span>
        ),
      )}

      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Halaman berikutnya"
        disabled={atLast}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-5" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Halaman terakhir"
        disabled={atLast}
        onClick={() => onPageChange(totalPages)}
      >
        <ChevronsRight className="size-5" />
      </Button>
    </nav>
  );
}
