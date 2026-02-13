import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getBookmarks } from '@/app/actions/bookmarkActions';
import { AddBookmarkForm } from '@/components/AddBookmarkForm';
import { BookmarkList } from '@/components/BookmarkList';
import { LogoutButton } from '@/components/AuthButtons';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔐 Protect route
  if (!user) {
    redirect('/');
  }

  // 📌 Load bookmarks
  const bookmarks = await getBookmarks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Smart Bookmarks
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.email}
                </p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Bookmark */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <AddBookmarkForm />
            </div>
          </div>

          {/* Bookmark List */}
          <div className="lg:col-span-2">
            <BookmarkList
              initialBookmarks={bookmarks}
              userId={user.id}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            AI Smart Bookmark Manager • Built with Next.js, Supabase, and MySQL
          </p>
          <p className="mt-2">
            Real-time sync powered by Supabase Realtime
          </p>
        </div>
      </footer>
    </div>
  );
}
