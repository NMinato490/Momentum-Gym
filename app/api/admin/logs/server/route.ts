import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, source, message, metadata } = body;

    if (!source || !message) {
      return NextResponse.json({ success: false, error: 'source and message are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('server_logs').insert({
      level: level || 'info',
      source,
      message,
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
    const level = request.nextUrl.searchParams.get('level');
    const source = request.nextUrl.searchParams.get('source');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const supabase = createAdminClient();
    let query = supabase.from('server_logs').select('*', { count: 'exact' });

    if (level) query = query.eq('level', level);
    if (source) query = query.eq('source', source);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [], count, limit, offset });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
