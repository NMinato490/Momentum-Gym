-- Zones table
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

-- Row Level Security
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user');
$$;

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
