export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  summary: string | null;
  /** * tags are stored as JSONB in Supabase. 
   * We default to an empty array to prevent .map() errors in the UI.
   */
  tags: string[] | null; 
  /**
   * Supabase returns dates as ISO strings (e.g., "2024-02-14T...")
   */
  created_at: string; 
}

export interface BookmarkInput {
  title: string;
  url: string;
}

/**
 * Matches the payload structure for Supabase Realtime broadcasts
 */
export interface RealtimeBookmarkEvent {
  event: 'bookmark_added' | 'bookmark_deleted';
  payload: Bookmark;
}