const audiences = [
  "Warung kelontong",
  "Toko sembako",
  "Toko ATK & fotokopi",
  "Minimarket kecil",
];

export function LandingAudienceStrip() {
  return (
    <section
      aria-label="Cocok untuk"
      className="border-y border-border bg-accent/10 py-12"
    >
      <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <p className="text-base font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Cocok untuk
        </p>
        <ul className="mt-5 flex flex-wrap justify-center gap-3">
          {audiences.map((label) => (
            <li
              key={label}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-base font-semibold text-foreground shadow-sm"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
