-- IntuneGet: Notification System
-- Migration: 011_notifications
-- Description: Adds tables for email and webhook notifications when app updates are available

-- ============================================
-- Notification Preferences Table
-- ============================================
-- Stores user notification preferences

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (links to user)
  user_id TEXT NOT NULL UNIQUE,

  -- Email notification settings
  email_enabled BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'daily' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
  email_address TEXT, -- Override email address (optional)

  -- Filtering options
  notify_critical_only BOOLEAN DEFAULT false, -- Only notify on major version updates

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email_enabled ON notification_preferences(email_enabled) WHERE email_enabled = true;

-- ============================================
-- Webhook Configurations Table
-- ============================================
-- Stores webhook endpoints for notifications

CREATE TABLE IF NOT EXISTS webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification
  user_id TEXT NOT NULL,

  -- Webhook details
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('slack', 'teams', 'discord', 'custom')),

  -- Security
  secret TEXT, -- For HMAC signing (optional)

  -- Custom headers (for custom webhooks)
  headers JSONB DEFAULT '{}',

  -- Status
  is_enabled BOOLEAN DEFAULT true,

  -- Circuit breaker tracking
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for webhook_configurations
CREATE INDEX IF NOT EXISTS idx_webhook_configurations_user ON webhook_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configurations_enabled ON webhook_configurations(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_webhook_configurations_type ON webhook_configurations(webhook_type);

-- ============================================
-- Notification History Table
-- ============================================
-- Tracks sent notifications for auditing and retry logic

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification
  user_id TEXT NOT NULL,

  -- Notification channel
  channel TEXT NOT NULL CHECK (channel IN ('email', 'webhook')),

  -- For webhook notifications, link to the webhook configuration
  webhook_id UUID REFERENCES webhook_configurations(id) ON DELETE SET NULL,

  -- Notification payload
  payload JSONB NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,

  -- Statistics
  apps_notified INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification_history
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_channel ON notification_history(channel);
CREATE INDEX IF NOT EXISTS idx_notification_history_webhook ON notification_history(webhook_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created ON notification_history(created_at DESC);

-- ============================================
-- Update Check Results Table
-- ============================================
-- Caches detected app updates for notification processing

CREATE TABLE IF NOT EXISTS update_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,

  -- App information
  winget_id TEXT NOT NULL,
  intune_app_id TEXT NOT NULL,
  display_name TEXT NOT NULL,

  -- Version information
  current_version TEXT NOT NULL,
  latest_version TEXT NOT NULL,

  -- Update classification
  is_critical BOOLEAN DEFAULT false, -- Major version jump

  -- Notification tracking
  notified_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate entries
  UNIQUE(user_id, tenant_id, winget_id, intune_app_id)
);

-- Indexes for update_check_results
CREATE INDEX IF NOT EXISTS idx_update_check_results_user ON update_check_results(user_id);
CREATE INDEX IF NOT EXISTS idx_update_check_results_tenant ON update_check_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_update_check_results_winget ON update_check_results(winget_id);
CREATE INDEX IF NOT EXISTS idx_update_check_results_pending ON update_check_results(notified_at) WHERE notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_update_check_results_critical ON update_check_results(is_critical) WHERE is_critical = true;
CREATE INDEX IF NOT EXISTS idx_update_check_results_detected ON update_check_results(detected_at DESC);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_check_results ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all notification tables
CREATE POLICY "Service role has full access to notification_preferences"
ON notification_preferences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to webhook_configurations"
ON webhook_configurations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to notification_history"
ON notification_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to update_check_results"
ON update_check_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Updated At Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_configurations_updated_at ON webhook_configurations;
CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_history_updated_at ON notification_history;
CREATE TRIGGER update_notification_history_updated_at
  BEFORE UPDATE ON notification_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_update_check_results_updated_at ON update_check_results;
CREATE TRIGGER update_update_check_results_updated_at
  BEFORE UPDATE ON update_check_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Notification Stats View
-- ============================================
-- Provides aggregated statistics for user notifications

CREATE OR REPLACE VIEW notification_stats AS
SELECT
  np.user_id,
  np.email_enabled,
  np.email_frequency,
  np.notify_critical_only,
  (
    SELECT COUNT(*)
    FROM webhook_configurations wc
    WHERE wc.user_id = np.user_id AND wc.is_enabled = true
  ) AS active_webhooks,
  (
    SELECT COUNT(*)
    FROM update_check_results ucr
    WHERE ucr.user_id = np.user_id AND ucr.notified_at IS NULL AND ucr.dismissed_at IS NULL
  ) AS pending_updates,
  (
    SELECT COUNT(*)
    FROM update_check_results ucr
    WHERE ucr.user_id = np.user_id AND ucr.is_critical = true AND ucr.notified_at IS NULL AND ucr.dismissed_at IS NULL
  ) AS pending_critical_updates,
  (
    SELECT COUNT(*)
    FROM notification_history nh
    WHERE nh.user_id = np.user_id AND nh.status = 'sent' AND nh.created_at > NOW() - INTERVAL '30 days'
  ) AS notifications_sent_30d,
  np.created_at,
  np.updated_at
FROM notification_preferences np;
