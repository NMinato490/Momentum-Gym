import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, action, ip_address, user_agent, metadata } = body;

    if (!email || !action) {
      return NextResponse.json({ success: false, error: 'email and action are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('login_logs').insert({
      user_id: user_id || null,
      email,
      action,
      ip_address: ip_address || request.headers.get('x-forwarded-for') || '',
      user_agent: user_agent || request.headers.get('user-agent') || '',
      metadata: metadata || {},
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const email = request.nextUrl.searchParams.get('email');
    const action = request.nextUrl.searchParams.get('action');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const supabase = createAdminClient();
    let query = supabase.from('login_logs').select('*', { count: 'exact' });

    if (userId) query = query.eq('user_id', userId);
    if (email) query = query.eq('email', email);
    if (action) query = query.eq('action', action);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [], count, limit, offset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
