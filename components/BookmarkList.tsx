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
      .on('broadcast', { event: 'bookmark_added' }, ({ payload }: { payload: any }) => {
        if (!payload?.id) return;
        setBookmarks((prev) => [
          payload,
          ...prev.filter((b) => b?.id !== payload.id),
        ]);
      })
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
    if (!confirm('Are you sure you want to delete this?')) return;
    setDeleting(bookmarkId);
    try {
      await deleteBookmark(bookmarkId);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(null);
    }
  };

  /* ---------------- SAFE FILTERING ---------------- */
  const filteredBookmarks = bookmarks
    .filter((b): b is Bookmark => Boolean(b && b.id))
    .filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !selectedTag || (b.tags && b.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800">
        Your Library ({filteredBookmarks.length})
      </h2>

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-500">No bookmarks found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-white rounded-xl p-6 border hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {bookmark.title}
                  </h3>

                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm break-all hover:text-blue-700 transition-colors"
                  >
                    {bookmark.url}
                  </a>

                  {/* ✅ THE SUMMARY FIELD */}
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                    {bookmark.summary || "Generating AI summary..."}
                  </p>

                  {/* ✅ THE TAGS FIELD */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(bookmark.tags || []).length > 0 ? (
                      bookmark.tags?.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedTag === tag 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No tags</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(bookmark.id)}
                  disabled={deleting === bookmark.id}
                  className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                  title="Delete Bookmark"
                >
                  {deleting === bookmark.id ? (
                     <span className="text-xs animate-pulse">...</span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}