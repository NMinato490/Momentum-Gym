import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    const admins = data.users
      .filter((u) => {
        const role = u.user_metadata?.role as string;
        return role === 'admin' || role === 'superadmin';
      })
      .map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.user_metadata?.display_name || u.email?.split('@')[0] || '',
        role: u.user_metadata?.role || 'admin',
        createdAt: u.created_at,
        confirmed: u.email_confirmed_at != null,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, admins });
  } catch (error: any) {
    console.error('List admins error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
