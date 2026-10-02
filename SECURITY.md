# Security and deployment status

## Current application model

This project is a static, browser-only demo. It has no backend, server-side identity provider, authorization layer, or database. Its former fake account flow has been removed: the demo no longer asks for passwords, creates local accounts, or treats browser state as authentication. On startup it also deletes the old `self_finance_users` and `self_finance_session` local-storage entries left by prior versions. The dashboard contains sample financial values in its source code, and any data entered into this page is controlled by the browser user.

Do not use real passwords, personal data, or real financial records with this version. The opening screen and persistent in-app notice label it as a demo. This app does not authenticate users or protect data from a person who can load the page; do not deploy it as a public financial service.

## Requirements before handling real data

Before handling real data, build a backend with server-enforced identity and resource authorization; use a reputable identity provider or an established password hashing implementation on the server. Store user data in a database with per-user access controls. Use HTTPS, secure session cookies, CSRF protections appropriate to the authentication model, rate limits, input validation, security headers, and a documented backup and recovery process. Remove demo financial records and review third-party scripts before public deployment. These changes require product and infrastructure decisions and cannot be safely implemented as a static-page patch.

## Fix in this revision

CSV exports now neutralize spreadsheet formula prefixes in text fields, in addition to quoting CSV delimiters. This prevents descriptions or other user-controlled text beginning with a spreadsheet formula marker from being evaluated when a CSV is opened in common spreadsheet tools.

The fake local account and sign-in flow was removed, eliminating password collection and storage that could be mistaken for real protection. A demo-only entry screen and persistent warning replace it; this intentionally does not claim to provide authentication.
