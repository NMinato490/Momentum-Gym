import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { zone_name, capacity, description } = await request.json();
    if (!zone_name || !capacity) {
      return NextResponse.json({ success: false, error: 'Zone name and capacity are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('zones')
      .insert({ zone_name, capacity: parseInt(capacity), description: description || '' })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('duplicate key')) {
        return NextResponse.json({ success: false, error: 'Zone name already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, zone: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { zone_name } = await request.json();
    if (!zone_name) {
      return NextResponse.json({ success: false, error: 'Zone name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('zones').delete().eq('zone_name', zone_name);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { zone_id, zone_name, capacity, description } = await request.json();
    if (!zone_id || !zone_name || !capacity) {
      return NextResponse.json({ success: false, error: 'Zone ID, name, and capacity are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('zones')
      .update({ zone_name, capacity: parseInt(capacity, 10), description: description || '' })
      .eq('zone_id', zone_id)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('duplicate key')) {
        return NextResponse.json({ success: false, error: 'Zone name already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, zone: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
