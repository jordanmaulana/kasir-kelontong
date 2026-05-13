import {
  Barcode,
  KeyRound,
  LineChart,
  PackageMinus,
  Receipt,
  Store,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const features: Feature[] = [
  {
    icon: Store,
    title: "Banyak toko, satu aplikasi",
    desc: "Kelola semua cabang dari satu akun. Tiap toko punya kasir dan stok sendiri.",
  },
  {
    icon: KeyRound,
    title: "Kasir cukup pakai PIN",
    desc: "Tiap kasir punya PIN sendiri. Tidak perlu hafal email atau password panjang.",
  },
  {
    icon: Barcode,
    title: "Daftar barang sekali pakai",
    desc: "Buat daftar barang sekali, dipakai semua toko. Scan barcode juga bisa.",
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
    <section aria-labelledby="features-title" className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="features-title"
            className="text-3xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            Semua yang Anda butuhkan untuk jaga toko
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Dibuat sesederhana mungkin. Tidak perlu pelatihan.
          </p>
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex size-14 items-center justify-center rounded-md bg-accent/20 ring-1 ring-accent/40">
                <Icon className="size-7 text-foreground" strokeWidth={2.2} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
              <p className="text-base text-muted-foreground">{desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
