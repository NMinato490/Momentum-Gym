import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('admin_status')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, is_active } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('admin_status')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('admin_status')
        .update({ is_active, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', user_id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('admin_status')
        .insert({ user_id, is_active, last_seen_at: new Date().toISOString() });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('admin_status')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('admin_status')
        .update({ last_seen_at: now, updated_at: now })
        .eq('user_id', user_id);
    } else {
      await supabase
        .from('admin_status')
        .insert({ user_id, is_active: true, last_seen_at: now });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
