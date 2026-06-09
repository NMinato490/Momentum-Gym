import { createAdminClient } from '@/lib/supabase-server';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

function getAuth() {
  const raw = process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!raw) {
    throw new Error('Google Sheets credentials not configured');
  }

  const decoded = Buffer.from(raw, 'base64').toString('utf-8');

  let privateKey: string;
  let email: string;

  if (decoded.trimStart().startsWith('{')) {
    const json = JSON.parse(decoded);
    privateKey = json.private_key;
    email = json.client_email;
  } else {
    privateKey = decoded;
    email = clientEmail || '';
  }

  if (!email) {
    throw new Error('Google Sheets credentials not configured');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  const keyFormatted = privateKey.includes('-----BEGIN ') && privateKey.includes('\n');
  console.log('[Google Auth] Key starts with:', privateKey.substring(0, 50).replace(/\n/g, '\\n'));
  console.log('[Google Auth] Key has PEM headers:', keyFormatted);
  console.log('[Google Auth] Key lines:', privateKey.split('\n').length);
  console.log('[Google Auth] Email:', email);

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
}

function rowsFromData(members: any[], checkIns: any[], zones: any[]) {
  const memberRows = [
    ['member_id', 'first_name', 'last_name', 'email', 'phone', 'membership_type', 'is_active', 'join_date'],
    ...members.map((m: any) => [
      m.member_id, m.first_name, m.last_name, m.email || '', m.phone || '',
      m.membership_type, m.is_active ? 'TRUE' : 'FALSE', m.join_date,
    ]),
  ];

  const zoneRows = [
    ['zone_id', 'zone_name', 'capacity', 'description'],
    ...zones.map((z: any) => [z.zone_id, z.zone_name, z.capacity, z.description || '']),
  ];

  const checkInRows = [
    ['log_id', 'member_id', 'first_name', 'last_name', 'zone_name', 'check_in_time', 'check_out_time', 'duration_minutes'],
    ...checkIns.map((c: any) => [
      c.log_id, c.member_id, c.first_name, c.last_name, c.zone_name,
      c.check_in_time, c.check_out_time || '', c.duration_minutes ?? '',
    ]),
  ];

  const activeCheckIns = checkIns.filter((c: any) => !c.check_out_time);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const facilitySummaryRows = [
    ['zone_id', 'zone_name', 'capacity', 'active_members', 'occupancy_percentage', 'density_status', 'total_equipment', 'equipment_in_use', 'last_updated'],
    ...zones.map((z: any) => {
      const active = activeCheckIns.filter((c: any) => c.zone_name === z.zone_name).length;
      const pct = z.capacity > 0 ? ((active / z.capacity) * 100).toFixed(2) : '0.00';
      const pctNum = parseFloat(pct);
      const status = active === 0 ? 'Empty' : pctNum < 30 ? 'Low' : pctNum < 60 ? 'Medium' : pctNum < 90 ? 'High' : 'Full';
      return [z.zone_id, z.zone_name, z.capacity, active, pct, status, z.total_equipment || 0, z.equipment_in_use || 0, now];
    }),
  ];

  return { memberRows, zoneRows, checkInRows, facilitySummaryRows };
}

async function getOrCreateSpreadsheet(sheets: any) {
  const existingId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (existingId) return existingId;

  try {
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'Momentum-Gym' },
      sheets: [
        { properties: { title: 'Members' } },
        { properties: { title: 'Zones' } },
        { properties: { title: 'Check-Ins' } },
        { properties: { title: 'Facility Summary' } },
      ],
      },
    });
    return res.data.spreadsheetId;
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      throw new Error('The service account cannot create new spreadsheets. Create an empty spreadsheet, share it with the service account (' + (process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 'check GOOGLE_SHEETS_CLIENT_EMAIL') + ') as Editor, then set GOOGLE_SHEETS_SPREADSHEET_ID to its ID.');
    }
    throw e;
  }
}

async function resetSheet(sheets: any, spreadsheetId: string, title: string, rows: string[][]) {
  const existing = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const sheet = existing.data.sheets?.find((s: any) => s.properties?.title === title);
  if (sheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ deleteSheet: { sheetId: sheet.properties.sheetId } }],
      },
    });
  }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });
}

export async function POST() {
  try {
    const supabase = createAdminClient();

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

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = await getOrCreateSpreadsheet(sheets);

    const { memberRows, zoneRows, checkInRows, facilitySummaryRows } = rowsFromData(members, checkIns, zones);

    await resetSheet(sheets, spreadsheetId, 'Members', memberRows);
    await resetSheet(sheets, spreadsheetId, 'Zones', zoneRows);
    await resetSheet(sheets, spreadsheetId, 'Check-Ins', checkInRows);
    await resetSheet(sheets, spreadsheetId, 'Facility Summary', facilitySummaryRows);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return NextResponse.json({
      success: true,
      message: `Pushed ${members.length} members, ${zones.length} zones, ${checkIns.length} check-ins, ${zones.length} zone summaries to Google Sheets`,
      url: sheetUrl,
    });
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
