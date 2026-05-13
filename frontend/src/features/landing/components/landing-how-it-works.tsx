const steps = [
  {
    n: "1",
    title: "Daftar pakai email",
    desc: "Buat akun pemilik dengan email dan nama usaha Anda. Gratis.",
  },
  {
    n: "2",
    title: "Tambah toko & barang",
    desc: "Masukkan data toko dan daftar barang. Bisa scan barcode.",
  },
  {
    n: "3",
    title: "Mulai catat jualan",
    desc: "Buat PIN untuk kasir, lalu mulai catat tiap penjualan.",
  },
];

export function LandingHowItWorks() {
  return (
    <section aria-labelledby="how-title" className="bg-muted py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-title"
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Mulai dalam 3 langkah
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tidak perlu pelatihan. Tidak perlu pasang aplikasi.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.n}
              className="relative rounded-lg border border-border bg-card p-7 shadow-sm"
            >
              <div className="flex size-14 items-center justify-center rounded-md bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
                {step.n}
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-base text-muted-foreground">{step.desc}</p>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-4 top-14 hidden text-3xl font-bold text-accent md:block"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
