-- IntuneGet: Automated Update Management
-- Migration: 012_app_update_policies
-- Description: Adds tables for app update policies and auto-update tracking

-- ============================================
-- App Update Policies Table
-- ============================================
-- Stores per-app update policies for automated deployments

CREATE TABLE IF NOT EXISTS app_update_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and tenant identification
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  winget_id TEXT NOT NULL,

  -- Policy type: 'auto_update' | 'notify' | 'ignore' | 'pin_version'
  policy_type TEXT NOT NULL DEFAULT 'notify' CHECK (policy_type IN ('auto_update', 'notify', 'ignore', 'pin_version')),

  -- For pin_version policy - the version to stay on
  pinned_version TEXT,

  -- Saved deployment configuration for auto-updates
  -- Stores the full config needed to re-deploy: install command, detection rules, groups, etc.
  deployment_config JSONB,

  -- Reference to the original deployment that was used as template
  original_upload_history_id UUID REFERENCES upload_history(id) ON DELETE SET NULL,

  -- Tracking
  last_auto_update_at TIMESTAMP WITH TIME ZONE,
  last_auto_update_version TEXT,
  is_enabled BOOLEAN DEFAULT true,

  -- Circuit breaker: disable after consecutive failures
  consecutive_failures INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per user/tenant/app combination
  UNIQUE(user_id, tenant_id, winget_id)
);

-- Indexes for app_update_policies
CREATE INDEX IF NOT EXISTS idx_app_update_policies_user ON app_update_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_app_update_policies_tenant ON app_update_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_update_policies_winget ON app_update_policies(winget_id);
CREATE INDEX IF NOT EXISTS idx_app_update_policies_type ON app_update_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_app_update_policies_auto_update ON app_update_policies(policy_type, is_enabled)
  WHERE policy_type = 'auto_update' AND is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_app_update_policies_user_tenant ON app_update_policies(user_id, tenant_id);

-- ============================================
-- Auto Update History Table
-- ============================================
-- Tracks all auto-update attempts and their outcomes

CREATE TABLE IF NOT EXISTS auto_update_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the policy that triggered this update
  policy_id UUID NOT NULL REFERENCES app_update_policies(id) ON DELETE CASCADE,

  -- Reference to the packaging job created for this update
  packaging_job_id UUID REFERENCES packaging_jobs(id) ON DELETE SET NULL,

  -- Version information
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,

  -- Update classification: 'patch' | 'minor' | 'major'
  update_type TEXT NOT NULL CHECK (update_type IN ('patch', 'minor', 'major')),

  -- Status: 'pending' | 'packaging' | 'deploying' | 'completed' | 'failed' | 'cancelled'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'packaging', 'deploying', 'completed', 'failed', 'cancelled')),

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for auto_update_history
CREATE INDEX IF NOT EXISTS idx_auto_update_history_policy ON auto_update_history(policy_id);
CREATE INDEX IF NOT EXISTS idx_auto_update_history_job ON auto_update_history(packaging_job_id);
CREATE INDEX IF NOT EXISTS idx_auto_update_history_status ON auto_update_history(status);
CREATE INDEX IF NOT EXISTS idx_auto_update_history_triggered ON auto_update_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_update_history_pending ON auto_update_history(status) WHERE status IN ('pending', 'packaging', 'deploying');

-- ============================================
-- Extend packaging_jobs Table
-- ============================================
-- Add columns to track auto-update origin

ALTER TABLE packaging_jobs
  ADD COLUMN IF NOT EXISTS is_auto_update BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_update_policy_id UUID REFERENCES app_update_policies(id) ON DELETE SET NULL;

-- Index for auto-update jobs
CREATE INDEX IF NOT EXISTS idx_packaging_jobs_auto_update ON packaging_jobs(is_auto_update) WHERE is_auto_update = true;
CREATE INDEX IF NOT EXISTS idx_packaging_jobs_policy ON packaging_jobs(auto_update_policy_id) WHERE auto_update_policy_id IS NOT NULL;

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE app_update_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_update_history ENABLE ROW LEVEL SECURITY;

-- Service role has full access to update policies tables
CREATE POLICY "Service role has full access to app_update_policies"
ON app_update_policies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to auto_update_history"
ON auto_update_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Updated At Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_app_update_policies_updated_at ON app_update_policies;
CREATE TRIGGER update_app_update_policies_updated_at
  BEFORE UPDATE ON app_update_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Update Policies Stats View
-- ============================================
-- Provides aggregated statistics for update policies

CREATE OR REPLACE VIEW update_policy_stats AS
SELECT
  aup.user_id,
  aup.tenant_id,
  COUNT(*) AS total_policies,
  COUNT(*) FILTER (WHERE aup.policy_type = 'auto_update' AND aup.is_enabled = true) AS auto_update_enabled,
  COUNT(*) FILTER (WHERE aup.policy_type = 'notify') AS notify_only,
  COUNT(*) FILTER (WHERE aup.policy_type = 'ignore') AS ignored,
  COUNT(*) FILTER (WHERE aup.policy_type = 'pin_version') AS pinned,
  (
    SELECT COUNT(*)
    FROM auto_update_history auh
    JOIN app_update_policies p ON p.id = auh.policy_id
    WHERE p.user_id = aup.user_id
      AND p.tenant_id = aup.tenant_id
      AND auh.status = 'completed'
      AND auh.triggered_at > NOW() - INTERVAL '30 days'
  ) AS successful_updates_30d,
  (
    SELECT COUNT(*)
    FROM auto_update_history auh
    JOIN app_update_policies p ON p.id = auh.policy_id
    WHERE p.user_id = aup.user_id
      AND p.tenant_id = aup.tenant_id
      AND auh.status = 'failed'
      AND auh.triggered_at > NOW() - INTERVAL '30 days'
  ) AS failed_updates_30d
FROM app_update_policies aup
GROUP BY aup.user_id, aup.tenant_id;
