# FinSight Security Review

**Updated:** October 7, 2026  
**Scope:** Source review of the application and its automated tests. This is not an independent penetration test or a third-party dependency vulnerability scan.

## Current Assessment

FinSight has useful baseline protections, but it is **not ready for real financial records on a public deployment**. The existing README deployment gates remain applicable.

The review corrected several concrete issues:

- The dashboard previously initialized user views with bundled sample balances, transactions, goals, and market quotes. It now clears those demo values before loading the signed-in user's data, and chart components show their empty states until real history exists.
- The request-size check previously trusted only `Content-Length`. The ASGI middleware now counts received body bytes and rejects oversized streamed requests too; a regression test covers a chunked request without that header.
- The sidebar Transfer and Export CSV actions were not wired. Both now invoke their intended actions.
- The client previously fetched only the first 500 transactions. It now follows the API's offset pagination so older entries are included in filtering and CSV export.
- The security test module had a broken manual runner and several print-only checks. The duplicate runner was removed, missing anonymous-access coverage was added, and the affected tests now assert outcomes.

## Implemented Protections

- Passwords use PBKDF2-HMAC-SHA256 with 310,000 iterations and a per-password salt.
- Session tokens are randomly generated, stored as SHA-256 hashes, expire, and are invalidated at logout.
- Private account, category, summary, and transaction queries are scoped to the authenticated user.
- Pydantic schemas validate transaction amounts, currencies, dates, enum values, and input lengths.
- SQLAlchemy queries use bound parameters; financial mutations and their audit records are committed together.
- Responses include CSP and common browser security headers; API responses are marked `no-store`.
- The browser session cookie is HTTP-only and SameSite=Lax, with Secure enabled when `APP_ENV=production`.
- User-supplied strings in the dashboard's HTML templates are escaped at the rendering boundary. API JSON intentionally returns raw data; it does not HTML-escape JSON strings.
- Request bodies are limited to 1 MiB, including chunked bodies.

## Remaining Risks and Scope

- Authentication rate limiting is process-local and keyed by client IP. It is not adequate as the only control for multiple workers, replicas, or an untrusted reverse-proxy setup.
- TLS termination, secret management, database backups and restore testing, monitoring, and operational audit-log retention must be configured outside this application.
- There are no Alembic migrations, account recovery, email verification, or MFA flows.
- Goals are stored in browser local storage; budgets are not persisted or configurable. Do not treat these as server-backed financial records.
- Historical balance and cash-flow charts do not yet derive complete history from persisted ledger data; they display an unavailable state rather than sample values.
- Live market data depends on an external HTML source and may stop working if that source changes.
- The client refreshes the full transaction list periodically. Very large ledgers may need server-side filtering and pagination rather than loading every page into the browser.
- SQLite is not encrypted by the application. Public deployments should use an appropriately secured database and transport layer.
- External frontend scripts are loaded from CDNs without Subresource Integrity.

## Verification

Run the regression suite with:

```powershell
python -m pytest -q
```

On October 7, 2026, the suite completed with **43 passed**. This verifies the automated cases only; it does not establish production readiness or substitute for deployment-specific security testing.

## Deployment Gate

Before storing real financial records on an internet-accessible deployment, configure HTTPS at a trusted ingress, distributed rate limiting, managed secrets, tested backups, monitoring and alerting, and schema migrations. Review the deployment architecture and threat model independently.
