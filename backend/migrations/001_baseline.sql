CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT, category VARCHAR(50) NOT NULL, featured_image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]', before_image TEXT, after_image TEXT,
  client_name VARCHAR(255), client_testimonial TEXT, date_completed DATE,
  featured BOOLEAN NOT NULL DEFAULT false, published BOOLEAN NOT NULL DEFAULT true,
  cloudinary_ids JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT, content TEXT, featured_image TEXT, category VARCHAR(100),
  meta_description VARCHAR(500), tags JSONB NOT NULL DEFAULT '[]',
  author VARCHAR(255) DEFAULT 'Banglasketch Team', published_date TIMESTAMPTZ DEFAULT NOW(),
  scheduled_publish_date TIMESTAMPTZ, reading_time INTEGER DEFAULT 5,
  featured BOOLEAN NOT NULL DEFAULT false, published BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0, cloudinary_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, youtube_url TEXT NOT NULL,
  description TEXT, thumbnail TEXT, duration VARCHAR(20), featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY, client_name VARCHAR(255) NOT NULL, client_location VARCHAR(255),
  quote TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 5, client_image TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, cloudinary_id TEXT,
  featured BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL,
  phone VARCHAR(50), service_type VARCHAR(100), message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false, responded BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin_credentials (
  id INTEGER PRIMARY KEY CHECK (id = 1), password_hash TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL, otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false, ip_address VARCHAR(255) DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS contact_email_jobs (
  id BIGSERIAL PRIMARY KEY, submission_id INTEGER NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('notification', 'confirmation')), attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), delivered_at TIMESTAMPTZ,
  UNIQUE (submission_id, kind)
);
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);

