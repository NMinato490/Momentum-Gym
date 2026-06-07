-- Add equipment columns to zones table if not present
ALTER TABLE zones
  ADD COLUMN IF NOT EXISTS total_equipment INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equipment_in_use INT NOT NULL DEFAULT 0;

-- Update existing zones with sample equipment counts
UPDATE zones SET total_equipment = 20 WHERE zone_name = 'Cardio';
UPDATE zones SET total_equipment = 15 WHERE zone_name = 'Strength';
UPDATE zones SET total_equipment = 12 WHERE zone_name = 'Free Weights';
UPDATE zones SET total_equipment = 10 WHERE zone_name = 'Functional Training';
UPDATE zones SET total_equipment = 8 WHERE zone_name = 'Yoga / Stretching';
UPDATE zones SET total_equipment = 6 WHERE zone_name = 'Swimming Pool';
UPDATE zones SET total_equipment = 5 WHERE zone_name = 'Group Fitness Studio';
UPDATE zones SET total_equipment = 0 WHERE total_equipment IS NULL OR total_equipment = 0;

-- Create the view
CREATE OR REPLACE VIEW vw_gymfacilitysummary AS
SELECT
  z.zone_id,
  z.zone_name,
  z.capacity,
  COALESCE(ci.active_members, 0) AS active_members,
  ROUND(COALESCE(ci.active_members, 0) / z.capacity * 100, 2) AS occupancy_percentage,
  CASE
    WHEN COALESCE(ci.active_members, 0) = 0 THEN 'Empty'
    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.3 THEN 'Low'
    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.6 THEN 'Medium'
    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.9 THEN 'High'
    ELSE 'Full'
  END AS density_status,
  z.total_equipment,
  z.equipment_in_use,
  NOW() AS last_updated
FROM zones z
LEFT JOIN (
  SELECT zone_name, COUNT(*) AS active_members
  FROM check_ins
  WHERE check_out_time IS NULL
  GROUP BY zone_name
) ci ON z.zone_name = ci.zone_name
ORDER BY z.zone_id;
