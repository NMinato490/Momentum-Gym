import { createAdminClient } from '@/lib/supabase-server';
import { createConnection } from 'mysql2/promise';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
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

    for (const c of checkIns) {
      await conn.execute(
        'INSERT INTO check_ins (log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [c.log_id, c.member_id, c.first_name, c.last_name, c.zone_name, c.check_in_time, c.check_out_time || null, c.duration_minutes || null, c.created_at]
      );
    }

    await conn.end();

    return NextResponse.json({
      success: true,
      message: `Pushed ${members.length} members, ${zones.length} zones, ${checkIns.length} check-ins to MySQL`
    });
  } catch (error: any) {
    console.error('MySQL push error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
