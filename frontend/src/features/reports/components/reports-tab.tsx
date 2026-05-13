import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatIDR } from "@/features/stock/format";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="report-from" className="text-xs text-slate-600">
            Dari
          </Label>
          <Input
            id="report-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44"
            max={to}
          />
        </div>
        <div>
          <Label htmlFor="report-to" className="text-xs text-slate-600">
            Sampai
          </Label>
          <Input
            id="report-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-44"
            min={from}
          />
        </div>
        <Button
          variant="outline"
          onClick={onDownload}
          disabled={downloading || isLoading || !data}
        >
          <Download className="mr-1 h-4 w-4" />
          {downloading ? "Mengunduh…" : "Unduh CSV"}
        </Button>
      </div>

      {downloadError && (
        <p className="text-sm text-red-600">{downloadError}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Gagal memuat laporan"}
        </p>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              title="Jumlah transaksi"
              value={data.summary.count.toString()}
            />
            <SummaryCard
              title="Total pendapatan"
              value={formatIDR(data.summary.gross_revenue)}
            />
            <SummaryCard
              title="Item terjual"
              value={data.summary.items_sold.toString()}
            />
          </div>

          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-900">
              Penjualan
            </h3>
            {data.sales.length === 0 ? (
              <EmptyBlock label="Tidak ada penjualan pada rentang ini." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead className="w-24 text-right">Baris</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-slate-700">
                        {new Date(s.created_on).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{s.cashier_name}</TableCell>
                      <TableCell className="text-right">
                        {s.line_count}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatIDR(s.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-slate-900">
              Produk terlaris
            </h3>
            {data.top_products.length === 0 ? (
              <EmptyBlock label="Belum ada data produk." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="w-32 font-mono text-xs">
                      Barcode
                    </TableHead>
                    <TableHead className="w-24 text-right">Qty</TableHead>
                    <TableHead className="w-32 text-right">
                      Pendapatan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_products.map((p) => (
                    <TableRow key={p.product_id}>
                      <TableCell className="font-medium text-slate-900">
                        {p.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {p.barcode ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">{p.qty_sold}</TableCell>
                      <TableCell className="text-right">
                        {formatIDR(p.revenue)}
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

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="hidden" />
    </Card>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
      {label}
    </div>
  );
}
