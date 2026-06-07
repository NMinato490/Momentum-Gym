import { createAdminClient } from '@/lib/supabase-server';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

function getAuth() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKeyB64 = process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64;

  if (!clientEmail || !privateKeyB64) {
    throw new Error('Google Sheets credentials not configured');
  }

  const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf-8');

  return new google.auth.JWT({
    email: clientEmail,
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

  return { memberRows, zoneRows, checkInRows };
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

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'Momentum-Gym' },
        sheets: [
          { properties: { title: 'Members' } },
          { properties: { title: 'Zones' } },
          { properties: { title: 'Check-Ins' } },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    const { memberRows, zoneRows, checkInRows } = rowsFromData(members, checkIns, zones);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Members!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: memberRows },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Zones!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: zoneRows },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Check-Ins!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: checkInRows },
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return NextResponse.json({
      success: true,
      message: `Pushed ${members.length} members, ${zones.length} zones, ${checkIns.length} check-ins to Google Sheets`,
      url: sheetUrl,
    });
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    const msg = error.message || '';
    const hint = msg.includes('permission')
      ? 'Enable the Google Sheets API in Google Cloud Console (APIs & Services > Library > Google Sheets API), then ensure the service account has permission.'
      : msg;
    return NextResponse.json({ success: false, error: hint }, { status: 500 });
  }
}
