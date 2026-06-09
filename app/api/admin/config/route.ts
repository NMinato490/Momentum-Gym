import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const key = request.nextUrl.searchParams.get('key');

    const supabase = createAdminClient();
    let query = supabase.from('config_settings').select('*');

    if (key) {
      query = query.eq('key', key);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query.order('key');

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, user_id } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'key and value are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('config_settings')
      .select('id')
      .eq('key', key)
      .eq('user_id', user_id || null)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('config_settings')
        .update({ value: typeof value === 'string' ? value : JSON.stringify(value), updated_at: now })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('config_settings')
        .insert({ key, value: typeof value === 'string' ? value : JSON.stringify(value), user_id: user_id || null });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, user_id } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'key is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let query = supabase.from('config_settings').delete().eq('key', key);

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else {
      query = query.is('user_id', null);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
