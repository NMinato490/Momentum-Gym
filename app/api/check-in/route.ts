import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('check_ins')
      .select('*', { count: 'exact' })
      .order('check_in_time', { ascending: false });

    if (activeOnly) {
      query = query.is('check_out_time', null);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data: logs, count: total, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({ success: true, data: logs || [], total: total || 0, page, limit });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { member_id, zone_id, action, first_name, last_name } = body;

    if (action === 'check_in') {
      const logId = `L${Date.now()}`;
      const { error } = await supabase.from('check_ins').insert({
        log_id: logId,
        member_id,
        first_name: first_name || 'Unknown',
        last_name: last_name || 'User',
        zone_name: zone_id,
        check_in_time: new Date().toISOString(),
        check_out_time: null,
        duration_minutes: null,
      });

      if (error) throw error;
      return NextResponse.json({ success: true, message: `${first_name} ${last_name} checked in to ${zone_id}` });
    } else {
      const { data, error: findError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('member_id', member_id)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (findError || !data) {
        return NextResponse.json({ success: false, error: 'No active check-in found for this member' }, { status: 404 });
      }

      const checkInTime = new Date(data.check_in_time);
      const checkOutTime = new Date();
      const durationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000);

      const { error: updateError } = await supabase
        .from('check_ins')
        .update({ check_out_time: checkOutTime.toISOString(), duration_minutes: durationMinutes })
        .eq('log_id', data.log_id);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, message: `${first_name} ${last_name} checked out (${durationMinutes} min)` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
