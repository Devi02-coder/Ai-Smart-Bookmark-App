'use client';

import { createClient } from '@/lib/supabase/client';

export function LoginButton() {
  const handleLogin = async (e: React.MouseEvent) => {
    // 1. Force the browser to treat this as a definitive human action
    e.preventDefault();
    
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account', // Forces Google to show the account picker
          access_type: 'offline',
        },
      },
    });

    if (error) {
      console.error("Supabase Auth Error:", error.message);
      return;
    }

    // 2. The "Magic Link" Fix
    // If the browser is blocking the automatic redirect, we force it here:
    if (data?.url) {
      window.location.assign(data.url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {/* ... (SVG path remains same) ... */}
      Sign in with Google
    </button>
  );
}