import { createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    const { error } = await supabase
      .from('members')
      .update({ is_active: false })
      .eq('member_id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Member deactivated' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
