const steps = [
  {
    n: "1",
    title: "Daftar pakai email",
    desc: "Buat akun pemilik dengan email dan nama usaha Anda. Gratis.",
  },
  {
    n: "2",
    title: "Tambah toko & barang",
    desc: "Masukkan toko Anda dan daftar barang yang dijual. Bisa scan barcode.",
  },
  {
    n: "3",
    title: "Mulai catat jualan",
    desc: "Buatkan PIN untuk kasir, lalu mulai catat tiap penjualan.",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="bg-neutral-50 py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-title"
            className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl"
          >
            Mulai dalam 3 langkah
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Tidak perlu pelatihan. Tidak perlu pasang aplikasi.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.n}
              className="relative rounded-2xl bg-white p-6 ring-1 ring-neutral-200"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-xl font-semibold text-amber-700">
                {step.n}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-neutral-900">
                {step.title}
              </h3>
              <p className="mt-2 text-base text-neutral-600">{step.desc}</p>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-4 top-12 hidden text-2xl text-amber-300 md:block"
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
