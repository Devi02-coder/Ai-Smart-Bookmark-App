/**
 * Core Bookmark interface matching the Supabase 'bookmarks' table
 */
export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  summary: string | null;
  /** * tags are stored as JSONB in Supabase. 
   * Always handle as (tags || []) in the UI to prevent crashes.
   */
  tags: string[] | null; 
  /**
   * Supabase returns dates as ISO strings
   */
  created_at: string; 
}

/**
 * Data required to create a new bookmark
 */
export interface BookmarkInput {
  title: string;
  url: string;
}

/**
 * Matches the payload structure for Supabase Realtime 'broadcast' events.
 * Use this in BookmarkList.tsx to type the 'on broadcast' listener.
 */
export interface RealtimeBookmarkEvent {
  event: 'bookmark_added' | 'bookmark_deleted';
  payload: Bookmark;
}