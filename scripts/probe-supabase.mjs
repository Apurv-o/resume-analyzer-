// Temporary probe: verifies Supabase connectivity and the analyses table.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('URL set:', Boolean(url));
console.log('Key present:', Boolean(key) && key.length > 8);

const supabase = createClient(url, key);

// Try a lightweight read to check connectivity/table existence.
// RLS currently only allows INSERT (no SELECT), so a read may be denied —
// that is expected and fine; the real test is an INSERT.
const { data, error } = await supabase.from('analyses').select('*').limit(1);

console.log('Read result ->', JSON.stringify({ data, error: error && { code: error.code, message: error.message } }));

if (error) {
  // PostgREST reports a missing table with PGRST205; "relation ... does not
  // exist" also shows up occasionally. Both mean: run schema.sql in the editor.
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist/i.test(error.message || '')) {
    console.log('RESULT: analyses table does NOT exist yet. Run supabase/schema.sql in the SQL Editor.');
  } else {
    console.log('RESULT: Connection reached Supabase (read denied is expected; means table exists).');
  }
} else {
  console.log('RESULT: Connection + table OK (read succeeded — note: plan is INSERT-only).');
}
