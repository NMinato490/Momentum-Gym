import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const format = request.nextUrl.searchParams.get('format') || 'csv';

    // Fetch all data
    const [membersRes, checkInsRes, zonesRes] = await Promise.all([
      supabase.from('members').select('*').order('member_id'),
      supabase.from('check_ins').select('*').order('check_in_time'),
      supabase.from('zones').select('*').order('zone_id'),
    ]);

    if (membersRes.error) throw membersRes.error;
    if (checkInsRes.error) throw checkInsRes.error;
    if (zonesRes.error) throw zonesRes.error;

    const members = membersRes.data || [];
    const checkIns = checkInsRes.data || [];
    const zones = zonesRes.data || [];

    if (format === 'sql') {
      const lines: string[] = [];
      lines.push('-- MySQL dump for Momentum Gym');
      lines.push('-- Generated ' + new Date().toISOString());
      lines.push('');
      lines.push('CREATE TABLE IF NOT EXISTS members (');
      lines.push('  member_id VARCHAR(50) PRIMARY KEY,');
      lines.push('  first_name VARCHAR(100) NOT NULL,');
      lines.push('  last_name VARCHAR(100) NOT NULL,');
      lines.push('  email VARCHAR(255),');
      lines.push('  phone VARCHAR(50),');
      lines.push('  membership_type VARCHAR(20) DEFAULT \'basic\',');
      lines.push('  is_active BOOLEAN DEFAULT TRUE,');
      lines.push('  join_date DATETIME DEFAULT CURRENT_TIMESTAMP,');
      lines.push('  created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      lines.push(');');
      lines.push('');

      for (const m of members) {
        const email = m.email ? `'${m.email.replace(/'/g, "\\'")}'` : 'NULL';
        const phone = m.phone ? `'${m.phone.replace(/'/g, "\\'")}'` : 'NULL';
        lines.push(`INSERT INTO members (member_id, first_name, last_name, email, phone, membership_type, is_active, join_date) VALUES ('${m.member_id.replace(/'/g, "\\'")}', '${m.first_name.replace(/'/g, "\\'")}', '${m.last_name.replace(/'/g, "\\'")}', ${email}, ${phone}, '${m.membership_type}', ${m.is_active ? 1 : 0}, '${m.join_date}');`);
      }
      lines.push('');

      lines.push('CREATE TABLE IF NOT EXISTS zones (');
      lines.push('  zone_id INT AUTO_INCREMENT PRIMARY KEY,');
      lines.push('  zone_name VARCHAR(100) NOT NULL UNIQUE,');
      lines.push('  capacity INT NOT NULL,');
      lines.push('  description TEXT,');
      lines.push('  total_equipment INT NOT NULL DEFAULT 0,');
      lines.push('  equipment_in_use INT NOT NULL DEFAULT 0');
      lines.push(');');
      lines.push('');

      for (const z of zones) {
        const desc = z.description ? `'${z.description.replace(/'/g, "\\'")}'` : 'NULL';
        lines.push(`INSERT INTO zones (zone_name, capacity, description, total_equipment, equipment_in_use) VALUES ('${z.zone_name.replace(/'/g, "\\'")}', ${z.capacity}, ${desc}, ${z.total_equipment || 0}, ${z.equipment_in_use || 0});`);
      }
      lines.push('');

      lines.push('CREATE TABLE IF NOT EXISTS check_ins (');
      lines.push('  log_id VARCHAR(100) PRIMARY KEY,');
      lines.push('  member_id VARCHAR(50),');
      lines.push('  first_name VARCHAR(100),');
      lines.push('  last_name VARCHAR(100),');
      lines.push('  zone_name VARCHAR(100),');
      lines.push('  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,');
      lines.push('  check_out_time DATETIME,');
      lines.push('  duration_minutes INT,');
      lines.push('  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,');
      lines.push('  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE');
      lines.push(');');
      lines.push('');

      for (const c of checkIns) {
        const checkOut = c.check_out_time ? `'${c.check_out_time}'` : 'NULL';
        const duration = c.duration_minutes != null ? c.duration_minutes : 'NULL';
        lines.push(`INSERT INTO check_ins (log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes) VALUES ('${c.log_id.replace(/'/g, "\\'")}', '${c.member_id.replace(/'/g, "\\'")}', '${c.first_name.replace(/'/g, "\\'")}', '${c.last_name.replace(/'/g, "\\'")}', '${c.zone_name.replace(/'/g, "\\'")}', '${c.check_in_time}', ${checkOut}, ${duration});`);
      }
      lines.push('');
      lines.push('-- View: vw_gymfacilitysummary');
      lines.push('CREATE OR REPLACE VIEW vw_gymfacilitysummary AS');
      lines.push('SELECT');
      lines.push('  z.zone_id,');
      lines.push('  z.zone_name,');
      lines.push('  z.capacity,');
      lines.push('  COALESCE(ci.active_members, 0) AS active_members,');
      lines.push('  ROUND(COALESCE(ci.active_members, 0) / z.capacity * 100, 2) AS occupancy_percentage,');
      lines.push('  CASE');
      lines.push('    WHEN COALESCE(ci.active_members, 0) = 0 THEN \'Empty\'');
      lines.push('    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.3 THEN \'Low\'');
      lines.push('    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.6 THEN \'Medium\'');
      lines.push('    WHEN COALESCE(ci.active_members, 0) / z.capacity < 0.9 THEN \'High\'');
      lines.push('    ELSE \'Full\'');
      lines.push('  END AS density_status,');
      lines.push('  z.total_equipment,');
      lines.push('  z.equipment_in_use,');
      lines.push('  NOW() AS last_updated');
      lines.push('FROM zones z');
      lines.push('LEFT JOIN (');
      lines.push('  SELECT zone_name, COUNT(*) AS active_members');
      lines.push('  FROM check_ins');
      lines.push('  WHERE check_out_time IS NULL');
      lines.push('  GROUP BY zone_name');
      lines.push(') ci ON z.zone_name = ci.zone_name');
      lines.push('ORDER BY z.zone_id;');
      lines.push('');

      const sql = lines.join('\n');
      return new NextResponse(sql, {
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="momentum-gym-export-${Date.now()}.sql"`,
        },
      });
    }

    const table = request.nextUrl.searchParams.get('table') || 'members';

    if (table === 'facility-summary') {
      const activeCheckIns = checkIns.filter((c: any) => !c.check_out_time);
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const headers = ['zone_id', 'zone_name', 'capacity', 'active_members', 'occupancy_percentage', 'density_status', 'total_equipment', 'equipment_in_use', 'last_updated'];
      const summaryRows = zones.map((z: any) => {
        const active = activeCheckIns.filter((c: any) => c.zone_name === z.zone_name).length;
        const pct = z.capacity > 0 ? ((active / z.capacity) * 100).toFixed(2) : '0.00';
        const pctNum = parseFloat(pct);
        const status = active === 0 ? 'Empty' : pctNum < 30 ? 'Low' : pctNum < 60 ? 'Medium' : pctNum < 90 ? 'High' : 'Full';
        return [z.zone_id, z.zone_name, z.capacity, active, pct, status, z.total_equipment || 0, z.equipment_in_use || 0, now];
      });
      const csvLines = [headers.join(','), ...summaryRows.map((r: any[]) => r.join(','))];
      return new NextResponse(csvLines.join('\n'), {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="facility-summary-${Date.now()}.csv"` },
      });
    }

    if (!['members', 'check_ins', 'zones'].includes(table)) {
      return NextResponse.json({ success: false, error: 'Invalid table' }, { status: 400 });
    }

    const dataMap = { members, check_ins, zones };
    const rows = dataMap[table as keyof typeof dataMap];

    if (rows.length === 0) {
      return new NextResponse('No data', {
        headers: { 'Content-Type': 'text/csv' },
      });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const vals = headers.map((h) => {
        const v = (row as any)[h];
        if (v == null) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      });
      csvLines.push(vals.join(','));
    }

    const csv = csvLines.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}-${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
