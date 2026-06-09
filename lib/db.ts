import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getConnection() {
  return pool.getConnection();
}

export async function query(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values || []);
    return results;
  } finally {
    connection.release();
  }
}

export async function initializeDatabase() {
  const connection = await getConnection();
  try {
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS gym_management`);
    await connection.query(`USE gym_management`);

    // Members table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS members (
        member_id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        membership_type ENUM('basic', 'premium', 'vip') DEFAULT 'basic',
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Zones table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS zones (
        zone_id INT PRIMARY KEY AUTO_INCREMENT,
        zone_name VARCHAR(100) NOT NULL UNIQUE,
        capacity INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Equipment table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS equipment (
        equipment_id INT PRIMARY KEY AUTO_INCREMENT,
        zone_id INT NOT NULL,
        equipment_name VARCHAR(100) NOT NULL,
        equipment_type VARCHAR(50),
        status ENUM('available', 'in_use', 'maintenance') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE CASCADE
      )
    `);

    // Check-in logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS check_in_logs (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        member_id INT NOT NULL,
        zone_id INT NOT NULL,
        equipment_id INT,
        check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out_time TIMESTAMP NULL,
        duration_minutes INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
        FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE SET NULL,
        INDEX idx_member (member_id),
        INDEX idx_zone (zone_id),
        INDEX idx_check_in (check_in_time)
      )
    `);

    // Facility summary table (materialized cache updated by triggers)
    await connection.execute(`
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

    // Initialize facility_summary with current data
    await connection.execute(`
      INSERT INTO facility_summary (zone_id, zone_name, capacity, active_members, occupancy_percentage, density_status, total_equipment, equipment_in_use)
      SELECT
        z.zone_id, z.zone_name, z.capacity,
        COUNT(DISTINCT cl.log_id),
        ROUND((COUNT(DISTINCT cl.log_id) / z.capacity) * 100, 2),
        CASE
          WHEN (COUNT(DISTINCT cl.log_id) / z.capacity) >= 0.8 THEN 'Critical'
          WHEN (COUNT(DISTINCT cl.log_id) / z.capacity) >= 0.6 THEN 'Warning'
          ELSE 'Healthy'
        END,
        COUNT(DISTINCT e.equipment_id),
        SUM(CASE WHEN e.status = 'in_use' THEN 1 ELSE 0 END)
      FROM zones z
      LEFT JOIN equipment e ON z.zone_id = e.zone_id
      LEFT JOIN check_in_logs cl ON z.zone_id = cl.zone_id AND cl.check_out_time IS NULL
      GROUP BY z.zone_id, z.zone_name, z.capacity
      ON DUPLICATE KEY UPDATE
        active_members = VALUES(active_members),
        occupancy_percentage = VALUES(occupancy_percentage),
        density_status = VALUES(density_status),
        total_equipment = VALUES(total_equipment),
        equipment_in_use = VALUES(equipment_in_use)
    `);

    // Summary view (reads from facility_summary, auto-updated by triggers)
    await connection.execute(`
      CREATE OR REPLACE VIEW vw_GymFacilitySummary AS
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

    // Drop existing triggers
    await connection.execute('DROP TRIGGER IF EXISTS after_check_in_log_insert');
    await connection.execute('DROP TRIGGER IF EXISTS after_check_in_log_update');

    // Trigger: on check-in (INSERT) -> update facility_summary
    await connection.execute(`
      CREATE TRIGGER after_check_in_log_insert
      AFTER INSERT ON check_in_logs
      FOR EACH ROW
      BEGIN
        DECLARE active INT;
        SELECT COUNT(*) INTO active FROM check_in_logs WHERE zone_id = NEW.zone_id AND check_out_time IS NULL;
        INSERT INTO facility_summary (zone_id, zone_name, capacity, active_members, occupancy_percentage, density_status, last_updated)
        SELECT z.zone_id, z.zone_name, z.capacity, active,
          ROUND(active / z.capacity * 100, 2),
          CASE WHEN active / z.capacity >= 0.8 THEN 'Critical' WHEN active / z.capacity >= 0.6 THEN 'Warning' ELSE 'Healthy' END,
          CURRENT_TIMESTAMP
        FROM zones z WHERE z.zone_id = NEW.zone_id
        ON DUPLICATE KEY UPDATE
          active_members = active,
          occupancy_percentage = ROUND(active / capacity * 100, 2),
          density_status = CASE WHEN active / capacity >= 0.8 THEN 'Critical' WHEN active / capacity >= 0.6 THEN 'Warning' ELSE 'Healthy' END,
          last_updated = CURRENT_TIMESTAMP;
      END
    `);

    // Trigger: on check-out (UPDATE) -> update facility_summary
    await connection.execute(`
      CREATE TRIGGER after_check_in_log_update
      AFTER UPDATE ON check_in_logs
      FOR EACH ROW
      BEGIN
        DECLARE active INT;
        SELECT COUNT(*) INTO active FROM check_in_logs WHERE zone_id = NEW.zone_id AND check_out_time IS NULL;
        INSERT INTO facility_summary (zone_id, zone_name, capacity, active_members, occupancy_percentage, density_status, last_updated)
        SELECT z.zone_id, z.zone_name, z.capacity, active,
          ROUND(active / z.capacity * 100, 2),
          CASE WHEN active / z.capacity >= 0.8 THEN 'Critical' WHEN active / z.capacity >= 0.6 THEN 'Warning' ELSE 'Healthy' END,
          CURRENT_TIMESTAMP
        FROM zones z WHERE z.zone_id = NEW.zone_id
        ON DUPLICATE KEY UPDATE
          active_members = active,
          occupancy_percentage = ROUND(active / capacity * 100, 2),
          density_status = CASE WHEN active / capacity >= 0.8 THEN 'Critical' WHEN active / capacity >= 0.6 THEN 'Warning' ELSE 'Healthy' END,
          last_updated = CURRENT_TIMESTAMP;
      END
    `);

    // Insert seed data
    const checkMembersExist = await connection.execute(`SELECT COUNT(*) as count FROM members`);
    if ((checkMembersExist[0] as any)[0].count === 0) {
      await connection.execute(`
        INSERT INTO members (first_name, last_name, email, phone, membership_type) VALUES
        ('John', 'Doe', 'john@example.com', '555-0001', 'premium'),
        ('Jane', 'Smith', 'jane@example.com', '555-0002', 'vip'),
        ('Mike', 'Johnson', 'mike@example.com', '555-0003', 'basic'),
        ('Sarah', 'Williams', 'sarah@example.com', '555-0004', 'premium'),
        ('Alex', 'Brown', 'alex@example.com', '555-0005', 'basic'),
        ('Emily', 'Davis', 'emily@example.com', '555-0006', 'vip'),
        ('David', 'Miller', 'david@example.com', '555-0007', 'basic'),
        ('Lisa', 'Wilson', 'lisa@example.com', '555-0008', 'premium')
      `);
    }

    const checkZonesExist = await connection.execute(`SELECT COUNT(*) as count FROM zones`);
    if ((checkZonesExist[0] as any)[0].count === 0) {
      await connection.execute(`
        INSERT INTO zones (zone_name, capacity, description) VALUES
        ('Cardio', 25, 'Treadmills, ellipticals, and stationary bikes'),
        ('Strength', 30, 'Free weights, dumbbells, and strength training equipment'),
        ('Yoga & Flexibility', 20, 'Yoga mats, flexibility training, and stretching'),
        ('CrossFit', 15, 'Olympic weightlifting and functional fitness'),
        ('Swimming', 50, 'Olympic pool and aquatic facilities')
      `);
    }

    const checkEquipmentExist = await connection.execute(`SELECT COUNT(*) as count FROM equipment`);
    if ((checkEquipmentExist[0] as any)[0].count === 0) {
      await connection.execute(`
        INSERT INTO equipment (zone_id, equipment_name, equipment_type) VALUES
        (1, 'Treadmill 1', 'Cardio'),
        (1, 'Treadmill 2', 'Cardio'),
        (1, 'Elliptical 1', 'Cardio'),
        (1, 'Stationary Bike 1', 'Cardio'),
        (2, 'Dumbbell Set 5-50lb', 'Weights'),
        (2, 'Barbell 1', 'Weights'),
        (2, 'Bench Press', 'Strength'),
        (2, 'Squat Rack', 'Strength'),
        (3, 'Yoga Mat 1', 'Flexibility'),
        (3, 'Yoga Mat 2', 'Flexibility'),
        (4, 'Squat Rack CF', 'CrossFit'),
        (4, 'Rowing Machine', 'CrossFit'),
        (5, 'Olympic Pool', 'Aquatic')
      `);
    }

    console.log('[v0] Database initialized successfully');
    return true;
  } catch (error) {
    console.error('[v0] Database initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function queryWithDb(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    await connection.query(`USE gym_management`);
    const [results] = await connection.execute(sql, values || []);
    return results;
  } finally {
    connection.release();
  }
}
