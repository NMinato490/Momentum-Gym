import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: zones, error: zonesErr } = await supabase
      .from('zones')
      .select('*')
      .order('zone_id');

    if (zonesErr) throw zonesErr;

    const enrichedZones = await Promise.all(
      (zones || []).map(async (zone: { zone_id: number; zone_name: string; capacity: number; description: string }) => {
        const { count, error: countErr } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('zone_name', zone.zone_name)
          .is('check_out_time', null);

        if (countErr) throw countErr;

        return {
          zone_id: zone.zone_id,
          zone_name: zone.zone_name,
          capacity: zone.capacity,
          description: zone.description,
          active_count: count || 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedZones });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
