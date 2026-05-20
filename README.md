# KasirKelontong

Cash-first point-of-sale for Indonesian small shops (warung kelontong). Multi-store, two roles (Admin / Cashier), built for offline-tolerant tablet use.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

## Stack

- **Backend:** Django 5 + Django REST Framework, PostgreSQL (prod) / SQLite (dev)
- **Frontend:** React 19 + Vite + TanStack Router/Query, Tailwind v4, shadcn/radix
- **Mobile:** Flutter (Android tablet, Riverpod + go_router)
- **Tooling:** `uv` for Python, `pnpm` for JS

## Roles

- **Admin** — email + password, owns one tenant + multiple stores. Manages products, stock, cashiers, reports.
- **Cashier** — store code + 4-digit PIN, scoped to a single store. Rings up sales, handles cash.

## Quickstart

Requires `uv`, `pnpm`, and (optional) `make`.

```bash
# 1. Install backend deps
uv sync

# 2. Set up local env (DEBUG=True is required for dev; backend refuses to boot otherwise)
cp .env.example .env

# 3. Apply migrations (SQLite by default — set POSTGRES_HOST for Postgres)
make migrate

# 4. Seed demo data
uv run manage.py create_demo

# 5. Run backend + frontend in two terminals
make dev     # backend on :8000
make web     # frontend on :5173 (proxies /api → :8000)
```

### Demo credentials (development only — never run `create_demo` in production)

- Admin: `demo` / `demo1234` → http://localhost:5173/login
- Cashier: store code `DEMO`, PIN `1234` → http://localhost:5173/cashier

## Configuration

Copy [.env.example](.env.example) to `.env` and fill in values. Required for production: `SECRET_KEY`, `DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, Postgres credentials. The backend refuses to boot in production if `SECRET_KEY` is missing or insecure.

## Docker

```bash
make dock   # uses .env.docker
```

Stack: `caddy` reverse proxy → `backend` (gunicorn) + `frontend` (static) + `postgres`.

## Documentation

- [CLAUDE.md](CLAUDE.md) — architecture, tenant isolation model, stock/sale invariants, auth flow. Read this before contributing.
- [mobile/README.md](mobile/README.md) — Flutter setup.
- [SECURITY.md](SECURITY.md) — vulnerability reporting.

## License

[AGPL-3.0](LICENSE). If you run a modified version as a network service, you must publish your source under the same license. If that doesn't fit your use case, contact the author for a commercial license.

Copyright (C) 2026 Jordan Maulana.
