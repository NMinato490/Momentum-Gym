import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

function getGoogleCredsJson(): string {
  const raw = process.env.GOOGLE_SHEETS_PRIVATE_KEY_BASE64;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!raw) throw new Error('Google Sheets credentials not configured');

  const decoded = Buffer.from(raw, 'base64').toString('utf-8');

  if (decoded.trimStart().startsWith('{')) {
    return decoded;
  }

  if (!clientEmail) throw new Error('Google Sheets client email not configured');

  const key = decoded.replace(/\\n/g, '\n');
  return JSON.stringify({
    type: 'service_account',
    private_key: key,
    client_email: clientEmail,
    token_uri: 'https://oauth2.googleapis.com/token',
  });
}

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync-to-sheets.py');

    const credsJson = getGoogleCredsJson();

    const { stdout, stderr } = await execFileAsync(PYTHON_PATH, [scriptPath], {
      env: {
        ...process.env,
        DB_HOST: process.env.DB_HOST || '127.0.0.1',
        DB_PORT: process.env.DB_PORT || '3306',
        DB_USER: process.env.DB_USER || 'root',
        DB_PASSWORD: process.env.DB_PASSWORD || '',
        GOOGLE_SHEETS_CREDENTIALS: credsJson,
        GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
      },
      timeout: 60000,
    });

    const urlMatch = stdout.match(/RESULT_URL=(\S+)/);
    const spreadsheetUrl = urlMatch ? urlMatch[1] : null;

    const lines = stdout.split('\n').filter(l => !l.startsWith('RESULT_URL='));

    return NextResponse.json({
      success: true,
      log: lines.join('\n'),
      url: spreadsheetUrl,
      stderr: stderr || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      log: error.stdout || '',
      error: error.stderr || error.message || 'Unknown error',
    }, { status: 500 });
  }
}
