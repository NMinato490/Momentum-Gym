-- Run this in Supabase Dashboard > SQL Editor
-- https://app.supabase.com/project/zjmkzmbessxxdvqugwvb/sql/new

-- Grant service_role full access so the admin client (service_role key) works
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE TABLE IF NOT EXISTS public.members (
  member_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  membership_type TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT TRUE,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.check_ins (
  log_id TEXT PRIMARY KEY,
  member_id TEXT REFERENCES members(member_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  zone_name TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zones (
  zone_id SERIAL PRIMARY KEY,
  zone_name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  description TEXT
);

INSERT INTO public.zones (zone_name, capacity, description) VALUES
  ('Cardio Zone', 50, 'Treadmills, bikes, ellipticals'),
  ('Weights Area', 40, 'Free weights and machines'),
  ('Swimming Pool', 30, 'Olympic-size pool'),
  ('Studio 1', 25, 'Group fitness classes'),
  ('CrossFit Rig', 20, 'Functional fitness area')
ON CONFLICT (zone_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_zone_name ON check_ins(zone_name);
CREATE INDEX IF NOT EXISTS idx_check_ins_check_in_time ON check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_check_ins_check_out_time ON check_ins(check_out_time);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Helper: extract role from auth.users user_metadata via JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user');
$$;

-- 1) members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_authenticated" ON public.members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "members_insert_admin" ON public.members
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "members_update_admin" ON public.members
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "members_delete_admin" ON public.members
  FOR DELETE USING (public.get_user_role() IN ('admin', 'superadmin'));

-- 2) check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "check_ins_select_authenticated" ON public.check_ins
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "check_ins_insert_admin" ON public.check_ins
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "check_ins_update_admin" ON public.check_ins
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "check_ins_delete_admin" ON public.check_ins
  FOR DELETE USING (public.get_user_role() IN ('admin', 'superadmin'));

-- 3) zones
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zones_select_authenticated" ON public.zones
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "zones_insert_admin" ON public.zones
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "zones_update_admin" ON public.zones
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "zones_delete_admin" ON public.zones
  FOR DELETE USING (public.get_user_role() IN ('admin', 'superadmin'));
