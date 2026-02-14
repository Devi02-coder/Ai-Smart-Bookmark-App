-- 1. Create the bookmarks table (PostgreSQL syntax)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  tags JSONB DEFAULT '[]'::jsonb, -- Using JSONB for better performance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key reference to Supabase Auth users (optional but recommended)
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON bookmarks(created_at);

-- 3. Enable Row Level Security (RLS)
-- This ensures users can only see their own bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookmarks" 
ON bookmarks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Enable Realtime
-- This allows the BookmarkList.tsx to see updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

-- 1. Add the summary column as Text
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- 2. Add the tags column as JSONB (Standard for PostgreSQL arrays/objects)
-- We set it to default to an empty array []
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 3. Add the created_at column with the current timestamp
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();