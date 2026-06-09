import { syncSupabaseToMysql } from '@/lib/sync-mysql';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await syncSupabaseToMysql();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('MySQL push error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
