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

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/* ---------------- REALTIME BROADCAST ---------------- */
async function broadcastBookmarkEvent(
  userId: string,
  event: 'bookmark_added' | 'bookmark_deleted',
  bookmark: Bookmark
) {
  // Use Service Role key for server-side broadcasting to bypass RLS for the broadcast
  const supabase = createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.channel(`bookmarks:${userId}`).send({
    type: 'broadcast',
    event,
    payload: bookmark,
  });
}

/* ---------------- GET BOOKMARKS ---------------- */
export async function getBookmarks(searchQuery?: string, tagFilter?: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id);

    if (searchQuery?.trim()) {
      // Postgres ILIKE for case-insensitive search
      query = query.or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`);
    }

    if (tagFilter?.trim()) {
      // jsonb_contains equivalent for tags array
      query = query.contains('tags', [tagFilter]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Bookmark[];
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

  // AI GENERATION (Wrapped in try/catch so failure doesn't stop the save)
  let aiData = { summary: '', tags: [] as string[] };
  try {
    aiData = await generateAIData(input.url, input.title);
  } catch (aiErr) {
    console.warn('AI Processing failed, saving without AI data:', aiErr);
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([
      {
        user_id: user.id,
        title: input.title,
        url: input.url,
        summary: aiData.summary || '',
        tags: aiData.tags || [],
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  const newBookmark = data as Bookmark;

  // Trigger realtime update for other tabs
  await broadcastBookmarkEvent(user.id, 'bookmark_added', newBookmark);
  
  revalidatePath('/dashboard');
  return newBookmark;
}

/* ---------------- DELETE BOOKMARK ---------------- */
export async function deleteBookmark(bookmarkId: string) {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // 1. Fetch data for broadcast before it's gone
  const { data: bookmark, error: fetchError } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !bookmark) {
    throw new Error('Bookmark not found or unauthorized');
  }

  // 2. Perform deletion
  const { error: deleteError } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', user.id);

  if (deleteError) throw new Error(deleteError.message);

  // 3. Broadcast to other tabs
  await broadcastBookmarkEvent(user.id, 'bookmark_deleted', bookmark as Bookmark);
  
  revalidatePath('/dashboard');
  return { success: true };
}

/* ---------------- GET ALL TAGS ---------------- */
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
    data.forEach((row) => {
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