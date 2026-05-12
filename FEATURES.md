# KasirKelontong — v1 Feature Draft

## Context

KasirKelontong is a multi-store Point-of-Sale webapp. One admin owns many stores, each store has cashier terminals, and cashiers ring up cash sales against a shared product catalog. This document locks down v1 scope, data model, and screens before any code is written.

**Stack**: Django + Django REST Framework (backend), React + Vite + TypeScript (frontend SPA), PostgreSQL.

---

## Roles & authentication

| Role | Login method | Scope |
|---|---|---|
| **Admin** | Email + password (Django auth) | Owns N stores; full CRUD on products, stores, cashiers, stock, reports |
| **Cashier** | **Store code + 4–6 digit PIN** | Checkout + view own store's products; nothing else |

- Admin self-registers (open signup → becomes owner of a new tenant).
- Each admin = one tenant. All stores/products/cashiers belong to that tenant. Hard isolation enforced at the queryset level.
- Cashier sessions are short (e.g. 8h) and scoped to a single store.

---

## v1 feature list

### F1 — Admin registration & login
- Public signup form: email, password, business name.
- On signup: create `User` (admin role) + `Tenant` row.
- Login returns JWT (or session cookie) for the React SPA.

### F2 — Store management
- Store owner CRUD on stores: name, address, **unique store code** (used by cashiers to log in — short, e.g. `JKT01`).
- Listed on store owner dashboard with quick links to stock & reports.

### F3 — Cashier accounts
- Store owner creates cashier under a specific store: display name + PIN (hashed).
- PIN must be unique within a store (so `store_code + pin` is globally unique enough to identify a cashier).
- Store owner can deactivate a cashier without deleting (preserve sales history FK).

### F4 — Product catalog (tenant-wide)
- Fields: `barcode` (unique per tenant), `name`, `sell_price`.
- Products are shared across all stores in the tenant; **stock is per-store** (see F5).
- CRUD UI with barcode scanner-friendly input (autofocus, Enter to submit).
- Bulk import deferred to v2.

### F5 — Stock per store (movement log)
- Two tables: `Product` (catalog) and `StockMovement` (ledger).
- `StockMovement`: `store`, `product`, `delta` (signed int), `reason` (`receiving` | `sale` | `adjustment` | `void`), `created_by`, `ref_id` (FK to Sale or Adjustment), `created_at`.
- Current stock = `SUM(delta) WHERE store=X AND product=Y`. Materialize via DB view or cached column updated in a transaction with each movement.
- Admin "Stock" page per store: table of all products with current quantity, last movement date.

### F6 — Stock receiving & adjustments (admin)
- **Receiving**: admin enters items + quantities received → creates positive `StockMovement` rows.
- **Adjustment**: admin sets a target quantity or enters a delta with a reason note → single signed `StockMovement` row.
- Both actions are admin-only; cashiers cannot adjust stock directly (sales auto-decrement via F7).

### F7 — Cashier checkout (sales transactions)
- Cashier UI: barcode input → adds line → repeat → totals → tender amount → change displayed → confirm.
- On confirm, in **one DB transaction**:
  1. Create `Sale` (store, cashier, total, tendered, change, created_at).
  2. Create `SaleLine` per item (product, qty, unit_price snapshot, line_total).
  3. Create negative `StockMovement` per line with `reason='sale'`, `ref_id=sale.id`.
- **Payment in v1**: cash only with change calculation. No tax, no discount, no split payment.
- Out-of-stock guard: block checkout if any line would push stock negative (configurable later).
- Void / refund: deferred to v2 (but schema supports it via `reason='void'`).

### F8 — Sales reports per store
- Admin selects store + date range → table of sales + summary (count, gross revenue).
- Per-product breakdown: top sellers in range.
- Export CSV.

### F9 — Receipt printing (thermal)
- **Decision deferred** — printer connection method TBD. Recommend starting with **HTML receipt + `window.print()`** (zero infra) and adding a print-method abstraction so we can swap in WebUSB ESC/POS or QZ Tray later without touching checkout logic.
- Receipt content: store name/address, sale id, datetime, lines (name × qty × price = total), grand total, cash tendered, change, footer note.

---

## Data model (sketch)

```
Tenant            (id, name, owner_user_id)
User              (id, email, password_hash, tenant_id, role[admin])
Store             (id, tenant_id, name, address, code UNIQUE within tenant)
Cashier           (id, store_id, display_name, pin_hash, active, last_login_at)
Product           (id, tenant_id, barcode UNIQUE within tenant, name, sell_price)
StockMovement     (id, store_id, product_id, delta, reason, ref_type, ref_id, created_by_user_id?, created_by_cashier_id?, created_at, note)
Sale              (id, store_id, cashier_id, subtotal, tendered, change, created_at)
SaleLine          (id, sale_id, product_id, qty, unit_price, line_total)
```

All tenant-scoped tables filter by `tenant_id` (directly or via `store.tenant_id`) in a base manager / DRF permission class — central enforcement, not per-view.

---

## API surface (DRF, sketch)

```
POST   /api/auth/register           → admin signup
POST   /api/auth/login              → admin login
POST   /api/auth/cashier-login      → { store_code, pin } → cashier token

GET    /api/stores                  CRUD stores
GET    /api/stores/:id/cashiers     CRUD cashiers
GET    /api/stores/:id/stock        list current stock
POST   /api/stores/:id/receiving    bulk receiving
POST   /api/stores/:id/adjustments  single adjustment

GET    /api/products                CRUD products (tenant-wide)

POST   /api/sales                   cashier creates sale (atomic)
GET    /api/sales                   admin list/filter
GET    /api/reports/sales?store=&from=&to=
```

---

## Pages (React + Vite frontend)

### Public

| Path | Page | Purpose |
|---|---|---|
| `/` | Landing | Login chooser (admin vs cashier), brief product blurb |
| `/register` | Admin signup | Email + password + business name |
| `/login` | Admin login | Email + password |
| `/cashier` | Cashier login | Store code + PIN keypad |

### Admin (authenticated)

| Path | Page | Contents |
|---|---|---|
| `/admin` | Dashboard | Today's sales across stores, quick links |
| `/admin/stores` | Stores list | Table + "New store" button |
| `/admin/stores/:id` | Store detail | Tabs: **Cashiers**, **Stock**, **Receiving**, **Reports** |
| `/admin/products` | Product catalog | Table with search by barcode/name; create/edit modal |
| `/admin/reports` | Cross-store reports | Filter by store + date range; export CSV |

### Cashier (authenticated)

| Path | Page | Contents |
|---|---|---|
| `/pos` | Checkout | Barcode input (autofocus), cart, totals, tender + change, confirm + print |
| `/pos/sales` | Today's sales | Read-only list of this cashier's sales today |

---

## Open questions

1. **Printer integration** (F9): start with `window.print()` and revisit, or commit to WebUSB / QZ Tray now?
2. **Currency**: assume IDR (Rupiah, no decimals)?
3. **Negative stock**: hard-block sale, or allow with warning? (Recommend hard-block for v1.)
4. **Cashier PIN length**: 4 digits (fast) vs 6 (more secure)? (Recommend 6 with rate-limited login.)

---

## Pricing

See [PRICING.md](PRICING.md) for tiers, the 1–10 outlets lookup table, worked examples, add-ons, and open pricing questions.

---

## Out of scope (v2+)

- Tax (PPN) and discounts
- Card / QRIS / split payments
- Refunds & voids UI (schema-ready, no UI)
- Multi-tenant billing / plans
- Bulk product import (CSV)
- Inventory transfer between stores
- Customer / loyalty tracking
- Offline mode for cashier

---

## Verification (when implementation begins)

- Backend: `pytest` with factories — admin signup, store CRUD, cashier login by code+PIN, sale creates correct StockMovement rows, tenant isolation (User A cannot read User B's data).
- Frontend: Playwright e2e — admin creates store → creates product → receives stock → cashier logs in → rings up sale → stock decrements → report shows the sale.
- Manual smoke: print a test receipt from the cashier checkout (whichever method is chosen for F9).
