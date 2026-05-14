# Indonesian POS Market Scan → Unique Propositions for KasirKelontong

## Context

KasirKelontong v1 is a cash-only, multi-store POS for Indonesian small grocery shops (kelontong/sembako). Stack: Django + DRF + React SPA. v1 scope locks down: admin/cashier dual auth, tenant isolation, per-store stock movement ledger, cash sales, basic reports. To position against an already-crowded market, we need a sharp wedge — not feature parity.

This document captures (a) what current Indonesian POS competitors offer + charge, (b) where they leave gaps, and (c) recommended unique propositions for KasirKelontong.

---

## Competitor landscape (mid-2026)

### Mid/upper tier (cloud-first, F&B leaning)

| App | Price/mo (IDR) | Strength | Weakness for kelontong |
|---|---|---|---|
| **Moka POS** | 250k | Polished UI, CRM, payment gateway integrations | F&B-skewed, expensive for warung, online-dependent |
| **Pawoon** | 149k–299k | Multi-payment, table/queue mgmt, online+offline | F&B feature bloat, per-outlet fee scales painfully |
| **Olsera** | ~165k/mo (1.99M/yr Premium) | Omnichannel (online store + offline POS) | Overkill UI; annual lock-in |
| **Majoo** | 129k–275k | "All-in-one" with addons | Marketed broadly, not warung-native |
| **MASPOINT** | 200k/device | Barcode scan, real-time inventory | Per-device pricing kills multi-cashier |

### Lower tier / UMKM-native

| App | Price | Strength | Weakness |
|---|---|---|---|
| **Kasir Pintar** | Free / 55.5k Pro | Free tier viable; 10k SKU on Pro | Reports capped on free, watermark on receipts |
| **iReap POS** | Free Lite / paid Pro | True offline, simple UI, multi-warehouse on Pro | Multi-device sync only on Pro, Google Drive backup flaky |
| **Qasir** | Free / Pro upsell | Unlimited products free, **utang/piutang built-in**, offline, multi-outlet | Ads in free, dated UI, weak deep reports |
| **BukuWarung** | Free + fees | Utang reminder via WhatsApp/SMS, huge installed base | **Not a real POS** — no barcode, no stock, no receipt |
| **ReBill POS** | Subscription | QRIS-first, clean reports | Cloud-only, weak rural offline story |

### Identified gaps (what nobody nails simultaneously)

1. **Offline-first that actually works across devices** — iReap/Qasir are offline-capable on single device but **multi-cashier sync** typically requires cloud + Pro tier.
2. **Real POS + utang management in one app** — Qasir has both but UI is dated; BukuWarung has utang but isn't a real POS. Most others ignore utang entirely.
3. **Flat pricing for multi-outlet** — Pawoon/Moka charge per outlet, painful for a 3-warung owner.
4. **Cashier-grade simplicity without admin clutter** — most apps make cashiers navigate the same UI as the owner.
5. **Receipt without thermal printer infra** — most assume Bluetooth printer; warung kasir often has only a phone.
6. **Supplier/restock workflow tuned to kelontong** — purchase orders from sales agents (sales kanvas), expiry tracking on sembako (snacks/dairy), price-change ledger.
7. **PPN inclusive/UMKM-PPh final tax helper** — most ignore the 0.5% PPh final and PPN reporting that's about to bite informal shops.
8. **Owner-on-WhatsApp reporting** — daily close pushed to WA, not "open the dashboard".

---

## Recommended unique propositions for KasirKelontong

Ordered by differentiation × build-cost ratio.

### 1. **"Utang Pelanggan" first-class** (high impact, low cost)
Warung run on credit ("ngutang dulu"). Today's spec has no `Customer` or `Receivable` table.
- Add: `Customer` (per tenant, name + phone), `Receivable` (sale_id, amount_due, paid_at).
- Sale flow: tender mode = cash / utang / partial. Utang creates receivable, still emits stock movement.
- Repayment endpoint reduces receivable.
- WhatsApp reminder link (deep link to wa.me/<phone>?text=...) — no API integration needed in v1.
- **Wedge**: BukuWarung owns utang but isn't a POS; Qasir has it but ugly. We do both, clean.

### 2. **Flat-price multi-outlet** (pricing positioning)
Pawoon ~299k/outlet/mo. Owner with 3 warung pays ~900k.
- Pricing: flat tier by tenant (e.g. 99k/mo unlimited outlets up to 5, 199k unlimited).
- Already supported by data model (tenant → many stores).
- **Wedge**: marketing claim "1 langganan, semua warung Anda".

### 3. **Cashier mode = phone-only, zero-train** (UX wedge)
Cashier login is already store-code + PIN (good). Push further:
- PWA installable on cashier's own Android phone.
- Barcode via phone camera (`@zxing/browser`) — no scanner needed.
- Receipt: PDF + WhatsApp share link (`wa.me`) per customer — no thermal printer in v1.
- **Wedge**: "Tidak perlu beli mesin kasir. HP Android cashier sudah cukup."

### 4. **Offline-first PWA with deferred sync** (technical moat)
Current spec is online-only. Adding offline:
- Service worker + IndexedDB queue for sale POSTs.
- Stock check uses last-known cache; server resolves conflicts via the movement ledger (already append-only — perfect for this).
- Sync indicator + "X sales pending upload".
- **Wedge**: iReap is offline but single-device; Moka/Pawoon need internet. We give multi-cashier sync **and** offline survival.

### 5. **WhatsApp daily close report** (owner stickiness)
- Cron 21:00 WIB: render today's sales summary per store, send via Mayar/Fonnte/WA Business API to owner.
- Includes: gross, # transactions, top SKUs, low-stock alerts.
- **Wedge**: Indonesian SMB owners live in WhatsApp, not dashboards.

### 6. **Sales kanvas / supplier restock flow** (kelontong-specific)
Sales reps visit warung weekly. Today's "Receiving" is manual entry.
- Add `Supplier` + `PurchaseOrder` with photo of invoice (upload).
- "Receive against PO" reconciles received qty vs ordered.
- Optional: price-change detection — flag if cost went up vs last receiving (margin protection).
- **Wedge**: nobody does this; most warung tracks PO in WhatsApp screenshots.

### 7. **Expiry & shelf-life tracking for sembako** (niche moat)
- Optional `expiry_date` per receiving batch.
- Cashier UI surfaces FEFO (first-expire-first-out) suggestion on duplicate SKUs.
- Dashboard "expiring in 14 days" list.
- **Wedge**: differentiator vs every general POS.

### 8. **UMKM tax helper** (compliance wedge)
- PPh Final 0.5% of monthly omzet auto-calculated on reports.
- DJP-compatible CSV export (e-Bupot-friendly format).
- Toggle: PPN-inclusive pricing once turnover crosses 4.8B threshold.
- **Wedge**: no current kelontong-tier POS handles PPh Final cleanly.

### 9. **Open data export** (anti-lock-in marketing)
- One-click CSV/JSON dump of full tenant data (products, sales, movements, customers).
- Marketing: "Data Anda milik Anda. Bukan kami."
- **Wedge**: Olsera/Moka lock you in; this earns trust from small owners burned by SaaS shutdowns.

---

## Suggested wedge bundle (if picking 3)

1. **Utang pelanggan + WA reminder** → kills BukuWarung's reason-to-exist for users who also need a real POS.
2. **Flat-price multi-outlet + WA daily close** → pricing + reporting attack on Pawoon/Moka.
3. **Phone-as-kasir PWA (camera barcode + PDF/WA receipt)** → zero-hardware onboarding.

These three are buildable on the current data model with additive migrations only. None contradicts v1 architecture (tenant isolation, movement ledger, integer money all remain valid).

---

## Critical files to read before scoping any of these

- [FEATURES.md](FEATURES.md) — v1 scope & out-of-scope list
- [api/v1/sales_api.py](api/v1/sales_api.py) — checkout flow (utang & WA receipt hook in here)
- [sale/services.py](sale/services.py) — `create_sale` transaction (utang would change tender semantics)
- [stock/services.py](stock/services.py) — `record_movement` invariants (don't break)
- [api/v1/_tenant.py](api/v1/_tenant.py) — tenant scoping (all new tables go through here)
- [frontend/src/features/cashier-auth/api.ts](frontend/src/features/cashier-auth/api.ts) — cashier fetch wrapper (PWA + offline queue lives near this)

---

---

# Implementation Plan: Camera Barcode + Offline-First Sales

## Why now

Two features chosen from the proposition list:
- **Camera barcode**: kills the "must buy USB scanner" hardware barrier.
- **Offline-first sales**: kelontong WiFi/4G is flaky; today the cashier UI hard-fails on every network blip. Combined with the append-only `StockMovement` ledger, offline replay is architecturally clean.

## Architectural decisions

### 1. Idempotency key (blocking prerequisite for offline)
Today `create_sale` has no replay protection — a duplicate POST creates two sales + two stock decrements. Before offline replay can ship, the backend must dedupe.

- Add `client_request_id` (CharField, max_length=36, unique=True, null=True, db_index=True) to `Sale` model.
- Migration: nullable column + unique-when-not-null partial index (Postgres) / unique constraint with manual null handling (SQLite for dev).
- `sale.services.create_sale(... client_request_id=None)`: if provided and a Sale with same `client_request_id` + tenant exists, return existing Sale (200) instead of creating new — must check inside the `@transaction.atomic` block under `select_for_update` to avoid race.
- Client (`features/cashier-auth/api.ts` or sales feature) generates UUIDv4 once per checkout attempt; same id replayed by offline queue.

### 2. Camera barcode scanner
- Library: **`@zxing/browser`** (active fork, supports EAN-13, Code-128, QR — covers Indonesian retail SKUs).
- New component: `frontend/src/features/sales/components/barcode-scanner.tsx` — opens a `<video>` stream, decodes via `BrowserMultiFormatReader`, emits `onDetect(code)`.
- Integration in `pos-page.tsx`: toggle button next to the search input; on detect, reuse the existing barcode-match handler (`pos-page.tsx:55–64`).
- Permission UX: explicit "Izinkan kamera" prompt; fall back to manual input on denial.
- Mobile-first: prefer rear camera (`{ video: { facingMode: 'environment' } }`).

### 3. Offline queue & sync
- **Storage**: `idb` (Jake Archibald's wrapper, ~1KB gzipped). DB name `kasirkelontong-cashier`, store `pending_sales` (key = `client_request_id`, value = `{ payload, queuedAt, attempts, lastError }`).
- **Queue lifecycle**:
  1. Cashier confirms sale → generate `client_request_id` → write to IndexedDB queue first.
  2. Attempt POST. On success → delete queue entry, optimistic stock cache updated.
  3. On network error or 5xx → leave in queue, show pending badge.
  4. On 4xx (`OutOfStockError`, `InsufficientTenderError`) → mark queue entry as failed with the error message, surface in a "Penjualan tertunda" tray so cashier can resolve/discard.
- **Replay trigger**: on every `window.online` event + on app boot + every 30s `setInterval` while pending entries exist. Replay one-at-a-time in insertion order to preserve stock-movement ordering.
- **Stock cache**: cashier UI already loads stock via `cashierApi`. Add a TanStack Query cache persister (`@tanstack/query-sync-storage-persister` + `persistQueryClient`) targeting the stock query so the UI has a last-known stock list offline.
- **Conflict handling**: server is source of truth. If a queued sale fails with `OutOfStockError` on replay (stock was depleted via another cashier while offline), surface error in the tray; do NOT auto-resolve. Cashier picks: discard or partial-refund manual.

### 4. PWA shell
- Add `vite-plugin-pwa` with `registerType: 'autoUpdate'`.
- Precache: cashier route bundle, fonts, app shell HTML.
- Manifest: name "KasirKelontong Kasir", start_url `/cashier/pos`, display `standalone`, icons (need 192/512px — placeholder OK for v1).
- Service worker scope: `/cashier/*` only (don't break admin route hot-reload during dev).

## File changes

### Backend
- [sale/models.py](sale/models.py) — add `client_request_id` field + Meta.constraints unique partial index.
- [sale/services.py](sale/services.py) — `create_sale` accepts `client_request_id`; lookup-before-create under transaction.
- [api/v1/serializers.py](api/v1/serializers.py) `SaleCreateSerializer` (line 313) — accept optional `client_request_id` (uuid format).
- [api/v1/sales_api.py](api/v1/sales_api.py) — pass through to service.
- New migration via `make mmg`.
- New tests in [api/v1/tests/test_sales.py](api/v1/tests/test_sales.py):
  - `test_duplicate_client_request_id_returns_same_sale`
  - `test_duplicate_request_does_not_double_decrement_stock`

### Frontend
- [frontend/package.json](frontend/package.json) — add deps: `@zxing/browser`, `idb`, `vite-plugin-pwa`, `@tanstack/query-sync-storage-persister`, `@tanstack/react-query-persist-client`. `uuid` if not already present.
- [frontend/vite.config.ts](frontend/vite.config.ts) — register `VitePWA` plugin.
- New: `frontend/src/features/sales/components/barcode-scanner.tsx` — camera component.
- New: `frontend/src/features/sales/offline-queue.ts` — IndexedDB queue (open/get/put/delete + replay loop).
- New: `frontend/src/features/sales/use-sync-pending.ts` — hook wiring `online` event + interval + queue API.
- New: `frontend/src/features/sales/components/pending-tray.tsx` — pending/failed sales drawer.
- Modified: [frontend/src/features/sales/components/pos-page.tsx](frontend/src/features/sales/components/pos-page.tsx) — scanner toggle button, "queued" feedback on submit, pending-tray mount, generate `client_request_id` per checkout.
- Modified: [frontend/src/features/sales/api.ts](frontend/src/features/sales/api.ts:17) — `createSale` writes to queue first, then attempts network.
- Modified: [frontend/src/app/query-client.ts](frontend/src/app/query-client.ts) — wrap with `persistQueryClient` for cashier-scoped queries.
- New: `frontend/public/manifest.webmanifest` + `pwa-192x192.png`, `pwa-512x512.png` (placeholder icons OK).

## Build order (sequential — each phase verifiable)

1. **Backend idempotency** — add field, service dedupe, tests pass. No frontend change yet.
2. **Camera scanner only** — `@zxing/browser` component + toggle in pos-page. Manually verify on a phone via the dev server (`make web` + LAN IP).
3. **Offline queue (no PWA shell)** — write-to-IDB-first flow, online-event replay, pending tray. Verify by toggling DevTools "Offline" mid-checkout.
4. **PWA shell** — `vite-plugin-pwa` + manifest + precache. Verify install prompt on mobile Chrome.

## Verification

- Backend: `uv run manage.py test api.v1.tests.test_sales` — new idempotency tests pass; existing sale tests still pass.
- `make lint` clean.
- Frontend manual:
  1. `make dev` + `make web`. Open POS on phone via LAN.
  2. Tap "Pindai", grant camera, point at a barcode (e.g. mineral water bottle) → product added.
  3. DevTools → Network → Offline. Complete a sale. UI shows "Tersimpan offline". Refresh page — queue persists.
  4. DevTools → Network → Online. Within 30s the queued sale uploads; check `/api/v1/sales/` shows it; stock decremented exactly once.
  5. Force replay with same `client_request_id` (re-trigger) → server returns existing sale, no double decrement.
  6. Lighthouse audit on `/cashier/pos` → PWA category passes "Installable".

## Out of scope for this slice

- Service worker push notifications.
- Background sync API (Periodic Sync) — fall back to `setInterval` while app is open is fine for v1.
- Conflict resolution UI beyond "discard or keep" on failed queued sales.
- Offline support for admin routes (`/admin/*` requires online).

---

## Sources

- [10 Aplikasi POS Terbaik Indonesia 2026 — MAS Software](https://www.mas-software.com/blog/aplikasi-pos-terbaik)
- [15 Aplikasi Kasir Terbaik 2026 — Mekari Desty](https://desty.mekari.com/blog/aplikasi-kasir-terbaik)
- [13 Aplikasi Kasir Terbaik 2026 — Inticore](https://inticore.co.id/aplikasi-kasir-terbaik-gratis-berbayar/)
- [15 Aplikasi Kasir Indonesia Terbaik 2026 — ReBill POS](https://rebill-pos.com/blog/aplikasi-kasir-indonesia-terbaik-2026)
- [Moka POS vs Olsera comparison](https://www.mokapos.com/blog/moka-pos-vs-olsera)
- [Moka POS vs Kasir Pintar comparison](https://www.mokapos.com/blog/moka-pos-vs-kasir-pintar-perbandingan-software-fitur-dan-harga)
- [10 Rekomendasi Aplikasi Kasir Toko Sembako — Mekari](https://mekari.com/blog/aplikasi-kasir-warung-sembako-kelontong/)
- [12 Aplikasi Kasir Toko Sembako — Otto Digital](https://ottodigital.id/artikel/aplikasi-kasir-toko-sembako/)
- [iReap POS Convenience Store article](https://www.ireappos.com/news/en/pos-application-for-grocery-and-convenience-stores-ireap-pos/)
