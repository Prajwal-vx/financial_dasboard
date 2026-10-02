# Security status

FinSight now has an API and relational database, but this Phase 1 implementation is for local development and evaluation. Do not expose it to the public internet or use it for real financial records yet.

## Implemented

- Per-user ownership checks on account, category, session, summary, and transaction access.
- Passwords are salted and hashed with PBKDF2-HMAC-SHA256; raw passwords are not stored.
- Random bearer tokens are stored as SHA-256 hashes in the database and expire after the configured session lifetime.
- Monetary values use SQL `NUMERIC(18, 2)` columns and request validation rejects more than two decimal places.
- SQLAlchemy parameterizes queries; foreign keys, uniqueness rules, and check constraints enforce core relationships.
- Transaction deletion is soft deletion and creates an audit record in the same database operation.
- Transfers use one source/destination record and are excluded from income and expense summaries.
- The UI no longer requests or stores the former fake demo credentials/session keys.
- Login and registration are throttled per client address in-process; API responses are non-cacheable and include CSP and standard browser security headers.
- The production container runs as a non-root user, and Compose requires an explicitly configured PostgreSQL password.

## Remaining risks and deployment gates

- The in-process authentication throttle is not shared across workers or replicas. Configure distributed rate limiting at a trusted reverse proxy or gateway before public deployment.
- Bearer tokens remain in `sessionStorage`, and JavaScript libraries are loaded from pinned CDNs. A same-origin secure-cookie migration and self-hosted, integrity-verified frontend dependencies remain advisable before handling real financial records.
- Account recovery, email verification, and multi-factor authentication are not implemented.
- HTTPS/TLS, secret management, backups, and restore verification must be provided by deployment infrastructure. HSTS is emitted only when `APP_ENV=production`.
- The application currently creates tables with SQLAlchemy metadata on startup; reviewed Alembic migrations are required before production schema changes.
- Not all financial modules are implemented. The current database/API covers users, sessions, accounts, categories, transactions, and audit events only.
- No bank connection or external real-time feed is configured. “Live” refers to API-backed manual ledger data with a 10-second refresh interval.

Use the default SQLite database only on a trusted local machine. The Compose database password must be explicitly set and must not be committed to source control.
