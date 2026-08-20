import { updateSession } from './utils/supabase/middleware';

export async function middleware(request) {
  // Every matched request goes through session refresh.
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static / _next/image (static assets)
     * - image/svg, png, jpg, jpeg, gif, webp files
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};