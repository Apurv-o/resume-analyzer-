import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Server-only Supabase client (Route Handlers / Server Components).
//
// Accepts an optional `cookieStore` (from `cookies()`) so callers can pass the
// store explicitly; when omitted it reads the current `cookies()` internally —
// which keeps existing `createClient()` calls working unchanged.
export function createClient(cookieStore) {
  const store = cookieStore ?? cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        // If called from a Server Component this throws — that's fine when
        // middleware refreshes user sessions for us.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}