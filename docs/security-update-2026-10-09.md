# Security update — 9 October 2026

This update patches Next.js and Sharp and overrides Firebase's transitive gRPC
dependency with a patched release. `npm audit --omit=dev` reports zero known
vulnerabilities. Development dependencies still have audit findings; do not use
`npm audit fix --force` because it proposes a breaking Tailwind migration.

Client portal links now expire after 30 days. The database migration grants
existing links 30 days from migration time. Reading the portal and both decision
endpoints reject expired links. Editors can use **Replace link** in the client
project page to invalidate the old URL and issue a fresh 30-day URL. Share the
replacement with the client after rotation.

Documents use a fresh Content Security Policy nonce. Injected inline scripts and
event handlers are blocked; framework scripts receive the server-generated nonce.
HTML responses are private and not cached. This increases server rendering work;
API data caching and static framework assets remain available. Any CDN or reverse
proxy must honor `Cache-Control: private, no-store` for HTML. See the
[Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

## Deployment

The changes are local until deployed. Back up the production database using the
existing backup process before migration. From the project root, with the normal
production environment configured:

```sh
npm ci --prefix frontend
cd django_backend
DJANGO_SETTINGS_MODULE=config.settings.production .venv/bin/python manage.py migrate --noinput
cd ..
npm run build --prefix frontend
pm2 restart ecosystem.config.js
```

Deploy the backend and frontend together. Keep a database snapshot and the previous
release for rollback. Verify the home page, login, client portal and link replacement
after deployment. Two-factor authentication remains optional; enable it for admin
accounts through their existing security settings.

## Verification

- Backend suite: 101 tests, four skipped; passed.
- Frontend regression suite: 13 tests; passed.
- ESLint, TypeScript checks, production build and migration consistency: passed.
- Local production HTTP checks on six routes: every rendered script matched the
  response nonce and HTML was marked no-store.
- No browser was available for an interactive CSP smoke test. The live server's
  configuration, logs and deployed dependencies were not inspected.
