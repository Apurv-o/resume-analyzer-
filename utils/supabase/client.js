import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Browser-side client — safe to use in Client Components. Env vars are
// inlined at build time (NEXT_PUBLIC_*), never hardcode them.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}