const mysql = require('mysql2/promise');

async function reset() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    connectTimeout: 5000,
    multipleStatements: true,
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS momentum_gym');
  await conn.query('USE momentum_gym');
  await conn.query('DELETE FROM facility_summary');
  await conn.query('DELETE FROM check_ins');
  await conn.query('DELETE FROM members');
  await conn.query('DELETE FROM zones');

  await conn.execute(`INSERT INTO members (member_id, first_name, last_name, email, phone, membership_type, is_active, join_date, created_at) VALUES
    ('M1001', 'John', 'Doe', 'john@example.com', '555-0001', 'premium', TRUE, '2025-01-15 08:00:00', NOW()),
    ('M1002', 'Jane', 'Smith', 'jane@example.com', '555-0002', 'vip', TRUE, '2025-02-01 09:00:00', NOW()),
    ('M1003', 'Mike', 'Johnson', 'mike@example.com', '555-0003', 'basic', TRUE, '2025-03-10 10:00:00', NOW()),
    ('M1004', 'Sarah', 'Williams', 'sarah@example.com', '555-0004', 'premium', TRUE, '2025-04-05 11:00:00', NOW()),
    ('M1005', 'Alex', 'Brown', 'alex@example.com', '555-0005', 'basic', TRUE, '2025-05-20 12:00:00', NOW()),
    ('M1006', 'Emily', 'Davis', 'emily@example.com', '555-0006', 'vip', TRUE, '2025-06-15 13:00:00', NOW()),
    ('M1007', 'David', 'Miller', 'david@example.com', '555-0007', 'basic', FALSE, '2025-07-01 14:00:00', NOW()),
    ('M1008', 'Lisa', 'Wilson', 'lisa@example.com', '555-0008', 'premium', TRUE, '2025-08-10 15:00:00', NOW()),
    ('M1009', 'James', 'Taylor', 'james@example.com', '555-0009', 'basic', TRUE, '2025-09-05 16:00:00', NOW()),
    ('M1010', 'Emma', 'Anderson', 'emma@example.com', '555-0010', 'vip', TRUE, '2025-10-01 17:00:00', NOW())`);

  await conn.execute(`INSERT INTO zones (zone_name, capacity, description, total_equipment, equipment_in_use) VALUES
    ('Cardio Zone', 50, 'Treadmills, bikes, ellipticals', 20, 0),
    ('Weights Area', 40, 'Free weights and machines', 15, 0),
    ('Swimming Pool', 30, 'Olympic-size pool', 6, 0),
    ('Studio 1', 25, 'Group fitness classes', 5, 0),
    ('CrossFit Rig', 20, 'Functional fitness area', 10, 0)`);

  await conn.execute(`INSERT INTO check_ins (log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes, created_at) VALUES
    ('L5001', 'M1001', 'John', 'Doe', 'Cardio Zone', '2026-06-09 06:30:00', NULL, NULL, NOW()),
    ('L5002', 'M1002', 'Jane', 'Smith', 'Weights Area', '2026-06-09 07:00:00', NULL, NULL, NOW()),
    ('L5003', 'M1004', 'Sarah', 'Williams', 'Studio 1', '2026-06-09 07:30:00', NULL, NULL, NOW()),
    ('L5004', 'M1005', 'Alex', 'Brown', 'CrossFit Rig', '2026-06-09 08:00:00', NULL, NULL, NOW()),
    ('L5005', 'M1010', 'Emma', 'Anderson', 'Swimming Pool', '2026-06-09 08:30:00', NULL, NULL, NOW()),
    ('L5006', 'M1003', 'Mike', 'Johnson', 'Cardio Zone', '2026-06-09 05:00:00', '2026-06-09 06:30:00', 90, NOW()),
    ('L5007', 'M1008', 'Lisa', 'Wilson', 'Weights Area', '2026-06-09 06:00:00', '2026-06-09 07:15:00', 75, NOW()),
    ('L5008', 'M1009', 'James', 'Taylor', 'Studio 1', '2026-06-09 06:30:00', '2026-06-09 08:00:00', 90, NOW())`);

  await conn.query("UPDATE zones SET equipment_in_use = 1 WHERE zone_name IN ('Cardio Zone','Weights Area','Studio 1','CrossFit Rig','Swimming Pool')");

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

  console.log('MySQL reset and seeded successfully');
  await conn.end();
}

reset().catch(e => { console.error('MySQL Error:', e.message); process.exit(1); });
