import { NextResponse } from 'next/server';

// Database initialization is handled via Supabase migration SQL
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Using Supabase — run scripts/migration.sql in Supabase SQL Editor' 
  });
}
