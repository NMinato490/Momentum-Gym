import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'scripts', 'sync-to-sheets.py');
    const content = fs.readFileSync(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch {
    return new NextResponse('# Python script not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
