# Project review — 2026-09-13

Existing uncommitted work was preserved. These fixes are local; the deployed website and existing cPanel ZIP archives have not been updated.

## Fixes

- `frontend/lib/json-ld.ts`, blog and portfolio detail pages: escape HTML delimiters in structured data. CMS text containing a closing script tag can no longer create executable markup through JSON-LD. Follows https://nextjs.org/docs/app/guides/json-ld.
- `django_backend/banglasketch_api/settings.py`: the legacy/cPanel settings now default to production when NODE_ENV is absent, reject missing production secrets before initializing integrations, use explicit localhost defaults instead of wildcard hosts/origins, and reject wildcard production configuration.
- `frontend/next.config.js`: add anti-framing, MIME-sniffing, referrer and restricted object/base security headers; disable the framework identification header. The CSP is deliberately limited and is not a complete script-source policy.
- `frontend/lib/api.ts`: malformed JSON arrays in imported gallery/tag fields no longer discard the real API collection and trigger sample-content fallback; non-string entries are filtered.
- Blog and portfolio detail pages: fetch at most four related-content candidates in one request, instead of loading every page of the relevant collection. This reduces API work as content grows; no live latency improvement is claimed.
- `frontend/package.json` and ESLint configuration: use the ESLint CLI and support the project's CommonJS server/config/test files.
- `README.md`: correct the frontend environment-example filename.

## Verification

- Frontend production build passed. Local backend connection warnings occurred because port 5000 was offline; static pages used the existing fallback data.
- Two frontend regression tests passed, covering malicious JSON-LD content, malformed legacy arrays, and bounded collection requests.
- Django: 63 tests discovered, 59 passed and four skipped, using an isolated SQLite test database. PostgreSQL-specific behavior was not verified.
- ESLint: zero errors, two existing unused-variable warnings in cPanel launcher files.
- npm audit: zero known vulnerabilities reported. This is not a Python dependency audit or a comprehensive penetration test.

## Deployment requirements

Set NODE_ENV=production, unique DJANGO_SECRET_KEY / ADMIN_JWT_SECRET / TOTP_ENCRYPTION_KEY values, explicit ALLOWED_HOSTS, and the exact HTTPS FRONTEND_URL before restarting cPanel. Missing production secrets now intentionally prevent startup. Preserve any existing valid TOTP encryption key; rotating it requires planning for enrolled accounts.

Rebuild deployment packages from the updated source. Check the real API, login, forms, media uploads and PostgreSQL against staging, then measure production performance. Deployment guidance: https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/.
