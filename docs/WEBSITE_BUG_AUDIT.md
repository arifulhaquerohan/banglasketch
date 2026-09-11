# Website bug audit — 11 September 2026

Scope: local source review, Next.js production build, TypeScript/lint checks, Django API tests, and HTTP smoke checks. Existing workspace edits were preserved. This is not a production deployment or a complete browser/accessibility audit.

## Confirmed bugs fixed

| Priority | Problem | Change |
| --- | --- | --- |
| High | Production settings could inherit hard-coded development Django/JWT/TOTP secrets when `NODE_ENV` was absent, even with `DJANGO_SETTINGS_MODULE=config.settings.production`. | Production now explicitly requires all three secrets and uses only the JSON API renderer. |
| High | Portal decisions could modify proposals/change orders belonging to soft-deleted projects. Draft proposals could also be approved. | Exclude deleted projects and require the correct pending status. |
| High | Portal approvals accepted nonexistent proposal versions; malformed versions could return HTTP 500. | Validate version type, range, and membership before saving. |
| High | Portal approvals did not select a version when omitted or update the project budget, unlike admin approvals. | Resolve the latest version when omitted, update baseline budget/stage, and supersede earlier approved proposals atomically. |
| Medium | A later portal request could overwrite a completed approval/rejection. | Lock records during decisions and return HTTP 409 for finalized decisions. |
| Medium | Split Django settings resolved `BASE_DIR` to `django_backend/config`, putting static/media and fallback database paths in the wrong directory. | Resolve the backend root correctly. |
| Medium | API 404 responses for slugs matching demo content resurrected sample projects/blog posts. | Respect authoritative 404 responses. |
| Medium | `npm run install:all` and root setup instructions referenced the removed Express backend. | Point installation/setup to Django and the existing frontend. |

## Remaining findings

1. **Production sample-content fallback:** `frontend/lib/api.ts` still substitutes sample collections and detail records on network errors and non-404 failures. An initial build with the API stopped succeeded and generated demo project/blog routes. This can publish misleading content and sitemap entries during an outage. The outage policy needs a coordinated change across build-time generation, cached content, and error states; only authoritative 404 handling was changed here.
2. **Malformed saved collection can crash rendering:** `frontend/components/SpaceCollectionContext.tsx` assigns parsed localStorage directly to array state. Valid JSON such as `null` or `{}` passes the try/catch but later breaks `.length` or `.some`. Validate the stored array and its items before accepting it. Confirmed by source inspection; not exercised in a browser.
3. **Admin approval validation remains inconsistent:** `AdminProposalApproveView` still calls `int(req_version)` without input validation and looks up proposals without excluding deleted projects. The public portal fixes do not change that separate authenticated admin endpoint.

## Verification

- Initial backend suite: 35 passed, 2 skipped.
- Five new portal regression tests failed against the original implementation, reproducing the bugs; after fixes, the full suite ran 42 tests: 40 passed, 2 skipped.
- Two additional settings tests passed, covering the base directory and missing production secrets.
- The skipped contract tests require PostgreSQL/pg_trgm; they were not verified in this run.
- Frontend production build passed after changes, including TypeScript and lint checks. Two pre-existing unused-variable warnings remain in the portal page, alongside a multiple-lockfile warning.
- Targeted frontend fetch checks confirmed API 404 responses cannot resurrect sample projects or posts.
- HTTP checks passed for `/`, `/about`, `/services`, `/services/kitchen`, `/portfolio`, `/blog`, `/contact`, `/cost-estimator`, `/design-brief`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`, and `/api/maintenance`. Admin requests redirected to login; nonexistent project and portal URLs returned 404.
- No live submissions, external email delivery, real Cloudinary upload, visual/mobile browser interaction, or deployment was performed. HTTP checks used the initial production build; the final source was separately rebuilt successfully.
