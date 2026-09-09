-- Migration 003: Client Handling, Pipeline, Versioned Proposals & Approvals

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  alternate_phone VARCHAR(50),
  address TEXT,
  portal_token VARCHAR(64) UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token) WHERE deleted_at IS NULL;

-- 2. Enquiries (Short Intake Form + Pipeline Stages)
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  project_location VARCHAR(255) NOT NULL,
  property_type VARCHAR(50) NOT NULL, -- apartment, house, office, commercial_space, other
  service_scope VARCHAR(50) NOT NULL, -- interior_design, renovation, both
  approx_budget VARCHAR(100),
  preferred_start_date VARCHAR(100),
  notes TEXT,
  attachments JSONB NOT NULL DEFAULT '[]', -- photos, floor plans
  status VARCHAR(50) NOT NULL DEFAULT 'new_enquiry',
  -- Stages: new_enquiry, contacted, consultation, site_visit, proposal_sent, approved, active_project, handover, on_hold, closed
  status_reason TEXT,
  assigned_to BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  next_action TEXT,
  next_follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_follow_up ON enquiries(next_follow_up_date) WHERE status NOT IN ('closed', 'handover') AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned ON enquiries(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_client ON enquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);

-- 3. Communication & Follow-up History
CREATE TABLE IF NOT EXISTS enquiry_follow_ups (
  id BIGSERIAL PRIMARY KEY,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  actor_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'call', -- call, whatsapp, meeting, site_visit, email, note
  summary TEXT NOT NULL,
  next_action TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_enquiry ON enquiry_follow_ups(enquiry_id, created_at DESC);

-- 4. Active Client Projects
CREATE TABLE IF NOT EXISTS client_projects (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  enquiry_id INTEGER REFERENCES enquiries(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(50) NOT NULL DEFAULT 'consultation',
  current_milestone TEXT,
  next_milestone TEXT,
  project_manager_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  agreed_scope TEXT,
  agreed_budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
  target_completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_client_projects_client ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_pm ON client_projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_stage ON client_projects(stage) WHERE deleted_at IS NULL;

-- 5. Proposals & Versioned Revisions
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, approved, rejected, superseded
  approved_version INTEGER,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals(project_id);

CREATE TABLE IF NOT EXISTS proposal_versions (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  scope_summary TEXT NOT NULL,
  proposed_cost NUMERIC(14, 2) NOT NULL,
  timeline_days INTEGER,
  documents JSONB NOT NULL DEFAULT '[]', -- drawings, specifications
  actor_id BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, version)
);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_lookup ON proposal_versions(proposal_id, version DESC);

-- 6. Scope Changes & Approvals (Change Orders)
-- Segregated ledger: avoids mixing proposed costs with approved costs
CREATE TABLE IF NOT EXISTS change_orders (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  proposed_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  timeline_impact_days INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected
  client_notes TEXT,
  decided_at TIMESTAMPTZ,
  requested_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_orders_project ON change_orders(project_id, status);
