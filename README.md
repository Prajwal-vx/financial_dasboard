# FinSight

FinSight is a financial command-center foundation for personal and small-business ledgers. This iteration implements Phase 1: authenticated workspaces, relational accounts and categories, decimal-valued transactions, transfers, derived balances, and audit-preserving deletion. Dashboard data comes from the signed-in user's database records and refreshes every 10 seconds while the page is visible.

## Stack

- FastAPI REST API with SQLAlchemy 2
- SQLite by default for local development; PostgreSQL via `DATABASE_URL`
- Vanilla JavaScript dashboard served by the API
- Decimal database columns (`NUMERIC(18, 2)`) for money

## Run locally

```powershell
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The local database is created as `finsight.db`. Create an account in the sign-in screen; a zero-balance Cash account and starter categories are created for that user. API documentation is at `/docs`.

For PostgreSQL, set `DATABASE_URL` before starting the API, for example:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://finsight:your-local-password@localhost:5432/finsight"
python -m uvicorn backend.main:app --reload
```

`docker compose up --build` starts the API and a local PostgreSQL database. The compose password is for local development only; provide a strong secret before sharing or deploying the stack.

## Ledger behavior

- Account balances are recalculated from opening balances and posted ledger entries; they are not incremented as cached totals.
- Transfers are a single record with source and destination accounts. They reduce one account and increase the other without affecting income or expense summaries.
- Monetary request values use decimal strings and are limited to two decimal places.
- Deleting a transaction soft-deletes it and records an audit event; current balances and visible history recalculate from active records.
- All account and transaction queries are scoped to the authenticated user. The API returns 404 when a record belongs to another user.
- The frontend keeps the bearer session in `sessionStorage` and revalidates it with the API on page load.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST /api/accounts`
- `GET /api/categories`
- `GET|POST /api/transactions` with `limit`, `offset`, `start_date`, and `end_date` filters
- `DELETE /api/transactions/{id}`
- `GET /api/summary`
- `GET /api/health`

## Tests

```powershell
python -m pytest -q
```

The focused tests cover account isolation, transfer neutrality, posted-versus-pending summaries, and soft deletion with balance recalculation.

## Current scope and next phases

This is intentionally the first phase, not the full product brief. Budgets, goals, recurring bills, liabilities/assets, editable transaction history, CSV import, the Financial Health Radar, Digital Twin scenarios, and assistant/search features are not wired to persisted data yet. Market prices and external bank feeds are not connected; no randomized market ticks are shown as real updates. The dashboard's live sync means user-entered ledger changes are persisted and other open sessions refresh within about 10 seconds.

Before production use, add Alembic migrations, rate limiting, CSRF/XSS hardening and a CSP, secure deployment secrets, backup/restore procedures, and a reviewed identity/session design. Do not use real financial records on an internet-accessible deployment until those gates are complete.