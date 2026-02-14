import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Get the URL details from the request
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // 2. Determine where to go next (default to /dashboard)
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // 3. Initialize the Supabase client
    const supabase = await createClient();
    
    // 4. Exchange the temporary 'code' for a real user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      /**
       * ✅ SUCCESS: Redirect to the intended page.
       * We use 'origin' to ensure the browser stays on your Vercel domain.
       */
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  /**
   * ❌ FAILURE: If there's no code or an exchange error, 
   * send the user back to the home page or an error route.
   */
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}