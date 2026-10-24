# Security Status

**Reviewed:** October 24, 2026

FinSight has baseline application protections, but it is **not ready for real financial records on a public deployment**. This source review and automated test run are not an independent penetration test or a third-party dependency vulnerability scan.

See [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) for current findings and deployment gates.

## Implemented

- Passwords are hashed with PBKDF2-HMAC-SHA256 using 310,000 iterations and a per-password salt.
- Session tokens are random, stored as SHA-256 hashes, expire, and are invalidated on logout.
- Private ledger queries enforce authenticated user ownership.
- Request schemas validate monetary precision, positive amounts, currency, type, dates, and input lengths.
- Request bodies are limited to 1 MiB, including streamed bodies without a `Content-Length` header.
- Security headers are applied to responses; API responses use `Cache-Control: no-store`.
- Session cookies are HTTP-only, Secure, and SameSite=Lax. Login returns user details only; it does not return the session token in JSON.
- Signup enforces a 12-character minimum and checks Have I Been Pwned using its k-anonymity range API.
- Login and signup are limited to five attempts per rolling 15 minutes per IP and normalized email.
- User-supplied values are escaped by the dashboard before insertion into HTML. API JSON returns raw strings by design.
- Ledger mutations include audit-log entries.

## Known Limitations

- Authentication rate limiting is in-process and is not distributed across workers or instances; configure a shared limiter before scaling.
- HTTPS, secret management, tested backups, monitoring, audit-log retention, and database migrations remain deployment requirements.
- This repository does not use Supabase or Clerk and has no role model or Supabase RLS. Email verification and password reset use the app's own single-use tokens. Configure `APP_BASE_URL` and SMTP settings before production signup; local development without SMTP returns manual links. MFA is not implemented.
- HIBP lookup fails open when the HIBP service is unreachable; the 12-character minimum still applies.
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

The previous suite result was 43 tests on October 7, 2026. The current environment did not have pytest installed, so the updated code could not be regression-tested here.
