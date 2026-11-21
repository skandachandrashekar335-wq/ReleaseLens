-- ReleaseLens AppSec Hardening: Comprehensive Row-Level Security (RLS)
-- ADR-034 Compliant
-- Enables RLS and tenant-isolation policies across all primary tables.

-- 1. Enable RLS on All Tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS retest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS share_tokens ENABLE ROW LEVEL SECURITY;

-- Optional alias/view for runs (matching audits)
CREATE OR REPLACE VIEW runs AS SELECT * FROM audits;

-- 2. Drop existing policies to prevent duplicate collision
DROP POLICY IF EXISTS users_self_isolation ON users;
DROP POLICY IF EXISTS sessions_self_isolation ON sessions;
DROP POLICY IF EXISTS projects_tenant_isolation ON projects;
DROP POLICY IF EXISTS audits_tenant_isolation ON audits;
DROP POLICY IF EXISTS findings_tenant_isolation ON findings;
DROP POLICY IF EXISTS bugs_tenant_isolation ON bugs;
DROP POLICY IF EXISTS retest_history_tenant_isolation ON retest_history;
DROP POLICY IF EXISTS share_tokens_owner_manage ON share_tokens;
DROP POLICY IF EXISTS share_tokens_public_read ON share_tokens;

-- 3. Users Table Policy: Authenticated users can only read/mutate their own profile
CREATE POLICY users_self_isolation ON users
  FOR ALL USING (auth.uid()::text = id);

-- 4. Sessions Table Policy: Users can only access their own active sessions
CREATE POLICY sessions_self_isolation ON sessions
  FOR ALL USING (auth.uid()::text = user_id);

-- 5. Projects Table Policy: Full tenant isolation by user_id
CREATE POLICY projects_tenant_isolation ON projects
  FOR ALL USING (auth.uid()::text = user_id);

-- 6. Audits / Runs Policy: Access strictly bounded by project ownership
CREATE POLICY audits_tenant_isolation ON audits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = audits.project_id
        AND projects.user_id = auth.uid()::text
    )
  );

-- 7. Findings Policy: Access strictly bounded by project ownership
CREATE POLICY findings_tenant_isolation ON findings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = findings.project_id
        AND projects.user_id = auth.uid()::text
    )
  );

-- 8. Bugs / Defects Policy: Access strictly bounded by user_id or project ownership
CREATE POLICY bugs_tenant_isolation ON bugs
  FOR ALL USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bugs.project_id
        AND projects.user_id = auth.uid()::text
    )
  );

-- 9. Retest History Policy: Retest records restricted to bug / project owner
CREATE POLICY retest_history_tenant_isolation ON retest_history
  FOR ALL USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM bugs
      WHERE bugs.id = retest_history.bug_report_id
        AND bugs.user_id = auth.uid()::text
    )
  );

-- 10. Share Tokens Policy: Read allowed if unexpired; mutations restricted to project owner
CREATE POLICY share_tokens_public_read ON share_tokens
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY share_tokens_owner_manage ON share_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = share_tokens.project_id
        AND projects.user_id = auth.uid()::text
    )
  );
