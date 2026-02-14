import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // Exchange the temporary code for a permanent session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // ✅ SUCCESS: Construct an absolute URL to ensure we stay on HTTPS
      const forwardTo = new URL(next, origin);
      return NextResponse.redirect(forwardTo);
    }

    // ❌ Log the actual Supabase error to your Vercel Logs
    console.error('Supabase Auth Error:', error.message);
  }

  // 🛡️ FAILURE: Return to home with a clean URL and error param
  const errorUrl = new URL('/', origin);
  errorUrl.searchParams.set('error', 'auth_exchange_failed');
  return NextResponse.redirect(errorUrl);
}