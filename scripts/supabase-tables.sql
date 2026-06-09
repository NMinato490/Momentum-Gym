-- Momentum Gym - Supabase System Tables
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. Admin Status - tracks if admin/superadmin users are currently active
CREATE TABLE IF NOT EXISTS admin_status (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE admin_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin statuses"
  ON admin_status FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Users can update their own status"
  ON admin_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status"
  ON admin_status FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Config Settings - global and user-level app configuration
CREATE TABLE IF NOT EXISTS config_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, user_id)
);

ALTER TABLE config_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read config"
  ON config_settings FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Users can manage their own configs"
  ON config_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own configs"
  ON config_settings FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own configs"
  ON config_settings FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Server Logs - backend log entries
CREATE TABLE IF NOT EXISTS server_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  level TEXT NOT NULL DEFAULT 'info',
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE server_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON server_logs FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Service role can insert logs"
  ON server_logs FOR INSERT
  WITH CHECK (true);

-- 4. Login Logs - login attempt history
CREATE TABLE IF NOT EXISTS login_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login logs"
  ON login_logs FOR SELECT
  USING (auth.role() IN ('authenticated'));

CREATE POLICY "Service role can insert login logs"
  ON login_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_status_user_id ON admin_status(user_id);
CREATE INDEX IF NOT EXISTS idx_config_settings_key ON config_settings(key);
CREATE INDEX IF NOT EXISTS idx_config_settings_user ON config_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_server_logs_level ON server_logs(level);
CREATE INDEX IF NOT EXISTS idx_server_logs_created ON server_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
