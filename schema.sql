-- Create database
CREATE DATABASE IF NOT EXISTS bookmark_app;
USE bookmark_app;

-- Create bookmarks table
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

-- Example queries for reference:

-- Insert bookmark
-- INSERT INTO bookmarks (id, user_id, title, url, summary, tags)
-- VALUES (UUID(), ?, ?, ?, ?, ?);

-- Select user bookmarks
-- SELECT * FROM bookmarks
-- WHERE user_id = ?
-- ORDER BY created_at DESC;

-- Delete bookmark
-- DELETE FROM bookmarks
-- WHERE id = ? AND user_id = ?;

-- Search bookmarks
-- SELECT * FROM bookmarks
-- WHERE user_id = ?
-- AND (title LIKE ? OR url LIKE ?)
-- ORDER BY created_at DESC;

-- Filter by tag
-- SELECT * FROM bookmarks
-- WHERE user_id = ?
-- AND JSON_CONTAINS(tags, '"ai"')
-- ORDER BY created_at DESC;
