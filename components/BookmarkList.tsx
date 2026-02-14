'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bookmark } from '@/lib/types';
import { deleteBookmark, getAllTags } from '@/app/actions/bookmarkActions';

interface BookmarkListProps {
  initialBookmarks: Bookmark[];
  userId: string;
}

export function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(
    Array.isArray(initialBookmarks) ? initialBookmarks : []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  /* ---------------- LOAD TAGS ---------------- */
  useEffect(() => {
    getAllTags().then((tags) => {
      if (Array.isArray(tags)) setAllTags(tags);
    });
  }, [bookmarks]);

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`bookmarks:${userId}`)
      // ✅ FIX: Added : any to the payload destructured arguments
      .on('broadcast', { event: 'bookmark_added' }, ({ payload }: { payload: any }) => {
        if (!payload?.id) return;

        setBookmarks((prev) => [
          payload,
          ...prev.filter((b) => b?.id !== payload.id),
        ]);
      })
      // ✅ FIX: Added : any to the payload destructured arguments
      .on('broadcast', { event: 'bookmark_deleted' }, ({ payload }: { payload: any }) => {
        if (!payload?.id) return;

        setBookmarks((prev) => prev.filter((b) => b?.id !== payload.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (bookmarkId: string) => {
    setDeleting(bookmarkId);
    try {
      await deleteBookmark(bookmarkId);
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    } finally {
      setDeleting(null);
    }
  };

  /* ---------------- SAFE FILTERING ---------------- */
  const filteredBookmarks = bookmarks
    .filter(
      (b): b is Bookmark =>
        Boolean(b && b.id && b.title && b.url)
    )
    .filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !selectedTag || b.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by title or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h2 className="text-xl font-semibold">
        Your Bookmarks ({filteredBookmarks.length})
      </h2>

      {filteredBookmarks.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No bookmarks found
        </p>
      ) : (
        <div className="grid gap-4">
          {filteredBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-white rounded-xl p-6 border">
              <div className="flex justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {bookmark.title}
                  </h3>

                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm break-all"
                  >
                    {bookmark.url}
                  </a>

                  {bookmark.summary && (
                    <p className="mt-2 text-sm text-gray-600">
                      {bookmark.summary}
                    </p>
                  )}

                  {(bookmark.tags ?? []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {bookmark.tags?.map((tag) => (
                        <span
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(bookmark.id)}
                  disabled={deleting === bookmark.id}
                  className="text-red-600 disabled:opacity-50"
                >
                  {deleting === bookmark.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}