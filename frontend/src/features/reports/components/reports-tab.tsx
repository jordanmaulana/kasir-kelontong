import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/ui/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadSalesReportCsv } from "@/features/reports/api";
import { useSalesReport } from "@/features/reports/hooks";

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface Props {
  storeId: string;
}

function todayIso(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function ReportsTab({ storeId }: Props) {
  const today = todayIso();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const { data, isLoading, isError, error } = useSalesReport(storeId, from, to);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function onDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { blob, filename } = await downloadSalesReportCsv(storeId, from, to);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Gagal mengunduh");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
        <div className="flex-1 sm:max-w-xs">
          <Label htmlFor="report-from">Dari tanggal</Label>
          <Input
            id="report-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to}
          />
        </div>
        <div className="flex-1 sm:max-w-xs">
          <Label htmlFor="report-to">Sampai tanggal</Label>
          <Input
            id="report-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from}
          />
        </div>
        <Button
          variant="outline"
          onClick={onDownload}
          disabled={downloading || isLoading || !data}
        >
          <Download className="size-5" />
          {downloading ? "Mengunduh…" : "Unduh CSV"}
        </Button>
      </div>

      {downloadError && (
        <p className="text-base font-semibold text-destructive">{downloadError}</p>
      )}

      {isLoading ? (
        <p className="text-base text-muted-foreground">Memuat…</p>
      ) : isError ? (
        <p className="text-base font-semibold text-destructive">
          {error instanceof Error ? error.message : "Gagal memuat laporan"}
        </p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Jumlah Transaksi" value={String(data.summary.count)} />
            <SummaryCard
              label="Total Pendapatan"
              money={<Money value={data.summary.gross_revenue} size="xl" />}
            />
            <SummaryCard label="Item Terjual" value={String(data.summary.items_sold)} />
          </div>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Daftar Penjualan</h3>
            {data.sales.length === 0 ? (
              <EmptyBlock label="Tidak ada penjualan pada rentang ini." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead className="w-24 text-right">Baris</TableHead>
                    <TableHead className="w-44 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">
                        {dateTimeFmt.format(new Date(s.created_on))}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {s.cashier_name}
                      </TableCell>
                      <TableCell className="text-right">{s.line_count}</TableCell>
                      <TableCell className="text-right">
                        <Money value={s.subtotal} size="base" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-foreground">Produk Terlaris</h3>
            {data.top_products.length === 0 ? (
              <EmptyBlock label="Belum ada data produk." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="w-40">Barcode</TableHead>
                    <TableHead className="w-24 text-right">Qty</TableHead>
                    <TableHead className="w-44 text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_products.map((p) => (
                    <TableRow key={p.product_id}>
                      <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {p.barcode ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">{p.qty_sold}</TableCell>
                      <TableCell className="text-right">
                        <Money value={p.revenue} size="base" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  money,
}: {
  label: string;
  value?: string;
  money?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {money ?? value}
      </div>
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-card/60 p-8 text-center text-base text-muted-foreground">
      {label}
    </div>
  );
}
