require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');

const PASSWORD = process.env.SUPABASE_DB_PASSWORD;

const SQL = `
CREATE TABLE IF NOT EXISTS public.members (
  member_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  membership_type TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT TRUE,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.check_ins (
  log_id TEXT PRIMARY KEY,
  member_id TEXT REFERENCES members(member_id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  zone_name TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.zones (
  zone_id SERIAL PRIMARY KEY,
  zone_name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  description TEXT
);
INSERT INTO public.zones (zone_name, capacity, description) VALUES
  ('Cardio Zone', 50, 'Treadmills, bikes, ellipticals'),
  ('Weights Area', 40, 'Free weights and machines'),
  ('Swimming Pool', 30, 'Olympic-size pool'),
  ('Studio 1', 25, 'Group fitness classes'),
  ('CrossFit Rig', 20, 'Functional fitness area')
ON CONFLICT (zone_name) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_zone_name ON check_ins(zone_name);
CREATE INDEX IF NOT EXISTS idx_check_ins_check_in_time ON check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_check_ins_check_out_time ON check_ins(check_out_time);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
`;

const configs = [
  // Pooled connection (PgBouncer)
  { connectionString: `postgresql://postgres:${encodeURIComponent(PASSWORD)}@zjmkzmbessxxdvqugwvb.supabase.co:5432/postgres` },
  // Direct connection
  { connectionString: `postgresql://postgres:${encodeURIComponent(PASSWORD)}@zjmkzmbessxxdvqugwvb.supabase.co:6543/postgres` },
  // Session pooler
  { connectionString: `postgresql://postgres.zjmkzmbessxxdvqugwvb:${encodeURIComponent(PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:5432/postgres` },
  // With project ref as user (session mode)
  { connectionString: `postgresql://postgres.zjmkzmbessxxdvqugwvb:${encodeURIComponent(PASSWORD)}@zjmkzmbessxxdvqugwvb.supabase.co:5432/postgres` },
];

async function tryConnection(config) {
  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    const client = await pool.connect();
    console.log(`  Connected via ${config.connectionString.slice(0, 60)}...`);
    await client.query(SQL);
    console.log('  Migration successful!');
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    const msg = err.message?.split('\n')[0]?.slice(0, 80) || String(err);
    await pool.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log('Trying database connections...\n');

  for (const config of configs) {
    console.log(`Trying...`);
    const ok = await tryConnection(config);
    if (ok) return;
  }

  console.log('\nCould not connect. Please run scripts/migration.sql in Supabase SQL Editor.');
  console.log('URL: https://app.supabase.com/project/zjmkzmbessxxdvqugwvb/sql/new');
}

main().catch(console.error);
