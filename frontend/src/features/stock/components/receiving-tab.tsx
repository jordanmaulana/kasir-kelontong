import { Plus, Search, Trash2 } from "lucide-react";
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

interface Props {
  storeId: string;
}

interface DraftLine extends ReceivingItemInput {
  product_name: string;
}

export function ReceivingTab({ storeId }: Props) {
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products } = useProducts(search.trim() ? search : undefined);
  const submit = useReceiving(storeId);
  const { data: recentMovements } = useMovements(storeId, {
    reason: "receiving",
    limit: 20,
  });

  const candidates = useMemo(() => {
    if (!search.trim()) return [];
    const inCart = new Set(lines.map((l) => l.product_id));
    return (products ?? []).filter((p) => !inCart.has(p.id)).slice(0, 6);
  }, [products, search, lines]);

  const addLine = (product: Product) => {
    setLines((prev) => [
      ...prev,
      { product_id: product.id, product_name: product.name, qty: 1 },
    ]);
    setSearch("");
    searchRef.current?.focus();
  };

  const updateQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId ? { ...l, qty: Math.max(0, qty) } : l
      )
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  };

  const canSubmit =
    lines.length > 0 && lines.every((l) => Number.isInteger(l.qty) && l.qty > 0);

  const onSubmit = () => {
    submit.mutate(
      {
        items: lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
      },
      {
        onSuccess: () => {
          toast.success(`Penerimaan ${lines.length} item tersimpan`);
          setLines([]);
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-900">
          Penerimaan stok
        </h2>
        <p className="text-sm text-slate-600">
          Tambahkan barang yang masuk, lalu simpan untuk menambah stok toko ini.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk (nama atau barcode)"
          className="pl-8"
          autoFocus
        />
        {candidates.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => addLine(p)}
              >
                <span className="font-medium text-slate-900">{p.name}</span>
                <span className="font-mono text-xs text-slate-500">
                  {p.barcode ?? "—"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-base font-medium text-slate-900">
            Belum ada item
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Cari dan pilih produk di atas untuk menambah baris penerimaan.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="w-32 text-right">Qty</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.product_id}>
                  <TableCell className="font-medium text-slate-900">
                    {line.product_name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={line.qty}
                      onChange={(e) =>
                        updateQty(line.product_id, Number(e.target.value))
                      }
                      className="ml-auto w-24 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Hapus ${line.product_name}`}
                      onClick={() => removeLine(line.product_id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total {lines.length} item ·{" "}
              {lines.reduce((s, l) => s + (Number.isFinite(l.qty) ? l.qty : 0), 0)}{" "}
              unit
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLines([])}
                disabled={submit.isPending}
              >
                Bersihkan
              </Button>
              <Button onClick={onSubmit} disabled={!canSubmit || submit.isPending}>
                <Plus className="mr-1 h-4 w-4" />
                {submit.isPending ? "Menyimpan…" : "Simpan penerimaan"}
              </Button>
            </div>
          </div>
        </>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">
          Riwayat penerimaan terakhir
        </h3>
        {!recentMovements || recentMovements.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada penerimaan tercatat.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="w-20 text-right">Qty</TableHead>
                <TableHead className="w-40">Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-slate-600">
                    {new Date(m.created_on).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {m.product_name}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-700">
                    +{m.delta}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {m.actor_email ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
