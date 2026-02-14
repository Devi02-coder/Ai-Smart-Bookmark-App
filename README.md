# 🔖 AI Smart Bookmark Manager

A production-ready, real-time bookmark manager with AI-powered tagging, Google OAuth authentication, and instant cross-tab synchronization.

## 🚀 Live Demo

**Deployed URL:** [(https://ai-smart-bookmark-app.vercel.app/)]

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Supabase Setup](#supabase-setup)
- [Deployment](#deployment)
- [Problems & Solutions](#problems--solutions)
- [Project Structure](#project-structure)

---

## 🎯 Overview

Smart Bookmark Manager is a full-stack application that allows users to save, organize, and search bookmarks with intelligent features:

- **AI-Powered Tagging**: Automatically categorizes bookmarks with relevant tags
- **Smart Summaries**: Generates brief descriptions for easy reference
- **Real-Time Sync**: Instant updates across all browser tabs using Supabase Realtime
- **Private & Secure**: Each user's bookmarks are completely private
- **Google OAuth**: Seamless authentication without passwords

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

### Backend
- **Next.js Server Actions**
- **MySQL** (Database)
- **Supabase Auth** (Google OAuth)
- **Supabase Realtime** (WebSocket broadcasts)

### Deployment
- **Vercel** (Frontend & API)
- **MySQL Database** (Your choice: PlanetScale, Railway, or local)

---

## ✨ Features

### 🔐 Authentication
- **Google OAuth only** via Supabase Auth
- Persistent sessions across page refreshes
- Automatic redirect to dashboard when logged in

### 📚 Bookmark Management
- Add bookmarks with title and URL
- View all your bookmarks in a clean, organized list
- Delete bookmarks instantly
- Search by title or URL
- Filter by AI-generated tags

### 🤖 AI Intelligence
- **Auto-tagging**: Smart categorization (development, ai, design, etc.)
- **Auto-summaries**: Brief descriptions for quick reference
- **Tag-based filtering**: Organize bookmarks by topic

### ⚡ Real-Time Features
- Instant sync across multiple browser tabs
- No page refresh needed
- Uses Supabase Realtime broadcast channels
- User-specific channels ensure privacy

### 🔒 Security
- User isolation via `user_id` enforcement
- All queries scoped to authenticated user
- Server-side authorization checks
- Environment variables for secrets

---

## 🏗️ Architecture

### Data Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Add/Delete Bookmark
       ▼
┌─────────────────────┐
│  Next.js Server     │
│  (Server Actions)   │
└──────┬──────────────┘
       │
       │ 2. Write to MySQL
       ▼
┌─────────────┐
│    MySQL    │
│  (Source of │
│    Truth)   │
└─────────────┘
       │
       │ 3. Broadcast Event
       ▼
┌─────────────────────┐
│ Supabase Realtime   │
│   (WebSocket)       │
└──────┬──────────────┘
       │
       │ 4. Update UI
       ▼
┌─────────────┐
│  All Tabs   │
│  (Real-time)│
└─────────────┘
```

### Key Principles

1. **MySQL = Source of Truth**: All bookmark data stored in MySQL
2. **Supabase = Auth + Realtime**: Only handles authentication and live updates
3. **Server-side Security**: All queries enforce `user_id` checks
4. **Channel-based Realtime**: Each user has a private channel (`bookmarks:${user_id}`)

---

## 💻 Local Setup

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Supabase account (free tier works)
- Google Cloud Console account

### Installation Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd smart-bookmark-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=2003
MYSQL_DATABASE=bookmark_app

# App URL
NEXT_PUBLIC_SITE_URL=https://ai-smart-bookmark-app.vercel.app
```

4. **Set up the database** (see Database Setup below)

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

---

## 🗄️ Database Setup

### Create Database and Table

1. **Start MySQL**
```bash
mysql -u root -p
```

2. **Run the schema**
```bash
mysql -u root -p < schema.sql
```

Or manually:
```sql
CREATE DATABASE IF NOT EXISTS bookmark_app;
USE bookmark_app;

CREATE TABLE IF NOT EXISTS bookmarks (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Verify Setup
```sql
SHOW TABLES;
DESCRIBE bookmarks;
```

---

## 🔑 Supabase Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready
5. Save your project URL and API keys:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` key (public)
   - `service_role` key (secret)

### 2. Configure Google OAuth

#### In Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth Client ID**
5. Application type: **Web application**
6. Add Authorized Redirect URI:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
7. Save **Client ID** and **Client Secret**

#### In Supabase Dashboard:

1. Go to **Authentication → Providers**
2. Enable **Google**
3. Paste your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Save configuration

### 3. Test Authentication

1. Run your app locally
2. Click "Sign in with Google"
3. You should be redirected to Google login
4. After success, redirected to `/dashboard`

---

## 🚀 Deployment on Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wvroarvlipfmavoiayje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

MYSQL_HOST=your-production-mysql-host
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=bookmark_app

NEXT_PUBLIC_SITE_URL=https:https://ai-smart-bookmark-app.vercel.app
```

5. Click "Deploy"

### 3. Update Google OAuth Redirect

Add your Vercel URL to Google OAuth:
```
https://ai-smart-bookmark-app.vercel.app/auth/callback
```

### 4. Production Database Options

**Option A: PlanetScale (Recommended)**
- Free tier available
- Serverless MySQL
- Works great with Vercel

**Option B: Railway**
- Simple MySQL hosting
- Good free tier

**Option C: Amazon RDS**
- Production-grade
- Paid service

---

## 🐛 Problems & Solutions

### Problem 1: Google OAuth Redirect Errors

**Issue**: "Redirect URI mismatch" error when logging in

**Cause**: Google OAuth redirect URI not matching Supabase callback URL

**Solution**:
1. Double-check the redirect URI in Google Cloud Console
2. Make sure it exactly matches: `https://<project-id>.supabase.co/auth/v1/callback`
3. No trailing slash
4. Use HTTPS (not HTTP)

### Problem 2: Realtime Not Updating

**Issue**: Adding bookmark in one tab doesn't show in another tab

**Cause**: Realtime channel not properly subscribed or incorrect broadcast

**Solution**:
- Used user-specific channels: `bookmarks:${user.id}`
- Ensured broadcast happens AFTER MySQL write
- Added proper cleanup in useEffect
- Used `service_role` key for server-side broadcasts

### Problem 3: User Data Leaking

**Issue**: Users could potentially see other users' bookmarks

**Cause**: Missing `user_id` checks in SQL queries

**Solution**:
- Enforced `WHERE user_id = ?` in ALL queries
- Verified ownership before delete operations
- Never trusted client-side filtering
- Added indexes on `user_id` for performance

### Problem 4: App Router Auth Issues

**Issue**: Session not persisting across page refreshes

**Cause**: Cookies not being set properly in App Router

**Solution**:
- Implemented middleware for session refresh
- Used `@supabase/ssr` package
- Created separate client utilities for server/browser
- Added proper cookie handling in middleware

### Problem 5: MySQL Connection Pooling

**Issue**: "Too many connections" error in production

**Cause**: Creating new MySQL connections for each query

**Solution**:
- Implemented connection pooling with `mysql2/promise`
- Reused single pool instance
- Set connection limits
- Enabled keep-alive

### Problem 6: Environment Variables in Vercel

**Issue**: App breaking in production but working locally

**Cause**: Environment variables not set in Vercel

**Solution**:
- Double-checked all env vars in Vercel dashboard
- Used `NEXT_PUBLIC_` prefix for client-side vars
- Kept sensitive keys server-side only
- Tested with `vercel env pull`

### Problem 7: AI API Rate Limits

**Issue**: Too many AI API calls causing rate limits

**Cause**: Calling AI for every bookmark without caching

**Solution** (for production):
- Implemented mock AI for demo purposes
- For real AI: Add rate limiting
- Cache AI results
- Use background jobs for processing

---

## 📁 Project Structure

```
smart-bookmark-app/
├── app/
│   ├── actions/
│   │   └── bookmarkActions.ts      # Server actions for CRUD
│   ├── api/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts             # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx                 # Main dashboard page
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home/login page
│
├── components/
│   ├── AddBookmarkForm.tsx          # Form to add bookmarks
│   ├── AuthButtons.tsx              # Login/logout buttons
│   └── BookmarkList.tsx             # List with realtime updates
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   └── server.ts                # Server Supabase client
│   ├── ai.ts                        # AI tagging and summaries
│   ├── mysql.ts                     # MySQL connection pool
│   └── types.ts                     # TypeScript interfaces
│
├── middleware.ts                    # Auth middleware
├── schema.sql                       # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## 🔍 Key Files Explained

### `lib/mysql.ts`
- MySQL connection pooling
- Query helper function
- Database configuration

### `app/actions/bookmarkActions.ts`
- Server actions for all CRUD operations
- User authentication checks
- Realtime broadcast triggers
- Search and filter logic

### `components/BookmarkList.tsx`
- Client component with realtime subscription
- Handles bookmark display
- Search and filter UI
- Delete functionality

### `middleware.ts`
- Session refresh logic
- Protected route handling
- Auto-redirect for logged-in users

---

## 🎨 Features in Detail

### Search Functionality
```typescript
// Searches both title and URL
SELECT * FROM bookmarks
WHERE user_id = ?
AND (title LIKE ? OR url LIKE ?)
```

### Tag Filtering
```typescript
// Uses JSON_CONTAINS for tag matching
SELECT * FROM bookmarks
WHERE user_id = ?
AND JSON_CONTAINS(tags, '"ai"')
```

### Realtime Events
```typescript
// User-specific channels
supabase.channel(`bookmarks:${user.id}`)
  .on('broadcast', { event: 'bookmark_added' }, handler)
  .on('broadcast', { event: 'bookmark_deleted' }, handler)
  .subscribe()
```

---

## 📝 API Reference

### Server Actions

#### `getBookmarks(searchQuery?, tagFilter?)`
- Fetches user's bookmarks
- Optional search and tag filtering
- Returns array of Bookmark objects

#### `addBookmark(input: BookmarkInput)`
- Creates new bookmark
- Generates AI tags and summary
- Broadcasts realtime event
- Returns created bookmark

#### `deleteBookmark(bookmarkId: string)`
- Deletes bookmark by ID
- Verifies ownership
- Broadcasts realtime event
- Returns success status

#### `getAllTags()`
- Returns all unique tags for user
- Used for filter dropdown
- Sorted alphabetically

---

## 🔒 Security Features

1. **Authentication**: Google OAuth via Supabase
2. **Authorization**: User ID enforcement on all queries
3. **Data Isolation**: Private channels per user
4. **SQL Injection Protection**: Parameterized queries
5. **Environment Variables**: Secrets never exposed to client
6. **HTTPS Only**: Enforced in production

---

## 🚦 Testing Checklist

- [ ] Login with Google works
- [ ] Add bookmark creates entry
- [ ] Bookmark appears in list
- [ ] Open second tab - bookmark syncs instantly
- [ ] Search filters correctly
- [ ] Tag filter works
- [ ] Delete removes bookmark
- [ ] Delete syncs to other tabs
- [ ] Logout redirects to home
- [ ] Private data (can't see other users' bookmarks)

---

## 🎓 Learning Outcomes

This project demonstrates:

1. **Next.js App Router** best practices
2. **Supabase Auth** integration
3. **Supabase Realtime** for live updates
4. **MySQL** database design and queries
5. **Server Actions** for backend logic
6. **TypeScript** type safety
7. **Tailwind CSS** responsive design
8. **Production deployment** on Vercel

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this project for learning or production.

---

## 👨‍💻 Author

Built as a demonstration of modern full-stack development with Next.js, Supabase, and MySQL.

---

## 🙏 Acknowledgments

- Next.js team for amazing framework
- Supabase for Auth and Realtime
- Vercel for hosting platform
- Tailwind CSS for styling system

---

**Ready to deploy!** Follow the setup instructions above and you'll have a production-ready bookmark manager running in minutes.
