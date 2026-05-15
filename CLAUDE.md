# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KasirKelontong — multi-store cash POS for Indonesian small shops. Django + DRF backend, React/Vite SPA frontend, PostgreSQL in prod / SQLite for local dev. Two roles: **Admin** (email+password, owns stores) and **Cashier** (store code + PIN). One admin = one `Tenant`; tenant isolation is enforced at the queryset layer via `api/v1/_tenant.py` (`require_tenant`, `require_store`).

See `FEATURES.md` for the v1 product spec (data model, API surface, page list, out-of-scope items).

## Commands

Python deps managed by **uv**, frontend by **pnpm**. Most workflows go through the `Makefile`.

| Task | Command |
|---|---|
| Install Python deps | `uv sync` |
| Upgrade Python deps | `make upgrade` |
| Lint + format Python | `make lint` (`uv run ruff format . && uv run ruff check . --fix`) |
| Lint frontend | `cd frontend && pnpm lint` |
| Run backend dev | `make dev` (`uv run manage.py runserver 8000`) |
| Run frontend dev | `make web` (proxies `/api` → `localhost:8000`) |
| Tailwind watch (Django templates) | `make tw-run` |
| Make migrations | `make mmg` |
| Apply migrations | `make migrate` |
| Run all backend tests | `uv run manage.py test` |
| Run one test module | `uv run manage.py test api.v1.tests.test_sales` |
| Run one test | `uv run manage.py test api.v1.tests.test_sales.SalesCreateTests.test_xxx` |
| Seed demo data | `uv run manage.py create_demo` (user `demo`/`demo123`, store `DEMO`, cashier PIN `1234`) |
| Docker stack | `make dock` (uses `.env.docker`) |

DB selection: `core/settings.py` uses SQLite when `POSTGRES_HOST` is empty, Postgres otherwise. Local dev defaults to SQLite (`db.sqlite3`).

## Architecture

### Backend layout

Django project root is `core/`. Each domain is its own app, kept thin:

- `tenant/`, `store/`, `cashier/`, `product/`, `stock/`, `sale/`, `profile/` — models only (+ `admin.py`).
- `core/` — settings, project URLs, server-rendered admin pages (`AdminLoginView`, `DashboardView`, etc.), and `BaseModel` (string ObjectId PKs, `created_on`/`updated_on`/`actor`).
- `api/v1/` — all SPA endpoints under `/api/v1/`. One `*_api.py` module per resource; URLs assembled in `api/v1/urls.py`. Cross-cutting helpers live in `_tenant.py`.
- Business logic that touches multiple models lives in `<app>/services.py` (`sale/services.py::create_sale`, `stock/services.py::record_movement`) — keep views thin and call services.

### Auth model — two parallel auth systems

1. **Admin** — DRF `TokenAuthentication` (header `Authorization: Token <key>`). Issued by `api/v1/auth_api.py` (`register`, `login`, `google`). Default permission class is `IsAuthenticated`.
2. **Cashier** — custom `CashierTokenAuthentication` in `api/v1/cashier_auth.py` (header `Authorization: CashierToken <key>`). Token issued by `CashierSession.issue()` (8h expiry, stored in DB). `request.user` is the `Cashier` instance, `request.auth` is the `CashierSession` (use `request.auth.store` to scope queries).

Endpoints opt into cashier auth by decorating with `@authentication_classes([CashierTokenAuthentication])` (e.g. `sales_api.py`, `stock_api.CashierStockView`). Admin endpoints don't list `authentication_classes` and pick up the DRF default (Token).

**Impersonation.** Admin can mint a real `CashierSession` for an owned cashier via `POST /api/v1/stores/<store_id>/cashiers/<cashier_id>/impersonate/`. The returned token works exactly like a normal cashier login but does **not** update `last_login_at` (so audit trails stay clean). Cross-tenant target → 404; inactive cashier → 400.

### Tenant isolation

Never trust client-supplied tenant scope. In any admin endpoint, derive the tenant via `require_tenant(request.user)` or `require_store(request.user, store_id)` from `api/v1/_tenant.py`. Both return `(obj, err_response)` — return `err` immediately if non-None. Cashier endpoints get the store from `request.auth.store`, not from URL kwargs.

### Stock & sales invariants

`StoreStock` is a cached materialized quantity; `StockMovement` is the append-only ledger. **Never** mutate either directly outside `stock.services.record_movement` — it does the `select_for_update` lock, applies the delta, updates the cache row, and blocks negative qty when `reason=SALE`. Reasons are enum `StockReason` (`receiving`, `sale`, `adjustment`, `void`).

`sale.services.create_sale` wraps the whole sale in `@transaction.atomic`: snapshots `unit_price` onto `SaleLine`, then emits negative `StockMovement` per line via `record_movement`. Raise/handle three errors from API layer: `SaleValidationError`, `OutOfStockError`, `InsufficientTenderError`.

**Bundles & weighted products.** `Product` may carry `bundle_qty/bundle_price/bundle_label` (e.g. "12-pack Rp 50.000"). Sale lines pass `is_bundle=True` to `create_sale` to use bundle pricing; stock delta then becomes `qty * bundle_qty` units. `Product.is_weighted=True` allows decimal `qty` but is mutually exclusive with bundles — `create_sale` rejects weighted+bundle. `SaleLine` snapshots both `is_bundle` and `bundle_qty` for receipt reprints.

### Money & quantities

Money fields are integers (IDR has no decimals): `subtotal`, `tendered`, `change`, `sell_price`, `line_total`, `bundle_price`. **Quantities are `Decimal(12,2)`** (`SaleLine.qty`, `StockMovement.delta`, `StoreStock.qty`) to support weighted products. Don't pass floats — convert to `Decimal` at the API boundary.

### Frontend (`frontend/`)

- Vite + React 19 + TypeScript, **pnpm** package manager, alias `@` → `frontend/src`.
- Routing: **TanStack Router** file-based — files in `src/routes/` are scanned by `@tanstack/router-plugin/vite` and generate `src/routeTree.gen.ts` (git-ignored, do not hand-edit). Dotted names like `dashboard.stores.$storeId.tsx` define nested routes.
- Data: **TanStack Query** (`src/app/query-client.ts`). State: **jotai** atoms (auth/cashier session in `features/*/state.ts`). Forms: **react-hook-form + zod**. UI primitives: **radix-ui + shadcn** in `src/components/ui/`.
- Feature-first layout under `src/features/<feature>/` (`api.ts`, `hooks.ts`, `types.ts`, `components/`). Don't add API calls outside that boundary.
- Shared fetch helper: `src/lib/api.ts` — reads `localStorage.token` and sets `Authorization: Token …`. **Cashier endpoints use a different token header** (`CashierToken`); the cashier feature wraps `fetch` separately rather than going through `api()`. Check `features/cashier-auth/api.ts` before adding cashier routes.
- Dev proxy: `/api` → `http://localhost:8000` (see `vite.config.ts`). `VITE_API_URL` overrides the base.

### Tests

Backend tests live in `api/v1/tests/` (Django `TestCase` + `APIClient`). Helpers are inlined per file (e.g. `_make_user`, `_cashier_client` in `test_sales.py`) — copy that pattern rather than creating a shared fixtures module. No pytest config; run via `manage.py test`. No frontend test runner is set up.

### Payments (Mayar)

`core/payments/mayar.py` + `api/v1/payments_api.py` expose a webhook (`/api/v1/payments/mayar/webhook/`) for the Indonesian Mayar gateway. Configured by `MAYAR_*` env vars. Not part of POS checkout (POS is cash-only in v1) — this is for SaaS subscription billing.

## Conventions

- Ruff config in `pyproject.toml`: line length 100, target py3.10, rules `E,F,I,B,UP`. Run `make lint` before committing.
- IDs are stringified BSON ObjectIds via `core.models.make_object_id` (not integers). URL kwargs are `<str:...>`.
- User-facing error strings in API responses are Indonesian (`"Stok tidak cukup"`, `"Email atau kata sandi salah"`). Keep that consistent.
- Timezone: `Asia/Jakarta` (overridable via `DJANGO_TIME_ZONE`). Use `timezone.localdate()` for "today" boundaries (see `sales_api.list_my_sales_today`).
