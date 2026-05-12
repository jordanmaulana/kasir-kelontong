import {
  Barcode,
  KeyRound,
  LineChart,
  PackageMinus,
  Receipt,
  Store,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const features: Feature[] = [
  {
    icon: Store,
    title: "Banyak toko, satu aplikasi",
    desc: "Kelola semua cabang toko Anda dari satu akun. Tiap toko punya kasir dan stok sendiri.",
  },
  {
    icon: KeyRound,
    title: "Kasir cukup pakai PIN",
    desc: "Tiap kasir punya PIN sendiri. Tidak perlu hafal email atau password panjang.",
  },
  {
    icon: Barcode,
    title: "Daftar barang sekali pakai",
    desc: "Daftar barang dibuat sekali, dipakai semua toko Anda. Scan barcode juga bisa.",
  },
  {
    icon: PackageMinus,
    title: "Stok berkurang otomatis",
    desc: "Setiap kali jual, stok langsung berkurang. Tidak perlu hitung ulang manual.",
  },
  {
    icon: LineChart,
    title: "Lihat penjualan harian",
    desc: "Berapa laku hari ini? Barang apa paling laris? Cek lewat HP kapan saja.",
  },
  {
    icon: Receipt,
    title: "Cetak struk langsung",
    desc: "Cetak struk dari HP atau printer biasa. Pembeli dapat bukti, Anda dapat catatan.",
  },
];

export function LandingFeatures() {
  return (
    <section
      aria-labelledby="features-title"
      className="bg-white py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="features-title"
            className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl"
          >
            Semua yang Anda butuhkan untuk jaga toko
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Dibuat sesederhana mungkin. Tidak perlu pelatihan.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <li key={title}>
              <Card className="h-full bg-white p-2 ring-neutral-200">
                <CardHeader className="gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200">
                    <Icon className="size-7 text-amber-600" strokeWidth={2} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-neutral-900">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-base text-neutral-600">
                    {desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
