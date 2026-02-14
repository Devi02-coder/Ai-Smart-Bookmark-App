import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // 1. Create an initial response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Initialize Supabase with proper Next.js 16 cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies for the current execution
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          
          // Refresh the response object with the updated request
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set the cookies on the final response going to the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. IMPORTANT: Get the user. 
  // This triggers the 'setAll' function above if the session needs refreshing.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 🛡️ Protected routes: If not logged in and trying to access dashboard
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 🚀 Auth routes: If logged in and trying to access home page
  if (user && request.nextUrl.pathname === '/') {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};