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

-- ============================================================
-- Facility Summary Table (materialized cache, updated by triggers)
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_summary (
  summary_id INT PRIMARY KEY AUTO_INCREMENT,
  zone_id INT NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  active_members INT DEFAULT 0,
  occupancy_percentage DECIMAL(5,2) DEFAULT 0.00,
  density_status VARCHAR(20) DEFAULT 'Empty',
  total_equipment INT DEFAULT 0,
  equipment_in_use INT DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE CASCADE,
  UNIQUE KEY uk_zone_id (zone_id)
);

-- Populate initial data
INSERT INTO facility_summary (zone_id, zone_name, capacity, active_members, occupancy_percentage, density_status, total_equipment, equipment_in_use)
SELECT z.zone_id, z.zone_name, z.capacity,
  COALESCE(ci.active_members, 0),
  ROUND(COALESCE(ci.active_members, 0) / z.capacity * 100, 2),
  CASE
    WHEN COALESCE(ci.active_members, 0) = 0 THEN 'Empty'
    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.3 THEN 'Low'
    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.6 THEN 'Medium'
    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.9 THEN 'High'
    ELSE 'Full'
  END,
  z.total_equipment,
  z.equipment_in_use
FROM zones z
LEFT JOIN (
  SELECT zone_name, COUNT(*) AS active_members
  FROM check_ins
  WHERE check_out_time IS NULL
  GROUP BY zone_name
) ci ON z.zone_name = ci.zone_name
ON DUPLICATE KEY UPDATE
  active_members = VALUES(active_members),
  occupancy_percentage = VALUES(occupancy_percentage),
  density_status = VALUES(density_status);

-- ============================================================
-- Trigger: on check-in INSERT, update facility_summary
-- ============================================================
DROP TRIGGER IF EXISTS after_check_in_insert;
CREATE TRIGGER after_check_in_insert
AFTER INSERT ON check_ins
FOR EACH ROW
BEGIN
  DECLARE active INT;
  IF NEW.check_out_time IS NULL THEN
    UPDATE zones SET equipment_in_use = equipment_in_use + 1 WHERE zone_name = NEW.zone_name;
  END IF;
  SELECT COUNT(*) INTO active FROM check_ins WHERE zone_name = NEW.zone_name AND check_out_time IS NULL;
  INSERT INTO facility_summary (zone_id, zone_name, capacity, active_members, occupancy_percentage, density_status, last_updated)
  SELECT z.zone_id, z.zone_name, z.capacity, active,
    ROUND(active / z.capacity * 100, 2),
    CASE
      WHEN active = 0 THEN 'Empty'
      WHEN active / z.capacity < 0.3 THEN 'Low'
      WHEN active / z.capacity < 0.6 THEN 'Medium'
      WHEN active / z.capacity < 0.9 THEN 'High'
      ELSE 'Full'
    END,
    CURRENT_TIMESTAMP
  FROM zones z WHERE z.zone_name = NEW.zone_name
  ON DUPLICATE KEY UPDATE
    active_members = active,
    occupancy_percentage = ROUND(active / capacity * 100, 2),
    density_status = CASE
      WHEN active = 0 THEN 'Empty'
      WHEN active / capacity < 0.3 THEN 'Low'
      WHEN active / capacity < 0.6 THEN 'Medium'
      WHEN active / capacity < 0.9 THEN 'High'
      ELSE 'Full'
    END,
    last_updated = CURRENT_TIMESTAMP;
END;

-- ============================================================
-- Trigger: on check-out UPDATE, update facility_summary
-- ============================================================
DROP TRIGGER IF EXISTS after_check_in_update;
CREATE TRIGGER after_check_in_update
AFTER UPDATE ON check_ins
FOR EACH ROW
BEGIN
  DECLARE active INT;
  IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
    UPDATE zones SET equipment_in_use = equipment_in_use - 1 WHERE zone_name = NEW.zone_name;
  END IF;
  SELECT COUNT(*) INTO active FROM check_ins WHERE zone_name = NEW.zone_name AND check_out_time IS NULL;
  INSERT INTO facility_summary (zone_id, zone_name, capacity, active_members, occupancy_percentage, density_status, last_updated)
  SELECT z.zone_id, z.zone_name, z.capacity, active,
    ROUND(active / z.capacity * 100, 2),
    CASE
      WHEN active = 0 THEN 'Empty'
      WHEN active / z.capacity < 0.3 THEN 'Low'
      WHEN active / z.capacity < 0.6 THEN 'Medium'
      WHEN active / z.capacity < 0.9 THEN 'High'
      ELSE 'Full'
    END,
    CURRENT_TIMESTAMP
  FROM zones z WHERE z.zone_name = NEW.zone_name
  ON DUPLICATE KEY UPDATE
    active_members = active,
    occupancy_percentage = ROUND(active / capacity * 100, 2),
    density_status = CASE
      WHEN active = 0 THEN 'Empty'
      WHEN active / capacity < 0.3 THEN 'Low'
      WHEN active / capacity < 0.6 THEN 'Medium'
      WHEN active / capacity < 0.9 THEN 'High'
      ELSE 'Full'
    END,
    last_updated = CURRENT_TIMESTAMP;
END;

-- ============================================================
-- View: reads from facility_summary (auto-updated by triggers)
-- ============================================================
CREATE OR REPLACE VIEW vw_gymfacilitysummary AS
SELECT
  zone_id,
  zone_name,
  capacity,
  active_members,
  occupancy_percentage,
  density_status,
  total_equipment,
  equipment_in_use,
  last_updated
FROM facility_summary
ORDER BY zone_id;
