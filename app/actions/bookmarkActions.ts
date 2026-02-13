'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { query } from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark, BookmarkInput } from '@/lib/types';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { generateAIData } from '@/lib/ai';

/* ---------------- SAFE JSON PARSER ---------------- */
function safeParseTags(tags: any): string[] {
  if (!tags) return [];
  try {
    const parsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  const supabase = createBrowserClient(
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
  const user = await getAuthenticatedUser();

  let sql = 'SELECT * FROM bookmarks WHERE user_id = ?';
  const params: any[] = [user.id];

  if (searchQuery?.trim()) {
    sql += ' AND (title LIKE ? OR url LIKE ?)';
    const pattern = `%${searchQuery}%`;
    params.push(pattern, pattern);
  }

  if (tagFilter?.trim()) {
    sql += ' AND JSON_CONTAINS(tags, ?)';
    params.push(JSON.stringify([tagFilter]));
  }

  sql += ' ORDER BY created_at DESC';

  const bookmarks = await query<Bookmark[]>(sql, params);

  return bookmarks.map((b) => ({
    ...b,
    tags: safeParseTags(b.tags),
  }));
}

/* ---------------- ADD BOOKMARK (AI + DB IN SAME PLACE) ---------------- */
export async function addBookmark(input: BookmarkInput) {
  const user = await getAuthenticatedUser();

  if (!input.title || !input.url) {
    throw new Error('Title and URL are required');
  }

  try {
    new URL(input.url);
  } catch {
    throw new Error('Invalid URL format');
  }

  const bookmarkId = uuidv4();

  // ✅ AI GENERATION (HERE)
  const aiData = await generateAIData(input.url, input.title);

  // ✅ DATABASE INSERT (HERE)
  await query(
    'INSERT INTO bookmarks (id, user_id, title, url, summary, tags) VALUES (?, ?, ?, ?, ?, ?)',
    [
      bookmarkId,
      user.id,
      input.title,
      input.url,
      aiData.summary,
      JSON.stringify(aiData.tags ?? []),
    ]
  );

  const [bookmark] = await query<Bookmark[]>(
    'SELECT * FROM bookmarks WHERE id = ?',
    [bookmarkId]
  );

  const bookmarkWithParsedTags = {
    ...bookmark,
    tags: safeParseTags(bookmark.tags),
  };

  await broadcastBookmarkEvent(user.id, 'bookmark_added', bookmarkWithParsedTags);
  revalidatePath('/dashboard');

  return bookmarkWithParsedTags;
}

/* ---------------- DELETE BOOKMARK ---------------- */
export async function deleteBookmark(bookmarkId: string) {
  const user = await getAuthenticatedUser();

  const [bookmark] = await query<Bookmark[]>(
    'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?',
    [bookmarkId, user.id]
  );

  if (!bookmark) {
    throw new Error('Bookmark not found or unauthorized');
  }

  await query(
    'DELETE FROM bookmarks WHERE id = ? AND user_id = ?',
    [bookmarkId, user.id]
  );

  const bookmarkWithParsedTags = {
    ...bookmark,
    tags: safeParseTags(bookmark.tags),
  };

  await broadcastBookmarkEvent(user.id, 'bookmark_deleted', bookmarkWithParsedTags);
  revalidatePath('/dashboard');

  return { success: true };
}

/* ---------------- GET ALL TAGS ---------------- */
export async function getAllTags() {
  const user = await getAuthenticatedUser();

  const bookmarks = await query<Bookmark[]>(
    'SELECT tags FROM bookmarks WHERE user_id = ? AND tags IS NOT NULL',
    [user.id]
  );

  const allTags = new Set<string>();

  bookmarks.forEach((b) =>
    safeParseTags(b.tags).forEach((t) => allTags.add(t))
  );

  return Array.from(allTags).sort();
}
