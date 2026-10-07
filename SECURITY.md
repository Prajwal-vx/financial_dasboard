# Security Status

**Reviewed:** October 7, 2026

FinSight has baseline application protections, but it is **not ready for real financial records on a public deployment**. This source review and automated test run are not an independent penetration test or a third-party dependency vulnerability scan.

See [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) for current findings and deployment gates.

## Implemented

- Passwords are hashed with PBKDF2-HMAC-SHA256 using 310,000 iterations and a per-password salt.
- Session tokens are random, stored as SHA-256 hashes, expire, and are invalidated on logout.
- Private ledger queries enforce authenticated user ownership.
- Request schemas validate monetary precision, positive amounts, currency, type, dates, and input lengths.
- Request bodies are limited to 1 MiB, including streamed bodies without a `Content-Length` header.
- Security headers are applied to responses; API responses use `Cache-Control: no-store`.
- Session cookies are HTTP-only and SameSite=Lax; production cookies use the Secure flag.
- User-supplied values are escaped by the dashboard before insertion into HTML. API JSON returns raw strings by design.
- Ledger mutations include audit-log entries.

## Known Limitations

- Authentication rate limiting is in-process and is not distributed across workers or instances.
- HTTPS, secret management, tested backups, monitoring, audit-log retention, and database migrations remain deployment requirements.
- There is no account recovery, email verification, or MFA.
- Goals are browser-local; budgets are not configurable or persisted.
- Historical balance and cash-flow charts do not yet derive complete history from ledger data.
- Market data depends on an external HTML source.
- SQLite is not encrypted by the application, and CDN scripts do not use Subresource Integrity.
- The browser refreshes all transaction pages periodically; very large ledgers should move to server-side filtering and pagination.

## Verification

Run the automated tests with:

```powershell
python -m pytest -q
```

The suite passed **43 tests** on October 7, 2026. Passing tests do not establish production readiness.
