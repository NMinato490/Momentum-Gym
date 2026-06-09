import { createAdminClient } from '@/lib/supabase-server';
import { createConnection } from 'mysql2/promise';

export interface SyncResult {
  success: boolean
  message: string
  membersCount?: number
  zonesCount?: number
  checkInsCount?: number
}

export async function syncSupabaseToMysql(): Promise<SyncResult> {
  const supabase = createAdminClient();

  const [membersRes, checkInsRes, zonesRes] = await Promise.all([
    supabase.from('members').select('*'),
    supabase.from('check_ins').select('*'),
    supabase.from('zones').select('*'),
  ]);

  if (membersRes.error) throw membersRes.error;
  if (checkInsRes.error) throw checkInsRes.error;
  if (zonesRes.error) throw zonesRes.error;

  const members = membersRes.data || [];
  const checkIns = checkInsRes.data || [];
  const zones = zonesRes.data || [];

  const conn = await createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    connectTimeout: 5000,
    multipleStatements: true,
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS momentum_gym');
  await conn.query('USE momentum_gym');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS members (
      member_id VARCHAR(50) PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      membership_type VARCHAR(20) DEFAULT 'basic',
      is_active BOOLEAN DEFAULT TRUE,
      join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS zones (
      zone_id INT AUTO_INCREMENT PRIMARY KEY,
      zone_name VARCHAR(100) NOT NULL UNIQUE,
      capacity INT NOT NULL,
      description TEXT,
      total_equipment INT NOT NULL DEFAULT 0,
      equipment_in_use INT NOT NULL DEFAULT 0
    )
  `);

  await conn.query(`ALTER TABLE zones ADD COLUMN IF NOT EXISTS total_equipment INT NOT NULL DEFAULT 0`);
  await conn.query(`ALTER TABLE zones ADD COLUMN IF NOT EXISTS equipment_in_use INT NOT NULL DEFAULT 0`);

  await conn.query(`
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
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS check_ins (
      log_id VARCHAR(100) PRIMARY KEY,
      member_id VARCHAR(50),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      zone_name VARCHAR(100),
      check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      check_out_time DATETIME,
      duration_minutes INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
    )
  `);

  await conn.query('DROP TRIGGER IF EXISTS after_check_in_insert');
  await conn.query('DROP TRIGGER IF EXISTS after_check_in_update');

  await conn.query('DELETE FROM check_ins');
  await conn.query('DELETE FROM members');
  await conn.query('DELETE FROM zones');

  for (const m of members) {
    await conn.execute(
      'INSERT INTO members (member_id, first_name, last_name, email, phone, membership_type, is_active, join_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [m.member_id, m.first_name, m.last_name, m.email || null, m.phone || null, m.membership_type, m.is_active, m.join_date, m.created_at]
    );
  }

  for (const z of zones) {
    await conn.execute(
      'INSERT INTO zones (zone_name, capacity, description, total_equipment, equipment_in_use) VALUES (?, ?, ?, ?, ?)',
      [z.zone_name, z.capacity, z.description || null, z.total_equipment || 0, z.equipment_in_use || 0]
    );
  }

  const validMemberIds = new Set(members.map(m => m.member_id));
  let skippedCheckIns = 0;
  for (const c of checkIns) {
    if (!c.member_id || !validMemberIds.has(c.member_id)) {
      skippedCheckIns++;
      continue;
    }
    await conn.execute(
      'INSERT INTO check_ins (log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.log_id, c.member_id, c.first_name, c.last_name, c.zone_name, c.check_in_time, c.check_out_time || null, c.duration_minutes || null, c.created_at]
    );
  }

  await conn.query(`
    UPDATE zones SET total_equipment = 20, equipment_in_use = 0 WHERE zone_name = 'Cardio';
    UPDATE zones SET total_equipment = 15, equipment_in_use = 0 WHERE zone_name = 'Strength';
    UPDATE zones SET total_equipment = 12, equipment_in_use = 0 WHERE zone_name = 'Free Weights';
    UPDATE zones SET total_equipment = 10, equipment_in_use = 0 WHERE zone_name = 'Functional Training';
    UPDATE zones SET total_equipment = 8, equipment_in_use = 0 WHERE zone_name = 'Yoga / Stretching';
    UPDATE zones SET total_equipment = 6, equipment_in_use = 0 WHERE zone_name = 'Swimming Pool';
    UPDATE zones SET total_equipment = 5, equipment_in_use = 0 WHERE zone_name = 'Group Fitness Studio';
    UPDATE zones SET total_equipment = 0 WHERE total_equipment IS NULL OR total_equipment = 0
  `);

  await conn.query(`
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
      density_status = VALUES(density_status),
      total_equipment = VALUES(total_equipment),
      equipment_in_use = VALUES(equipment_in_use)
  `);

  await conn.query(`
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
    ORDER BY zone_id
  `);

  await conn.query('DROP TRIGGER IF EXISTS after_check_in_insert');
  await conn.query(`
    CREATE TRIGGER after_check_in_insert
    AFTER INSERT ON check_ins
    FOR EACH ROW
    BEGIN
      DECLARE active INT;
      DECLARE cap INT;
      IF NEW.check_out_time IS NULL THEN
        UPDATE zones SET equipment_in_use = equipment_in_use + 1 WHERE zone_name = NEW.zone_name;
      END IF;
      SELECT COUNT(*) INTO active FROM check_ins WHERE zone_name = NEW.zone_name AND check_out_time IS NULL;
      SELECT capacity INTO cap FROM zones WHERE zone_name = NEW.zone_name;
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
        occupancy_percentage = ROUND(active / z.capacity * 100, 2),
        density_status = CASE
          WHEN active = 0 THEN 'Empty'
          WHEN active / z.capacity < 0.3 THEN 'Low'
          WHEN active / z.capacity < 0.6 THEN 'Medium'
          WHEN active / z.capacity < 0.9 THEN 'High'
          ELSE 'Full'
        END,
        last_updated = CURRENT_TIMESTAMP;
    END
  `);

  await conn.query('DROP TRIGGER IF EXISTS after_check_in_update');
  await conn.query(`
    CREATE TRIGGER after_check_in_update
    AFTER UPDATE ON check_ins
    FOR EACH ROW
    BEGIN
      DECLARE active INT;
      DECLARE cap INT;
      IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
        UPDATE zones SET equipment_in_use = equipment_in_use - 1 WHERE zone_name = NEW.zone_name;
      END IF;
      SELECT COUNT(*) INTO active FROM check_ins WHERE zone_name = NEW.zone_name AND check_out_time IS NULL;
      SELECT capacity INTO cap FROM zones WHERE zone_name = NEW.zone_name;
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
        occupancy_percentage = ROUND(active / z.capacity * 100, 2),
        density_status = CASE
          WHEN active = 0 THEN 'Empty'
          WHEN active / z.capacity < 0.3 THEN 'Low'
          WHEN active / z.capacity < 0.6 THEN 'Medium'
          WHEN active / z.capacity < 0.9 THEN 'High'
          ELSE 'Full'
        END,
        last_updated = CURRENT_TIMESTAMP;
    END
  `);

  await conn.end();

  const insertedCheckIns = checkIns.length - skippedCheckIns;
  return {
    success: true,
    message: `Pushed ${members.length} members, ${zones.length} zones, ${insertedCheckIns} check-ins to MySQL${skippedCheckIns > 0 ? ` (${skippedCheckIns} check-ins skipped — missing member)` : ''}`,
    membersCount: members.length,
    zonesCount: zones.length,
    checkInsCount: insertedCheckIns,
  };
}
