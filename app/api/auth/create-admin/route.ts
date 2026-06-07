import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < 14; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, role } = body;

    if (!email || !first_name) {
      return NextResponse.json({ success: false, error: 'Email and first name are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const password = generatePassword();
    const displayName = `${first_name} ${last_name || ''}`.trim();
    const memberId = `M${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const userRole = role || 'admin';

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, role: userRole },
    });

    if (authErr) {
      if (authErr.message?.includes('already been registered')) {
        return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
      }
      throw authErr;
    }

    const { error: memberErr } = await supabase.from('members').insert({
      member_id: memberId,
      first_name,
      last_name: last_name || '',
      email,
      phone: '',
      membership_type: 'vip',
      is_active: true,
      join_date: new Date().toISOString(),
    });

    if (memberErr) {
      console.error('Member insert error:', memberErr);
    }

    return NextResponse.json({
      success: true,
      account: {
        email,
        displayName,
        role: userRole,
        password,
      },
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
