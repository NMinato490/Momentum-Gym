import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const membershipType = searchParams.get('membership_type') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'join_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    let query = supabase
      .from('members')
      .select('*', { count: 'exact' });

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    if (membershipType) {
      query = query.eq('membership_type', membershipType);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: members, count: total, error } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({ success: true, data: members || [], total: total || 0, page, limit });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { first_name, last_name, email, phone, membership_type } = body;

    const memberId = `M${Date.now()}`;
    const newMember = {
      member_id: memberId,
      first_name,
      last_name,
      email,
      phone,
      membership_type: membership_type || 'basic',
      is_active: true,
      join_date: new Date().toISOString(),
    };

    const { error } = await supabase.from('members').insert(newMember);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Member added' }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
