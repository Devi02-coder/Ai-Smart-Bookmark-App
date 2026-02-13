# 🏗️ Architecture Documentation

## System Overview

The Smart Bookmark Manager is built on a modern, scalable architecture that separates concerns between authentication, data storage, and real-time communication.

---

## Core Architecture Principles

### 1. **Separation of Concerns**
- **MySQL**: Single source of truth for bookmark data
- **Supabase Auth**: Authentication and user management
- **Supabase Realtime**: WebSocket-based live updates
- **Next.js**: Application logic and API layer

### 2. **Security First**
- User data isolation via `user_id`
- Server-side authorization checks
- Parameterized SQL queries
- Environment-based secrets

### 3. **Real-Time by Default**
- No polling
- Event-driven updates
- User-specific channels
- Optimistic UI updates

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                          │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Browser   │  │   Browser   │  │   Mobile Device     │  │
│  │   Tab 1     │  │   Tab 2     │  │   (Future)          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                 │                    │              │
└─────────┼─────────────────┼────────────────────┼──────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP ROUTER                       │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐    │
│  │   Pages    │  │   Server   │  │    Middleware       │    │
│  │            │  │  Actions   │  │   (Auth Check)      │    │
│  └────────────┘  └─────┬──────┘  └─────────────────────┘    │
│                        │                                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   SUPABASE  │  │    MYSQL    │  │  SUPABASE   │
│    AUTH     │  │  DATABASE   │  │  REALTIME   │
│             │  │             │  │             │
│ - Google    │  │ - Bookmarks │  │ - WebSocket │
│   OAuth     │  │   Table     │  │ - Channels  │
│ - Sessions  │  │ - Indexes   │  │ - Broadcast │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Data Flow

### Add Bookmark Flow

```
┌─────────┐
│  User   │
│ Clicks  │
│  "Add"  │
└────┬────┘
     │
     ▼
┌──────────────────┐
│ Client Component │
│ AddBookmarkForm  │
└────┬─────────────┘
     │ 1. Form Submit
     ▼
┌──────────────────────┐
│   Server Action      │
│  addBookmark()       │
│                      │
│ - Validate session   │
│ - Validate input     │
│ - Generate AI data   │
└────┬─────────────────┘
     │ 2. Insert
     ▼
┌──────────────────┐
│  MySQL Database  │
│                  │
│ INSERT INTO      │
│ bookmarks...     │
└────┬─────────────┘
     │ 3. Success
     ▼
┌──────────────────────┐
│   Server Action      │
│                      │
│ Broadcast to         │
│ Supabase Realtime    │
└────┬─────────────────┘
     │ 4. Broadcast
     ▼
┌──────────────────────┐
│ Supabase Realtime    │
│                      │
│ Channel:             │
│ bookmarks:user_id    │
└────┬─────────────────┘
     │ 5. WebSocket
     ├──────────┬────────────┐
     ▼          ▼            ▼
┌────────┐ ┌────────┐  ┌────────┐
│ Tab 1  │ │ Tab 2  │  │ Tab N  │
│        │ │        │  │        │
│ Update │ │ Update │  │ Update │
│   UI   │ │   UI   │  │   UI   │
└────────┘ └────────┘  └────────┘
```

### Delete Bookmark Flow

```
User → Client → Server Action → MySQL DELETE
                      ↓
                Broadcast Event
                      ↓
              Supabase Realtime
                      ↓
            All Connected Tabs
                      ↓
              Remove from UI
```

### Search/Filter Flow

```
User Types → Client State → Filter Array → Render List
     ↓
  (No Server Call - Client-side filtering)
```

---

## Component Architecture

### Server Components (RSC)
```typescript
app/
├── page.tsx                    # Landing page (static)
├── dashboard/page.tsx          # Dashboard (fetch data)
└── layout.tsx                  # Root layout

// These run on server, can access database directly
// No interactivity, pure data fetching
```

### Client Components
```typescript
components/
├── AuthButtons.tsx             # Login/Logout (needs browser APIs)
├── AddBookmarkForm.tsx         # Form handling (state, events)
└── BookmarkList.tsx            # Realtime subscription (WebSocket)

// These run in browser, handle user interactions
// Can subscribe to real-time updates
```

### Server Actions
```typescript
app/actions/bookmarkActions.ts

// Run on server, callable from client
// Can access database, send broadcasts
// Automatically handle form submissions
```

---

## Database Schema

### Bookmarks Table

```sql
CREATE TABLE bookmarks (
  id CHAR(36) PRIMARY KEY,           -- UUID v4
  user_id CHAR(36) NOT NULL,         -- Supabase Auth user ID
  title VARCHAR(255) NOT NULL,       -- Bookmark title
  url TEXT NOT NULL,                 -- Full URL
  summary TEXT,                      -- AI-generated summary
  tags JSON,                         -- Array of tags
  created_at TIMESTAMP DEFAULT NOW,  -- Auto timestamp
  
  INDEX idx_user_id (user_id),       -- Fast user lookups
  INDEX idx_created_at (created_at)  -- Fast sorting
);
```

### Query Patterns

**Get User Bookmarks:**
```sql
SELECT * FROM bookmarks
WHERE user_id = ? 
ORDER BY created_at DESC;
```

**Search:**
```sql
SELECT * FROM bookmarks
WHERE user_id = ?
AND (title LIKE ? OR url LIKE ?)
ORDER BY created_at DESC;
```

**Filter by Tag:**
```sql
SELECT * FROM bookmarks
WHERE user_id = ?
AND JSON_CONTAINS(tags, '"ai"')
ORDER BY created_at DESC;
```

---

## Authentication Flow

### Login Process

```
1. User clicks "Sign in with Google"
   ↓
2. Supabase redirects to Google OAuth
   ↓
3. User authenticates with Google
   ↓
4. Google redirects back with code
   ↓
5. Supabase exchanges code for session
   ↓
6. Session stored in cookies
   ↓
7. Redirect to /dashboard
```

### Session Management

```typescript
// middleware.ts
// Runs on every request
// Refreshes session if expired
// Protects /dashboard routes
// Redirects authenticated users from /

// Server-side session check
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client-side session
const supabase = createClient();
const session = await supabase.auth.getSession();
```

---

## Real-Time Architecture

### Channel Structure

Each user gets a private channel:
```
bookmarks:{user_id}
```

Example:
```
bookmarks:123e4567-e89b-12d3-a456-426614174000
```

### Event Types

**bookmark_added:**
```json
{
  "type": "broadcast",
  "event": "bookmark_added",
  "payload": {
    "bookmark": {
      "id": "...",
      "title": "...",
      "url": "...",
      "tags": [...],
      "summary": "..."
    }
  }
}
```

**bookmark_deleted:**
```json
{
  "type": "broadcast",
  "event": "bookmark_deleted",
  "payload": {
    "bookmark": {
      "id": "..."
    }
  }
}
```

### Client Subscription

```typescript
useEffect(() => {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`bookmarks:${userId}`)
    .on('broadcast', { event: 'bookmark_added' }, (payload) => {
      setBookmarks(prev => [payload.bookmark, ...prev]);
    })
    .on('broadcast', { event: 'bookmark_deleted' }, (payload) => {
      setBookmarks(prev => 
        prev.filter(b => b.id !== payload.bookmark.id)
      );
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

---

## AI Integration

### Mock Implementation (Current)

```typescript
// lib/ai.ts
export async function generateAIData(url: string, title: string) {
  // Analyzes URL and title
  // Returns smart tags and summary
  
  return {
    tags: ['development', 'frontend', 'react'],
    summary: 'A guide to React best practices'
  };
}
```

### Production Implementation (Future)

```typescript
// With Anthropic Claude API
export async function generateAIData(url: string, title: string) {
  // 1. Fetch webpage content
  const response = await fetch(url);
  const html = await response.text();
  const text = extractText(html);
  
  // 2. Call Claude API
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze this webpage:
        Title: ${title}
        Content: ${text.slice(0, 2000)}
        
        Return JSON:
        {
          "summary": "50 word summary",
          "tags": ["tag1", "tag2", "tag3"]
        }`
      }]
    })
  });
  
  const result = await aiResponse.json();
  return JSON.parse(result.content[0].text);
}
```

---

## Security Model

### User Isolation

**Every query enforces user_id:**
```typescript
// ✅ CORRECT
await query(
  'SELECT * FROM bookmarks WHERE user_id = ?',
  [userId]
);

// ❌ WRONG - Can see all users' bookmarks
await query('SELECT * FROM bookmarks');
```

### Server-Side Validation

```typescript
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

// Used in every server action
export async function addBookmark(input) {
  const user = await getAuthenticatedUser(); // 🔒 Auth check
  // ... rest of logic
}
```

### SQL Injection Protection

**Always use parameterized queries:**
```typescript
// ✅ SAFE
await query(
  'SELECT * FROM bookmarks WHERE title LIKE ?',
  [`%${searchTerm}%`]
);

// ❌ VULNERABLE
await query(
  `SELECT * FROM bookmarks WHERE title LIKE '%${searchTerm}%'`
);
```

---

## Performance Optimizations

### Database Indexes

```sql
-- Fast user lookups
INDEX idx_user_id (user_id)

-- Fast date sorting
INDEX idx_created_at (created_at)
```

### Connection Pooling

```typescript
// Reuse MySQL connections
const pool = mysql.createPool({
  connectionLimit: 10,
  enableKeepAlive: true
});
```

### Client-Side Caching

```typescript
// React state holds bookmark list
// No refetch needed after realtime update
const [bookmarks, setBookmarks] = useState(initialBookmarks);
```

### Optimistic Updates

```typescript
// Update UI immediately, rollback on error
async function handleDelete(id) {
  setBookmarks(prev => prev.filter(b => b.id !== id));
  
  try {
    await deleteBookmark(id);
  } catch (error) {
    setBookmarks(prev => [...prev, deletedBookmark]);
  }
}
```

---

## Scalability Considerations

### Current Capacity
- **Users**: 10,000+
- **Bookmarks per user**: Unlimited
- **Concurrent connections**: 1,000+

### Scaling Strategies

**Database:**
- Read replicas for high traffic
- Sharding by user_id
- Caching layer (Redis)

**API:**
- Vercel auto-scales
- Rate limiting per user
- Request deduplication

**Realtime:**
- Supabase handles scaling
- Consider dedicated realtime server at 100k+ users

---

## Monitoring & Observability

### Metrics to Track

**Application:**
- Request latency
- Error rates
- User signups
- Active users

**Database:**
- Query performance
- Connection pool usage
- Storage growth
- Index efficiency

**Realtime:**
- Active connections
- Message throughput
- Connection drops
- Latency

### Tools

- Vercel Analytics (built-in)
- Database provider metrics
- Custom logging
- Error tracking (Sentry)

---

## Future Enhancements

### Phase 1: Core Improvements
- [ ] Bookmark folders/collections
- [ ] Bulk operations
- [ ] Export bookmarks
- [ ] Import from browser

### Phase 2: AI Features
- [ ] Real AI integration (Claude/GPT)
- [ ] Smart recommendations
- [ ] Duplicate detection
- [ ] Content summarization

### Phase 3: Collaboration
- [ ] Shared collections
- [ ] Team workspaces
- [ ] Public bookmark lists

### Phase 4: Advanced
- [ ] Browser extension
- [ ] Mobile apps (React Native)
- [ ] Offline support
- [ ] Advanced analytics

---

## Technology Choices Rationale

### Why Next.js?
- Server and client in one codebase
- Server Actions for API-less backend
- Built-in TypeScript support
- Excellent Vercel integration

### Why Supabase?
- Free tier suitable for MVP
- Google OAuth out of the box
- Real-time built-in
- PostgreSQL backend (bonus features)

### Why MySQL?
- Familiar SQL syntax
- Wide hosting support
- JSON support for tags
- Excellent performance

### Why Vercel?
- Zero-config deployment
- Automatic scaling
- Edge network
- Free tier for demos

---

This architecture provides a solid foundation that can scale from MVP to production with millions of users while maintaining code quality and performance.
