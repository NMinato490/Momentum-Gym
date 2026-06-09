import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

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

    // Peak hours: aggregate check-ins by hour over the selected range
    const rangeStart = new Date();
    if (range === 'month') {
      rangeStart.setDate(1);
      rangeStart.setHours(0, 0, 0, 0);
    } else if (range === '30d') {
      rangeStart.setDate(rangeStart.getDate() - 30);
      rangeStart.setHours(0, 0, 0, 0);
    } else if (range === '1y') {
      rangeStart.setMonth(0, 1); // January 1st of current year
      rangeStart.setHours(0, 0, 0, 0);
    } else {
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeStart.setHours(0, 0, 0, 0);
    }

    const { data: rangeCheckIns, error: rangeErr } = await supabase
      .from('check_ins')
      .select('check_in_time')
      .gte('check_in_time', rangeStart.toISOString());

    if (rangeErr) throw rangeErr;

    const trendData: any[] = [];
    if (range === '7d' || range === '30d' || range === 'month') {
      const days = range === 'month' ? new Date().getDate() : (range === '30d' ? 30 : 7);
      
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = range === '7d' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.getDate().toString();
        // Use local timezone string to match dates accurately
        const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        trendData.push({ label, check_ins: 0, dateStr: localDateStr });
      }

      (rangeCheckIns || []).forEach((row: { check_in_time: string }) => {
        const d = new Date(row.check_in_time);
        const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const bucket = trendData.find(t => t.dateStr === localDateStr);
        if (bucket) bucket.check_ins++;
      });
    } else if (range === '1y') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < new Date().getMonth() + 1; i++) {
        trendData.push({ label: months[i], check_ins: 0, monthIdx: i });
      }
      (rangeCheckIns || []).forEach((row: { check_in_time: string }) => {
        const m = new Date(row.check_in_time).getMonth();
        const bucket = trendData.find(t => t.monthIdx === m);
        if (bucket) bucket.check_ins++;
      });
    }

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
        trendData,
        totalCheckIns: rangeCheckIns?.length || 0,
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
