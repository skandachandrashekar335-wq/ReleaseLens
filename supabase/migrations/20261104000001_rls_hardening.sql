-- ReleaseLens Migration: RLS Hardening & Index Optimization
-- ADR-026, ADR-027, ADR-028 Compliant
-- Adds missing RLS policies on users, sessions, retest_history, share_tokens, and composite indexes.

-- 1. Performance Indexes for Query Optimization
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_started_at ON audits(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_created_at ON findings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bugs_created_at ON bugs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_retest_retested_at ON retest_history(retested_at DESC);

-- 2. RLS on Users Table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_self_isolation'
  ) THEN
    CREATE POLICY users_self_isolation ON users
      FOR ALL USING (auth.uid()::text = id);
  END IF;
END $$;

-- 3. RLS on Sessions Table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'sessions_self_isolation'
  ) THEN
    CREATE POLICY sessions_self_isolation ON sessions
      FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- 4. RLS on Retest History Table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'retest_history' AND policyname = 'retest_history_tenant_isolation'
  ) THEN
    CREATE POLICY retest_history_tenant_isolation ON retest_history
      FOR ALL USING (
        auth.uid()::text = user_id OR
        EXISTS (
          SELECT 1 FROM bugs
          WHERE bugs.id = retest_history.bug_report_id AND bugs.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- 5. RLS on Share Tokens Table
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'share_tokens' AND policyname = 'share_tokens_public_read'
  ) THEN
    CREATE POLICY share_tokens_public_read ON share_tokens
      FOR SELECT USING (expires_at > NOW());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'share_tokens' AND policyname = 'share_tokens_owner_manage'
  ) THEN
    CREATE POLICY share_tokens_owner_manage ON share_tokens
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = share_tokens.project_id AND projects.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;
