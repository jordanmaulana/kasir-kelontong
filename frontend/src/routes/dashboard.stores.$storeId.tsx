import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, MapPin } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashiersTab } from "@/features/cashiers/components/cashiers-tab";
import { ReportsTab } from "@/features/reports/components/reports-tab";
import { MovementsTab } from "@/features/stock/components/movements-tab";
import { ReceivingTab } from "@/features/stock/components/receiving-tab";
import { StockTab } from "@/features/stock/components/stock-tab";
import { useStores } from "@/features/stores/hooks";

export const Route = createFileRoute("/dashboard/stores/$storeId")({
  component: StoreDetailPage,
});

function StoreDetailPage() {
  const { storeId } = Route.useParams();
  const { data: stores, isLoading, isError, error } = useStores();
  const store = stores?.find((s) => s.id === storeId);

  return (
    <div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-base font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
        Kembali ke daftar toko
      </Link>

      {isLoading ? (
        <p className="mt-8 text-base text-muted-foreground">Memuat…</p>
      ) : isError ? (
        <p className="mt-8 text-base font-semibold text-destructive">
          {error instanceof Error ? error.message : "Gagal memuat toko"}
        </p>
      ) : !store ? (
        <div className="mt-8 rounded-lg border-2 border-dashed border-border bg-card/60 p-12 text-center">
          <h2 className="text-xl font-bold text-foreground">Toko tidak ditemukan</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Toko mungkin sudah dihapus atau Anda tidak punya akses.
          </p>
        </div>
      ) : (
        <>
          <header className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-accent px-3 py-1 font-mono text-base font-bold tracking-wider text-accent-foreground">
                {store.code}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{store.name}</h1>
              {store.address && (
                <p className="flex items-start gap-2 text-base text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{store.address}</span>
                </p>
              )}
            </div>
          </header>

          <Tabs defaultValue="kasir" className="mt-8">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="kasir">Kasir</TabsTrigger>
              <TabsTrigger value="stok">Stok</TabsTrigger>
              <TabsTrigger value="penerimaan">Kulakan</TabsTrigger>
              <TabsTrigger value="laporan">Laporan</TabsTrigger>
              <TabsTrigger value="riwayat">Riwayat Stok</TabsTrigger>
            </TabsList>
            <TabsContent value="kasir">
              <CashiersTab storeId={store.id} />
            </TabsContent>
            <TabsContent value="stok">
              <StockTab storeId={store.id} />
            </TabsContent>
            <TabsContent value="penerimaan">
              <ReceivingTab storeId={store.id} />
            </TabsContent>
            <TabsContent value="laporan">
              <ReportsTab storeId={store.id} />
            </TabsContent>
            <TabsContent value="riwayat">
              <MovementsTab storeId={store.id} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
