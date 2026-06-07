import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Active members count
    const { count: activeMembers, error: membersErr } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (membersErr) throw membersErr;

    // New customers today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: newToday, error: newTodayErr } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('join_date', todayStart.toISOString());

    if (newTodayErr) throw newTodayErr;

    // Total member count
    const { count: totalMembers, error: totalErr } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (totalErr) throw totalErr;

    // Active check-ins (not checked out)
    const { count: activeCheckIns, error: activeCIErr } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .is('check_out_time', null);

    if (activeCIErr) throw activeCIErr;

    // Active check-ins per zone for summary
    const { data: activeCheckInsData, error: checkInsErr } = await supabase
      .from('check_ins')
      .select('zone_name')
      .is('check_out_time', null);

    if (checkInsErr) throw checkInsErr;

    const zoneCounts: Record<string, number> = {};
    (activeCheckInsData || []).forEach((row: { zone_name: string }) => {
      zoneCounts[row.zone_name] = (zoneCounts[row.zone_name] || 0) + 1;
    });

    const { data: zones, error: zonesErr } = await supabase
      .from('zones')
      .select('*')
      .order('zone_id');

    if (zonesErr) throw zonesErr;

    const summary = (zones || []).map((zone: { zone_id: number; zone_name: string; capacity: number }) => {
      const active = zoneCounts[zone.zone_name] || 0;
      const occupancy = zone.capacity > 0 ? Math.round((active / zone.capacity) * 100) : 0;
      const density_status = occupancy >= 80 ? 'Critical' : occupancy >= 60 ? 'Warning' : 'Healthy';
      return {
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        capacity: zone.capacity,
        active_members: active,
        occupancy_percentage: occupancy,
        density_status,
        total_equipment: zone.capacity,
        equipment_in_use: Math.min(active, zone.capacity),
      };
    });

    const totalCapacity = summary.reduce((acc: number, z: { capacity: number }) => acc + z.capacity, 0);

    // Peak hours: aggregate today's check-ins by hour
    const { data: todayCheckIns, error: todayErr } = await supabase
      .from('check_ins')
      .select('check_in_time')
      .gte('check_in_time', todayStart.toISOString());

    if (todayErr) throw todayErr;

    const hourBuckets: Record<number, number> = {};
    for (let h = 6; h <= 22; h++) hourBuckets[h] = 0;

    (todayCheckIns || []).forEach((row: { check_in_time: string }) => {
      const hour = new Date(row.check_in_time).getHours();
      if (hourBuckets[hour] !== undefined) hourBuckets[hour]++;
    });

    const peakHours = Array.from({ length: 17 }, (_, i) => i + 6).map(hour => ({
      hour,
      check_ins: hourBuckets[hour] || 0,
    }));

    // Trends: compare this month to last month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { count: thisMonthCheckins } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .gte('check_in_time', monthStart.toISOString());

    const { count: prevMonthCheckins } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .gte('check_in_time', prevMonthStart.toISOString())
      .lt('check_in_time', monthStart.toISOString());

    const activeTrend = prevMonthCheckins && prevMonthCheckins > 0
      ? (((thisMonthCheckins || 0) - prevMonthCheckins) / prevMonthCheckins * 100).toFixed(1)
      : '0';

    const { count: thisMonthMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('join_date', monthStart.toISOString());

    const { count: prevMonthMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('join_date', prevMonthStart.toISOString())
      .lt('join_date', monthStart.toISOString());

    const membersTrend = prevMonthMembers && prevMonthMembers > 0
      ? (((thisMonthMembers || 0) - prevMonthMembers) / prevMonthMembers * 100).toFixed(1)
      : '0';

    // Recent members (last 5)
    const { data: recentMembers } = await supabase
      .from('members')
      .select('first_name, last_name')
      .order('join_date', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        activeMembers: activeMembers || 0,
        totalMembers: totalMembers || 0,
        totalCapacity,
        activeCheckIns: activeCheckIns || 0,
        newToday: newToday || 0,
        peakHours,
        trends: {
          customers: `${membersTrend.startsWith('-') ? '' : '+'}${membersTrend}%`,
          capacity: `${activeTrend.startsWith('-') ? '' : '+'}${activeTrend}%`,
        },
        recentMembers: (recentMembers || []).map((m: { first_name: string; last_name: string }) =>
          `${m.first_name} ${m.last_name}`
        ),
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
