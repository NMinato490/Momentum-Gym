require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const accounts = [
  { email: 'nminato490@momentumgym.com' },
  { email: 'john.christian@momentumgym.com' },
  { email: 'kennard.lopez@momentumgym.com' },
  { email: 'john.krsna@momentumgym.com' },
];

const PASSWORD = 'Admin123!';

async function main() {
  console.log('Resetting passwords...\n');

  for (const acct of accounts) {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) { console.log(`Error listing users: ${error.message}`); return; }

    const user = data.users.find(u => u.email === acct.email);
    if (!user) {
      console.log(`  ${acct.email} not found in auth`);
      continue;
    }

    const { error: resetErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
    });

    if (resetErr) {
      console.log(`  ${acct.email}: ${resetErr.message}`);
    } else {
      console.log(`  ${acct.email} -> password: ${PASSWORD}`);
    }
  }

  console.log('\nDone. Login with password: Admin123!');
}

main().catch(console.error);
