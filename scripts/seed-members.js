require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const members = [
  { email: 'nminato490@momentumgym.com', first_name: 'Nminato490', last_name: '-' },
  { email: 'john.christian@momentumgym.com', first_name: 'John', last_name: 'Christian' },
  { email: 'kennard.lopez@momentumgym.com', first_name: 'Kennard', last_name: 'Lopez' },
  { email: 'john.krsna@momentumgym.com', first_name: 'John', last_name: 'Krsna' },
];

async function main() {
  console.log('Seeding members table...\n');

  for (const m of members) {
    const memberId = `M${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const { data: existing } = await supabase
      .from('members')
      .select('member_id')
      .eq('email', m.email)
      .maybeSingle();

    if (existing) {
      console.log(`  ${m.email} already in members table`);
      continue;
    }

    const { error } = await supabase.from('members').insert({
      member_id: memberId,
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email,
      phone: '555-0000',
      membership_type: 'vip',
      is_active: true,
      join_date: new Date().toISOString(),
    });

    if (error) {
      console.log(`  ${m.email}: ${error.message}`);
    } else {
      console.log(`  ${m.email} added to members (${m.first_name} ${m.last_name})`);
    }
  }

  console.log('\nDone.');
}

main().catch(console.error);
