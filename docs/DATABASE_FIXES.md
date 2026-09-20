# Database fixes — September 15, 2026

Implemented database protections:

- A conditional unique constraint prevents multiple non-cancelled, non-deleted site visits for the same date and time. Booking creation and admin updates return HTTP 409 when a concurrent reservation wins.
- Email jobs require exactly one target, matching the job kind. Migration `leads.0006` checks existing rows first and stops with an explanation if conflicts need review; it does not delete or merge records.
- Contact and newsletter inputs are validated against database length limits and email formats. Schedule values must be real HH:MM times.
- Both Django settings entry points reject unsupported database URL schemes and decode escaped credentials correctly.
- Backup creation and verification require a configured secret. PostgreSQL backups now honor `DB_SSL_MODE` and `DB_SSL_CA_FILE`, with `require` as the default, and decode escaped passwords.

The local SQLite database was backed up to `django_backend/backups/pre_database_fixes_20260915.sqlite3` (owner-only permissions), then migrated through `leads.0006` and `chatbot.0001`. Integrity and foreign-key checks passed.

For a deployed database, back it up and run `python manage.py migrate` using its normal production environment. Include the new migration files in deployment. The production database and server permissions were not inspected or changed in this audit.

Older backups that used the former built-in key require that original key to be explicitly supplied when restoring. Existing backups encrypted with a configured secret remain compatible.

Validation includes SQLite and an isolated local PostgreSQL instance. The broad SQLite test run also exposed an unrelated existing chatbot assertion: `test_public_matches_ranked_and_private_data_excluded` expects four services while the current catalog contains five.

References: [Django database constraints](https://docs.djangoproject.com/en/5.2/ref/models/constraints/), [PostgreSQL TLS modes](https://www.postgresql.org/docs/18/libpq-ssl.html). `verify-full` additionally verifies the server identity and needs a trusted CA setup; `require` alone is not a claim of verified server identity.
