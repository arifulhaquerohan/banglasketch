CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','admin','editor','viewer')),
  active BOOLEAN NOT NULL DEFAULT true, token_version INTEGER NOT NULL DEFAULT 1,
  totp_secret TEXT, totp_enabled BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY, actor_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, entity_type TEXT, entity_id TEXT, before_data JSONB, after_data JSONB,
  ip_address TEXT, request_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS content_versions (
  id BIGSERIAL PRIMARY KEY, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
  version INTEGER NOT NULL, snapshot JSONB NOT NULL, actor_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(entity_type, entity_id, version)
);
CREATE TABLE IF NOT EXISTS background_jobs (
  id BIGSERIAL PRIMARY KEY, kind TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 8,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), locked_at TIMESTAMPTZ, last_error TEXT,
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS login_history (
  id BIGSERIAL PRIMARY KEY, admin_user_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  email TEXT, success BOOLEAN NOT NULL, ip_address TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$ BEGIN ALTER TABLE testimonials ADD CONSTRAINT testimonials_rating_check CHECK (rating BETWEEN 1 AND 5); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE blog_posts ADD CONSTRAINT blog_reading_time_check CHECK (reading_time BETWEEN 1 AND 1440); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE projects ADD CONSTRAINT projects_title_check CHECK (length(btrim(title)) > 0); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS projects_public_order ON projects(date_completed DESC NULLS LAST, created_at DESC, id DESC) WHERE published AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS blog_public_order ON blog_posts(published_date DESC, id DESC) WHERE published AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS projects_search_trgm ON projects USING gin ((title || ' ' || COALESCE(description,'') || ' ' || category) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS blog_search_fts ON blog_posts USING gin (to_tsvector('english', title || ' ' || COALESCE(excerpt,'') || ' ' || COALESCE(content,'')));
CREATE INDEX IF NOT EXISTS audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS content_versions_lookup ON content_versions(entity_type, entity_id, version DESC);
CREATE INDEX IF NOT EXISTS background_jobs_pending ON background_jobs(available_at, id) WHERE status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS contact_jobs_pending ON contact_email_jobs(available_at, id) WHERE delivered_at IS NULL;
CREATE INDEX IF NOT EXISTS rate_limit_expiry ON rate_limit_counters(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_resets_lookup ON admin_password_resets(email, used, expires_at);

