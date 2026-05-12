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
      className="border-y border-amber-100 bg-amber-50/60 py-10"
    >
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-lg text-neutral-700">Cocok untuk:</p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {audiences.map((label) => (
            <li
              key={label}
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-base text-neutral-800 shadow-sm"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
