export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  summary: string | null;
  tags: string[] | null;
  created_at: Date | string;
}

export interface BookmarkInput {
  title: string;
  url: string;
}

export interface RealtimeBookmarkEvent {
  type: 'bookmark_added' | 'bookmark_deleted';
  bookmark: Bookmark;
}
