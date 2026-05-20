import { Plus, PackagePlus, Search, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/features/products/hooks";
import type { Product } from "@/features/products/types";
import { useMovements, useReceiving } from "@/features/stock/hooks";
import type { ReceivingItemInput } from "@/features/stock/types";
import { ApiError } from "@/lib/api";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface Props {
  storeId: string;
}

interface DraftLine extends ReceivingItemInput {
  product_name: string;
  is_weighted: boolean;
  unit_label: string;
}

export function ReceivingTab({ storeId }: Props) {
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products } = useProducts(search.trim() ? { q: search, pageSize: 20 } : undefined);
  const submit = useReceiving(storeId);
  const { data: recentMovements } = useMovements(storeId, {
    reason: "receiving",
    limit: 20,
  });

  const candidates = useMemo(() => {
    if (!search.trim()) return [];
    const inCart = new Set(lines.map((l) => l.product_id));
    return (products?.results ?? []).filter((p) => !inCart.has(p.id)).slice(0, 6);
  }, [products, search, lines]);

  const addLine = (product: Product) => {
    setLines((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        qty: 1,
        is_weighted: product.is_weighted,
        unit_label: product.unit_label,
      },
    ]);
    setSearch("");
    searchRef.current?.focus();
  };

  const updateQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.product_id === productId ? { ...l, qty: Math.max(0, qty) } : l)),
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  };

  const canSubmit =
    lines.length > 0 &&
    lines.every((l) => l.qty > 0 && (l.is_weighted || Number.isInteger(l.qty)));

  const onSubmit = () => {
    submit.mutate(
      { items: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })) },
      {
        onSuccess: () => {
          toast.success(`Kulakan ${lines.length} item tersimpan`);
          setLines([]);
        },
        onError: (err) => {
          if (err instanceof ApiError) toast.error(err.message);
          else toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-foreground">Kulakan (Barang Masuk)</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Catat barang yang masuk dari supplier, lalu simpan untuk menambah stok toko.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk (nama atau barcode)…"
          className="pl-12"
          autoFocus
        />
        {candidates.length > 0 && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border-2 border-border bg-card shadow-xl">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base hover:bg-muted focus-visible:bg-muted focus:outline-none"
                onClick={() => addLine(p)}
              >
                <span className="font-semibold text-foreground">{p.name}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {p.barcode ?? "—"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-card/60 p-10 text-center">
          <PackagePlus className="size-8 text-muted-foreground" />
          <h3 className="text-lg font-bold text-foreground">Belum ada item</h3>
          <p className="max-w-md text-base text-muted-foreground">
            Cari dan pilih produk di atas untuk menambah baris kulakan.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="w-40 text-right">Qty Masuk</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.product_id} className="h-20">
                  <TableCell className="font-semibold text-foreground">
                    {line.product_name}
                    {line.is_weighted && (
                      <span className="ml-2 rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                        per {line.unit_label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        inputMode={line.is_weighted ? "decimal" : "numeric"}
                        min={line.is_weighted ? 0.01 : 1}
                        step={line.is_weighted ? 0.01 : 1}
                        value={line.qty}
                        onChange={(e) => updateQty(line.product_id, Number(e.target.value))}
                        className="h-14 w-28 text-right font-mono text-xl"
                      />
                      {line.is_weighted && (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {line.unit_label}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Hapus ${line.product_name}`}
                      onClick={() => removeLine(line.product_id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-muted-foreground">
              Total {lines.length} item
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setLines([])} disabled={submit.isPending}>
                Bersihkan
              </Button>
              <Button
                variant="accent"
                size="lg"
                onClick={onSubmit}
                disabled={!canSubmit || submit.isPending}
              >
                <Plus className="size-5" />
                {submit.isPending ? "Menyimpan…" : "Simpan Kulakan"}
              </Button>
            </div>
          </div>
        </>
      )}

      <section className="space-y-3">
        <h3 className="text-base font-bold text-foreground">Kulakan Terakhir</h3>
        {!recentMovements || recentMovements.length === 0 ? (
          <p className="text-base text-muted-foreground">Belum ada kulakan tercatat.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-52">Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="w-24 text-right">Qty</TableHead>
                <TableHead className="w-48">Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground">
                    {dateFmt.format(new Date(m.created_on))}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {m.product_name}
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg font-bold text-[color:var(--color-success)]">
                    +{m.delta}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.actor_email ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
