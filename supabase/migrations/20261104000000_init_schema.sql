-- ReleaseLens Schema Migration
-- ADR-020, ADR-021, ADR-022, ADR-023 Compliant
-- Includes Row-Level Security (RLS) policies for multi-tenant isolation.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'tester',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'PREVIEW',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Audits Table
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  environment TEXT NOT NULL,
  audit_tier TEXT NOT NULL DEFAULT 'TIER_1_PUBLIC',
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  summary TEXT,
  checks_json JSONB DEFAULT '[]'::jsonb,
  rqi_json JSONB DEFAULT '{}'::jsonb
);

-- 4. Potential Findings Table
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  audit_run_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  test_source TEXT NOT NULL,
  affected_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  expected_behavior TEXT,
  observed_behavior TEXT,
  recommended_severity TEXT NOT NULL DEFAULT 'MEDIUM',
  confidence TEXT NOT NULL DEFAULT 'HIGH',
  evidence_json JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  triage_notes TEXT,
  triaged_by TEXT,
  converted_bug_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Verified Bug Reports Table
CREATE TABLE IF NOT EXISTS bugs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_finding_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  affected_url TEXT NOT NULL,
  steps_to_reproduce_json JSONB DEFAULT '[]'::jsonb,
  expected_result TEXT,
  actual_result TEXT,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  status TEXT NOT NULL DEFAULT 'OPEN',
  environment_telemetry_json JSONB DEFAULT '{}'::jsonb,
  evidence_urls_json JSONB DEFAULT '[]'::jsonb,
  evidence_json JSONB DEFAULT '{}'::jsonb,
  developer_notes TEXT,
  reported_by TEXT DEFAULT 'QA Engineer',
  retest_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Retest Verification History
CREATE TABLE IF NOT EXISTS retest_history (
  id TEXT PRIMARY KEY,
  bug_report_id TEXT NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tester TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  tester_verdict TEXT NOT NULL,
  tester_comment TEXT,
  retested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Secure Report Share Tokens
CREATE TABLE IF NOT EXISTS share_tokens (
  token TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  audit_id TEXT,
  data_json JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance multi-tenant lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_project_id ON audits(project_id);
CREATE INDEX IF NOT EXISTS idx_findings_project_id ON findings(project_id);
CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON bugs(project_id);
CREATE INDEX IF NOT EXISTS idx_retest_bug_id ON retest_history(bug_report_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token);

-- Enable Row-Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retest_history ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies (PostgreSQL / Supabase)
CREATE POLICY projects_tenant_isolation ON projects
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY audits_tenant_isolation ON audits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = audits.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY findings_tenant_isolation ON findings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = findings.project_id AND projects.user_id = auth.uid()::text)
  );

CREATE POLICY bugs_tenant_isolation ON bugs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = bugs.project_id AND projects.user_id = auth.uid()::text)
  );
