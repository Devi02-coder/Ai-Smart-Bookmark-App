import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // 1. Start with a neutral response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Initialize Supabase with Next.js 16 SSR handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request so the rest of the middleware "sees" the new session
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          
          // Re-sync the response so the browser gets the cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. IMPORTANT: This refreshes the session if needed
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 🛡️ AUTH LOGIC: Redirect based on user state
  
  // If no user and trying to access dashboard -> Send to Home
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    // CRITICAL: Copy cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // If user is logged in and visits home -> Send to Dashboard
  if (user && request.nextUrl.pathname === '/') {
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    // CRITICAL: Copy cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and icons
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};