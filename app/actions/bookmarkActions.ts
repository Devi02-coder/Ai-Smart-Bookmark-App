'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Bookmark, BookmarkInput } from '@/lib/types';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { generateAIData } from '@/lib/ai';

/* ---------------- AUTH HELPER ---------------- */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user;
}

/* ---------------- ADD BOOKMARK ---------------- */
export async function addBookmark(input: BookmarkInput) {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  if (!input.title || !input.url) {
    throw new Error('Title and URL are required');
  }

  // 🤖 AI DATA GENERATION
  let aiData = { 
    summary: 'Processing AI summary...', // Default placeholder
    tags: [] as string[] 
  };

  try {
    const generated = await generateAIData(input.url, input.title);
    if (generated) {
      aiData = {
        summary: generated.summary || 'No summary available from AI.',
        tags: generated.tags || []
      };
    }
  } catch (aiErr) {
    console.error('AI Error:', aiErr);
    aiData.summary = 'AI failed to generate a summary.';
  }

  // 💾 DATABASE INSERT
  const { data, error } = await supabase
    .from('bookmarks')
    .insert([
      {
        user_id: user.id,
        title: input.title,
        url: input.url,
        summary: aiData.summary, // Ensuring this matches the column name
        tags: aiData.tags,       // Ensuring this matches the column name
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error.message);
    throw new Error(error.message);
  }

  const newBookmark = data as Bookmark;

  // 📢 BROADCAST (Realtime)
  const serviceClient = createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  await serviceClient.channel(`bookmarks:${user.id}`).send({
    type: 'broadcast',
    event: 'bookmark_added',
    payload: newBookmark,
  });

  revalidatePath('/dashboard');
  return newBookmark;
}

// ... include your getBookmarks and deleteBookmark functions as previously fixed