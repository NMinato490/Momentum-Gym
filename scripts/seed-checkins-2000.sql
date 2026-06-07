-- Seed check-in logs for the 2000+ members (roughly 5-20 check-ins per member)
-- Run AFTER seed-2000-members.sql
-- Run in Supabase Dashboard > SQL Editor

DO $$
DECLARE
  member RECORD;
  checkin_date TIMESTAMPTZ;
  checkout_date TIMESTAMPTZ;
  duration INT;
  zone_name TEXT;
  zones TEXT[] := ARRAY['Cardio Zone','Weights Area','Swimming Pool','Studio 1','CrossFit Rig'];
  checkins_per_member INT;
  total_checkins INT := 0;
  v_log_id TEXT;
BEGIN
  FOR member IN SELECT member_id, first_name, last_name, join_date FROM public.members LOOP
    checkins_per_member := 5 + floor(random() * 16)::int; -- 5 to 20 check-ins

    FOR c IN 1..checkins_per_member LOOP
      -- spread check-ins across the member's join date to now
      checkin_date := member.join_date + (random() * (NOW() - member.join_date));
      duration := 30 + floor(random() * 121)::int; -- 30 to 150 minutes
      checkout_date := checkin_date + (duration * INTERVAL '1 minute');
      zone_name := zones[1 + floor(random() * array_length(zones, 1))];
      v_log_id := 'L' || to_char(checkin_date, 'YYYYMMDDHH24MISS') || '_' || member.member_id || '_' || c;

      BEGIN
        INSERT INTO public.check_ins (log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes)
        VALUES (v_log_id, member.member_id, member.first_name, member.last_name, zone_name, checkin_date, checkout_date, duration)
        ON CONFLICT (log_id) DO NOTHING;
        total_checkins := total_checkins + 1;
      EXCEPTION WHEN unique_violation THEN
        -- skip
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Done. Inserted % check-ins for % members', total_checkins, (SELECT count(*) FROM public.members);
END $$;
