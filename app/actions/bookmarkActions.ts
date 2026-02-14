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

/* ---------------- BROADCAST HELPER ---------------- */
async function broadcastEvent(userId: string, event: string, payload: any) {
  const serviceClient = createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  await serviceClient.channel(`bookmarks:${userId}`).send({
    type: 'broadcast',
    event,
    payload,
  });
}

/* ---------------- GET ALL BOOKMARKS ---------------- */
export async function getBookmarks(searchQuery?: string, tagFilter?: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id);

    // Filter by search query (Title or URL)
    if (searchQuery?.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`);
    }

    // Filter by tag (using Postgres JSONB contains logic)
    if (tagFilter?.trim()) {
      query = query.contains('tags', [tagFilter]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Bookmark[]) || [];
  } catch (err) {
    console.error('Get Bookmarks Error:', err);
    return [];
  }
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
    summary: 'Processing AI summary...', 
    tags: [] as string[] 
  };

  try {
    const generated = await generateAIData(input.url, input.title);
    if (generated) {
      aiData = {
        summary: generated.summary || 'No summary available.',
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
        summary: aiData.summary,
        tags: aiData.tags,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  const newBookmark = data as Bookmark;

  // 📢 REALTIME BROADCAST
  await broadcastEvent(user.id, 'bookmark_added', newBookmark);

  revalidatePath('/dashboard');
  return newBookmark;
}

/* ---------------- DELETE BOOKMARK ---------------- */
export async function deleteBookmark(bookmarkId: string) {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Get data before deleting so we can broadcast the ID to the UI
  const { data: bookmark, error: fetchError } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !bookmark) throw new Error('Bookmark not found');

  const { error: deleteError } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', user.id);

  if (deleteError) throw new Error(deleteError.message);

  // 📢 REALTIME BROADCAST
  await broadcastEvent(user.id, 'bookmark_deleted', bookmark);

  revalidatePath('/dashboard');
  return { success: true };
}

/* ---------------- GET UNIQUE TAGS ---------------- */
export async function getAllTags() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookmarks')
      .select('tags')
      .eq('user_id', user.id);

    if (error) throw error;

    const allTags = new Set<string>();
    data?.forEach((row) => {
      if (Array.isArray(row.tags)) {
        row.tags.forEach((t: string) => allTags.add(t));
      }
    });

    return Array.from(allTags).sort();
  } catch (err) {
    console.error('Get Tags Error:', err);
    return [];
  }
}