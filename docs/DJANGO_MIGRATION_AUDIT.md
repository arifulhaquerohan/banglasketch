# Django migration audit

Reviewed 2026-09-10. The existing `django_backend/` is a migration candidate, not yet a verified replacement for Express. No production routing or database changes were made during this audit.

## Projects milestone completed

The public projects implementation has been updated since the initial audit below. Four PostgreSQL contract tests plus the existing ten integration tests pass (14 total). The contract suite compares 68 requests with the actual Express router across both API prefixes; it also exercises the existing frontend `getProjects`, `getPublicPage` and `getProjectBySlug` functions against a Django test server, checks viewer read/write permissions, and reads a schema created from the original Express baseline SQL.

Completed fixes: exact category and pg_trgm search behavior, collection fields, detail JSON arrays and timestamps, hidden draft/deleted rows, public authentication behavior, pagination validation and cursor offset handling, collection cache headers, viewer read access, and the legacy integer project ID type. Both API processes must use the same process timezone to preserve node-postgres DATE serialization.

Validation used a disposable local PostgreSQL instance; no application database or production routing was changed. Browser rendering was not exercised. Full admin CRUD parity, remaining route families, authentication migration and production cutover remain open. The gap table below records the initial audit; its public-project and viewer-access findings are addressed by this milestone.

Reproduce with installed backend/frontend dependencies and a disposable PostgreSQL instance (the role must be able to create test databases and pg_trgm):

```bash
cd django_backend
DATABASE_URL=postgresql://USER@127.0.0.1:PORT/postgres .venv/bin/python manage.py test tests.test_projects_contract tests.test_api --noinput
```

The PostgreSQL contract tests are skipped on SQLite. The new ID migration has been exercised on a fresh test database, not applied to an existing application database. Validate migration adoption on a restored database copy before deployment.

## Initial validation

Django 5.2.17 system checks and the 10 tests in `tests.test_api` pass using an isolated in-memory SQLite database and an in-memory email backend. These results do not establish PostgreSQL schema compatibility, frontend compatibility, or complete Express behavior coverage.

## Confirmed compatibility gaps

| Area | Existing Express behavior | Django candidate / required work |
| --- | --- | --- |
| Project pagination | Limit 1–100; page 1–100000; invalid values return 400; cursor overrides offset; out-of-range pages return an empty collection | Current paginator allows 1000, uses DRF page-number behavior, and silently ignores malformed cursors. Add contract tests and match the existing behavior. |
| Project filtering | Exact category match; PostgreSQL trigram similarity search over title, description and category | Django uses case-insensitive category matching, treats `all` specially, and uses substring search. Preserve PostgreSQL search semantics. |
| Project response | Collection selects eight public fields and sets shared-cache headers; detail returns the database row | Django uses the same broad serializer for both and omits `deleted_at` from detail. Use explicit compatible collection/detail serialization and cache policy. |
| Project authorization | Authenticated viewers can list projects; editors can write | Django list/create view requires editor for both methods. Test each role and method. |
| Public enquiries | POST `/api/enquiries` captures enquiries | Missing from Django public URL registration. Implement and validate the existing input contract. |
| Client workflows | Dashboard, pipeline, enquiry conversion, proposals, proposal versions, approvals, change orders and decisions | Existing Django client URLs omit these Express workflow routes. Port transactions and validation, not only CRUD models. |
| Two-factor authentication | AES-256-GCM encrypted secrets using `TOTP_ENCRYPTION_KEY` | Django passes stored secrets directly to pyotp and saves raw secrets. Existing encrypted secrets cannot be used this way. Implement compatible encryption/decryption and test existing credentials. |
| Configuration | Express JWT verification requires configured secret | Django has hard-coded fallback signing secrets, defaults debug from NODE_ENV, auto-loads backend environment, and drops database URL connection options. Require explicit production configuration and preserve TLS settings. |

Evidence: `backend/routes/projects.js`, `backend/middleware/pagination.js`, `backend/routes/admin.js`, `backend/routes/adminClientHandling.js`, `backend/services/totpSecret.js`, and the corresponding Django views, settings, pagination and URL files.

## Remaining inventory and verification

- Content: projects, blog posts, videos, testimonials and site settings; include publication scheduling, view counts, soft deletion, restore, version history and Cloudinary cleanup.
- Leads: contact submissions, newsletter subscribers, enquiries and follow-ups; preserve durable notification jobs, retries and duplicate handling.
- Clients: clients, client projects, proposals, proposal versions and change orders; preserve portal access and workflow invariants.
- Identity: admin credentials, admin users, reset OTPs, token invalidation, roles, login history and encrypted two-factor secrets.
- Operations: audit logs, content versions, background jobs, contact email jobs, shared rate limits, metrics, health checks, backups and graceful worker shutdown.
- Compare every Django model and migration with all four SQL migrations on a disposable PostgreSQL database. Table names alone do not prove matching columns, types, defaults, constraints or indexes. Do not treat `migrate --fake-initial` as schema verification.

## Next implementation milestone

1. Add projects contract tests for both public route prefixes, filters, field sets, missing/draft/deleted projects, strict pagination and cursor behavior.
2. Correct the existing Django projects implementation against those tests.
3. Run PostgreSQL integration tests with `pg_trgm` and representative fixtures; compare JSON responses with Express.
4. Exercise existing Next.js project listing/detail pages against the candidate on a separate local port, while keeping other API traffic on Express.
5. Continue with content, leads/client workflows, identity and operational services only after this first milestone passes.

Before cutover, validate a restored production database copy, all admin roles, frontend flows, background jobs and deployment configuration. Prepare rollback routing and a database backup. The current Django README's production-readiness and 100% compatibility claims are not supported by this audit.

Reference: [Django legacy database integration](https://docs.djangoproject.com/en/5.2/howto/legacy-databases/), [Django REST Framework](https://www.django-rest-framework.org/).
