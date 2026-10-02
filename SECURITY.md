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

## Remaining risks and deployment gates

- The browser stores the bearer token in `sessionStorage`; cross-site scripting could expose it. The page also loads scripts/fonts from third-party CDNs. Pin/self-host those assets, deploy a restrictive Content Security Policy, and move to a reviewed secure-cookie/session design before production.
- Login and registration do not yet have rate limiting, account recovery, email verification, or multi-factor authentication.
- HTTPS, production security headers, CSRF strategy, secret management, backups, and restore verification must be provided by deployment infrastructure.
- The application currently creates tables with SQLAlchemy metadata on startup; reviewed Alembic migrations are required before production schema changes.
- Not all financial modules are implemented. The current database/API covers users, sessions, accounts, categories, transactions, and audit events only.
- No bank connection or external real-time feed is configured. “Live” refers to API-backed manual ledger data with a 10-second refresh interval.

Use the default SQLite database only on a trusted local machine. The compose password is a development default and must be overridden outside local development.