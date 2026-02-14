import { createBrowserClient } from '@supabase/ssr';

// Use a simple let variable to cache the client instance
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // If we already have a client, return it immediately
  if (client) return client;

  // Next.js static replacement: It's best to use these directly 
  // in the createBrowserClient call or assign them clearly like this:
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Initialize the client
  client = createBrowserClient(url, anonKey);

  return client;
}