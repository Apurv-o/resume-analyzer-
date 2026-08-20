import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Shared session-refresh logic used by the root middleware. Called for every
// matched request so Supabase can refresh the user's tokens before they expire.
export async function updateSession(request) {
  // Start from an unmodified response so we can layer refreshed cookies on top.
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: don't run any code between createServerClient and
  // supabase.auth.getUser() — it's what triggers the token refresh.
  const { data: { user } } = await supabase.auth.getUser();

  // No protected routes yet, so we never redirect. Just forward the (possibly
  // refreshed) response.
  return supabaseResponse;
}