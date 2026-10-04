# FinSight

FinSight is a financial command-center foundation for personal and small-business ledgers. This iteration implements Phase 1: authenticated workspaces, relational accounts and categories, decimal-valued transactions, transfers, derived balances, and audit-preserving deletion. Dashboard data comes from the signed-in user's database records and refreshes every 10 seconds while the page is visible.

## Stack

- FastAPI REST API with SQLAlchemy 2
- SQLite by default for local development; PostgreSQL via `DATABASE_URL`
- Vanilla JavaScript dashboard served by the API
- Decimal database columns (`NUMERIC(18, 2)`) for money

## Run locally

```powershell
python -m pip install -r requirements-dev.txt
python -m uvicorn backend.main:app --reload
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The local database is created as `finsight.db`. Create an account in the sign-in screen; a zero-balance Cash account and starter categories are created for that user. API documentation is at `/docs`.

## Deploy to Vercel

Vercel can deploy this FastAPI application as a Python Function. The root `app.py` exposes the FastAPI app for Vercel's framework detection. Connect this repository to Vercel and deploy with the default build settings; no separate frontend project is needed because the API serves the dashboard files.

Before the first deployment:

1. Create a PostgreSQL database with a hosted provider such as [Neon](https://neon.com/pricing). Use its pooled connection string when available and ensure the URL scheme is `postgresql+psycopg://` (SQLAlchemy uses the `psycopg` driver included in `requirements.txt`).
2. In the Vercel project settings, add `DATABASE_URL` with that connection string and `APP_ENV` with value `production` for Production, Preview, and Development as appropriate. Keep the database URL secret; do not commit it.
3. Deploy and open the Vercel URL. Register a test account and confirm the dashboard can load and save data.

The bundled SQLite database is for local development only. Vercel Functions have a read-only deployment filesystem with temporary `/tmp` storage, so deployed records must use hosted PostgreSQL. Vercel's Python runtime is currently in beta; review its current plan and function limits before relying on the deployment. Free database plans also have usage and storage limits. Do not store real financial records until the production safeguards in this README are complete.

The API issues a same-origin, HTTP-only session cookie after login and reuses it automatically for subsequent requests. Registration does not create a session; sign in after creating an account. Browser storage is not used for the active session token.

For PostgreSQL, set `DATABASE_URL` before starting the API, for example:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://finsight:your-local-password@localhost:5432/finsight"
python -m uvicorn backend.main:app --reload
```

`docker compose up --build` starts the API and a local PostgreSQL database. Set an explicit password first; use a unique high-entropy value and keep it out of source control:

```powershell
$env:POSTGRES_PASSWORD = "replace-with-a-unique-local-password"
docker compose up --build
```

## Ledger behavior

- Account balances are recalculated from opening balances and posted ledger entries; they are not incremented as cached totals.
- Transfers are a single record with source and destination accounts. They reduce one account and increase the other without affecting income or expense summaries.
- Monetary request values use decimal strings and are limited to two decimal places.
- Deleting a transaction soft-deletes it and records an audit event; current balances and visible history recalculate from active records.
- All account and transaction queries are scoped to the authenticated user. The API returns 404 when a record belongs to another user.
- The frontend relies on a same-origin HTTP-only session cookie and revalidates it with the API on page load.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST /api/accounts`
- `GET /api/categories`
- `GET|POST /api/transactions` with `limit`, `offset`, `start_date`, and `end_date` filters
- `DELETE /api/transactions/{id}`
- `GET /api/summary`
- `GET /api/market` returns the 50 highest-volume NEPSE scrips from the [Sharesansar live-trading board](https://www.sharesansar.com/live-trading); the dashboard polls every 30 seconds while visible.
- `GET /api/health`

## Tests

```powershell
python -m pytest -q
```

The focused tests cover account isolation, transfer neutrality, posted-versus-pending summaries, and soft deletion with balance recalculation.

## Current scope and next phases

This is intentionally the first phase, not the full product brief. Budgets, goals, recurring bills, liabilities/assets, editable transaction history, CSV import, the Financial Health Radar, Digital Twin scenarios, and assistant/search features are not wired to persisted data yet. Market prices and external bank feeds are not connected; no randomized market ticks are shown as real updates. The dashboard's live sync means user-entered ledger changes are persisted and other open sessions refresh within about 10 seconds.

Before production use, add Alembic migrations, a distributed rate limiter at the trusted edge, secure deployment secrets, backup/restore procedures, and a reviewed identity/session design. Configure TLS at the trusted ingress and serve the frontend and API from the same origin. The built-in auth throttle is process-local and is not sufficient by itself for a multi-worker or multi-instance public deployment. Do not use real financial records on an internet-accessible deployment until those gates are complete.
