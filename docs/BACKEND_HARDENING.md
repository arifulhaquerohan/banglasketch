# Backend security and scaling

## Deploying these changes

Use Node.js 22 or newer and install from the updated lockfiles with `npm ci` in both application directories. Deploy backend and frontend together: the old standalone frontend login has been removed, and old administrator sessions must sign in again. The old hosting ZIP has not been rebuilt.

Back up PostgreSQL before deployment. Startup creates additive tables (`admin_credentials`, `rate_limit_counters`, `contact_email_jobs`) and public-list indexes. Schema initialization uses a PostgreSQL advisory lock to serialize concurrent process starts. Startup fails if initialization fails. For a large existing database, schedule index creation during a maintenance window; the initial indexes are not created concurrently.

The first startup copies `ADMIN_PASSWORD_HASH` into the database only if the credentials row does not exist. Subsequent password changes update the database and increment the session version. Remove the bootstrap hash from the deployment environment after initialization; retain a secure database backup. Frontend `ADMIN_PASSWORD` and `ADMIN_SESSION_TOKEN` settings are no longer used and should be removed from every hosting dashboard and secret store. The local legacy frontend settings were removed during this change.

For an initial or emergency password change, run from `backend` in Bash:

```bash
read -rs -p 'New administrator password: ' new_admin_password
printf '%s' "$new_admin_password" | npm run set-password
unset new_admin_password
```

The command reads stdin, stores only a bcrypt hash, and revokes prior sessions. Passwords must be at least eight characters and at most 72 UTF-8 bytes. Set a strong `ADMIN_JWT_SECRET` shared by all backend instances. Password recovery requires working SMTP; codes are never logged as a fallback.

## Database TLS and capacity

Remote PostgreSQL now verifies its TLS certificate. If your provider uses a private CA, set `DB_SSL_CA_FILE` to that CA's PEM file. SSL parameters in `DATABASE_URL` cannot disable verification. Loopback PostgreSQL connections use the local trusted network without TLS. A failed remote connection should be corrected with the appropriate provider CA, not by disabling verification.

Defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_POOL_MAX` | 10 | Connections per backend process |
| `DB_CONNECTION_TIMEOUT_MS` | 5000 | Maximum connection acquisition wait |
| `DB_STATEMENT_TIMEOUT_MS` | 10000 | Database statement time limit |
| `DB_QUERY_TIMEOUT_MS` | 12000 | Client query time limit |
| `HOST` | 127.0.0.1 | Listening interface |
| `TRUST_PROXY` | loopback | Trusted proxy IPs/subnets, comma-separated |

Account for **instances × pool maximum**, other services, and administrative headroom before increasing instance count. Rate counters and email jobs also use this pool. With the included PM2 file, `BACKEND_INSTANCES=2 pm2 start ecosystem.config.js` starts two backend workers. Start with one and increase only after staging load tests. PostgreSQL counters are shared and atomic; an external rate-limit store may be appropriate if counter writes become a database bottleneck.

## Client IP forwarding

The included VPS configuration binds Node services to loopback and Nginx overwrites incoming `X-Real-IP` and `X-Forwarded-For`. PM2 enables `TRUST_INGRESS_IP=true` for the frontend. Next forwards only the overwritten `X-Real-IP`; Express trusts only configured proxy addresses. This gives separate contact/login counters to different visitors.

Do not expose Next directly while `TRUST_INGRESS_IP=true`. For a CDN, containers, Vercel, Render, Railway, or another topology, configure the actual ingress's verified client IP behavior and trusted subnets first. Leave forwarding disabled until the ingress overwrites that header. Container services may require `HOST=0.0.0.0` with network access restricted to their ingress. The VPS proxy settings are not a universal cloud-hosting configuration.

Use HTTPS at Nginx. JSON/form bodies are capped at 256 KiB; media should upload directly to Cloudinary. Increase this limit deliberately if existing rich blog documents exceed it. Avoid adding broad trusted proxy ranges merely to make rate limits stop firing.

## Lists and caching

Public and admin collection endpoints accept `page` (default 1) and `limit` (default 24, maximum 100) and return `pagination: { page, limit, hasMore }`. Sorting has a stable ID tiebreaker. Offset pagination can shift when content is inserted between requests.

Blog and portfolio pages navigate 24 records at a time. Portfolio searches and category filters run on the backend. Blog lists omit full article content; project lists omit galleries and private/internal fields. Detail routes still return full public content. Sitemap and existing administrator editing screens follow bounded API pages to preserve their complete collections; very large admin screens and sitemaps may need dedicated pagination later.

Public list responses allow a shared cache lifetime of 60 seconds. Existing Next fetch caching also uses 60 seconds. With an additional intermediary cache, stale content can last roughly two cache lifetimes. Admin routes are `no-store`. Sensitive submissions are never cached. The public backend does not maintain an unbounded in-memory URL cache.

Blog views accumulate in a bounded process-local buffer and flush every 30 seconds and on graceful shutdown. These count backend detail reads, not unique visitors; caches, crashes, database failures, and buffer overflow can reduce counts. Use dedicated analytics if precise visitor measurement is required.

## Email delivery

A contact submission and its two email jobs commit in one SQL statement. Workers claim jobs with `SKIP LOCKED`, lease them for two minutes, and retry failures with exponential backoff, up to eight attempts. Each process handles one job at a time; SMTP has finite timeouts. With SMTP disabled, inquiries and jobs remain saved for later delivery.

Delivery is **at least once**: if a process stops after SMTP accepts a message but before the database records success, a retry can send a duplicate. Monitor exhausted jobs:

```sql
SELECT id, submission_id, kind, attempts, available_at
FROM contact_email_jobs
WHERE delivered_at IS NULL AND attempts >= 8;
```

After correcting delivery configuration, retry a reviewed job with:

```sql
UPDATE contact_email_jobs SET attempts = 0, available_at = NOW()
WHERE id = <reviewed_job_id> AND delivered_at IS NULL;
```

Set a retention policy for completed jobs and contact submissions. Deleting a contact also removes its associated jobs. Public error responses hide infrastructure details.

## Verification

`npm test` in `backend` uses an **isolated local PostgreSQL database** at port 55439 by default. Set `TEST_DATABASE_URL` to another disposable local database if needed. It clears test tables, so never point it at application data. SMTP is disabled in the suite. Tests cover password persistence/session revocation, atomic shared rate counters, bounded pagination, durable email delivery/retries, concurrent OTP attempts and single consumption, and batched views.

Run `npx tsc --noEmit` and `npm run build` in `frontend`, plus `npm audit --omit=dev` in both directories. Before production scaling, load-test the actual hosting plan and observe p95 response latency, errors, CPU/RAM, database pool waiting, and queue backlog. Local tests do not establish production visitor capacity.

### Validation completed for this change

- 10 backend integration tests passed against a temporary local PostgreSQL cluster.
- 50 simultaneous public-list requests completed without HTTP/database errors in the local smoke test; this is not a production capacity estimate.
- Frontend TypeScript validation and the production build passed. Existing image-element lint warnings remain.
- Runtime checks passed for blog/portfolio pagination, HttpOnly/Secure login cookies, backend session verification, cross-origin mutation rejection, and proxy client isolation. Spoofed incoming `X-Forwarded-For` values did not bypass a counter keyed by trusted ingress `X-Real-IP`.
- Both production dependency audits reported zero vulnerabilities. Updated Nodemailer message construction and Sharp image processing were exercised locally.
- Test services were stopped. No production database migration, process restart, or deployment was performed. The remote provider's TLS certificate and real SMTP delivery still need deployment-environment verification.

## Platform features added

Run `npm run migrate` from `backend` before starting the new release. Migrations are ordered, transactional, serialized with a PostgreSQL advisory lock, and recorded in `schema_migrations`. Server startup also applies pending migrations. Back up the database first because schema rollback is intentionally manual.

The original administrator credential is migrated to an `owner` user using `ADMIN_RECOVERY_EMAIL`. Administrators can be created through `POST /api/admin/users` with `owner`, `admin`, `editor`, or `viewer` roles. Owner management is limited to owners, and the final active owner cannot be demoted or disabled. Login accepts `email`, `password`, and an optional six-digit `totp`; leaving email empty retains compatibility with the original account. Configure a unique `TOTP_ENCRYPTION_KEY` before enabling two-factor authentication. TOTP secrets are encrypted in PostgreSQL.

Every content create/update/delete is recorded in `audit_logs`, and content snapshots are stored in `content_versions`. `DELETE` performs a soft deletion. Restore an item through `POST /api/admin/restore/:entity/:id`, optionally passing `{ "version": 3 }`; permanent deletion is separately restricted to admins at `DELETE /api/admin/trash/:entity/:id`. Permanent deletion queues Cloudinary cleanup.

Public routes remain at `/api/*` and are also exposed as versioned `/api/v1/*` routes. Project and blog lists accept an opaque `cursor` and return `nextCursor`; existing page/offset clients still work. PostgreSQL trigram and full-text indexes back project and blog search. Request bodies are schema-validated, including slugs, URLs, categories, ratings, dates, and array limits.

The background worker publishes scheduled articles, requests a protected Next.js cache refresh, cleans Cloudinary assets after permanent deletion, and purges old operational records. Set matching `REVALIDATE_SECRET` values in both services and set backend `REVALIDATE_URL` to the frontend `/api/revalidate` endpoint. Jobs are persisted in `background_jobs` with retries. Monitor failed jobs and email jobs through PostgreSQL or metrics.

Monitoring endpoints are:

- `GET /health/live` for process liveness.
- `GET /health/ready` for PostgreSQL readiness.
- `GET /metrics` with `Authorization: Bearer $METRICS_TOKEN` for Prometheus-format process, request, database-pool, and queue metrics.

Logs are JSON and include the request ID, method, path, status, and duration. An incoming trusted `X-Request-ID` is returned to the caller; otherwise the backend creates one.

Create encrypted backups with `npm run backup`. `BACKUP_ENCRYPTION_KEY` must be a base64-encoded 32-byte key stored outside the server and `BACKUP_DIR` should point to protected storage. Verify every generated archive with `npm run verify-backup -- /path/archive.dump.enc`. This verifies authentication and PostgreSQL archive structure; periodically restore into an isolated PostgreSQL instance to test the full recovery procedure.

Signed Cloudinary uploads allow JPEG, PNG, WebP, and AVIF images up to 10 MiB and constrain dimensions to 4096×4096. Unsigned frontend upload fallback has been removed. Remove `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` from deployments.
