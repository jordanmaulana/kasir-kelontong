import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CashiersTab } from "@/features/cashiers/components/cashiers-tab";
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Kembali ke daftar toko
      </Link>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Memuat…</p>
      ) : isError ? (
        <p className="mt-6 text-sm text-red-600">
          {error instanceof Error ? error.message : "Gagal memuat toko"}
        </p>
      ) : !store ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-base font-medium text-slate-900">
            Toko tidak ditemukan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Toko mungkin sudah dihapus atau Anda tidak memiliki akses.
          </p>
        </div>
      ) : (
        <>
          <header className="mt-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {store.name}
              </h1>
              <span className="font-mono text-sm text-slate-500">
                {store.code}
              </span>
            </div>
            {store.address && (
              <p className="mt-1 text-sm text-slate-600">{store.address}</p>
            )}
          </header>

          <Tabs defaultValue="kasir" className="mt-6">
            <TabsList>
              <TabsTrigger value="kasir">Kasir</TabsTrigger>
              <TabsTrigger value="stok">Stok</TabsTrigger>
              <TabsTrigger value="penerimaan">Kulakan</TabsTrigger>
              <TabsTrigger value="laporan">Laporan</TabsTrigger>
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
              <ComingSoon label="Laporan" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-base font-medium text-slate-900">{label}</h3>
      <p className="mt-1 text-sm text-slate-600">
        Hadir di rilis berikutnya (F4–F8).
      </p>
    </div>
  );
}
