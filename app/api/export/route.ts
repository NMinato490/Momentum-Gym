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
      lines.push('  description TEXT');
      lines.push(');');
      lines.push('');

      for (const z of zones) {
        const desc = z.description ? `'${z.description.replace(/'/g, "\\'")}'` : 'NULL';
        lines.push(`INSERT INTO zones (zone_name, capacity, description) VALUES ('${z.zone_name.replace(/'/g, "\\'")}', ${z.capacity}, ${desc});`);
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

      const sql = lines.join('\n');
      return new NextResponse(sql, {
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="momentum-gym-export-${Date.now()}.sql"`,
        },
      });
    }

    // CSV - generate three files as a zip isn't feasible here,
    // so we return members CSV by default, plus individual endpoints
    const table = request.nextUrl.searchParams.get('table') || 'members';

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
