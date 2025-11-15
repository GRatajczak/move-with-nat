-- Add indexes for GET /exercises endpoint performance optimization
-- This migration adds indexes to improve query performance for listing, searching, and filtering exercises

-- Index for searching exercises by name (supports ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);

-- Index for filtering by visibility status
CREATE INDEX IF NOT EXISTS idx_exercises_is_hidden ON exercises(is_hidden);

-- Composite index for the most common query pattern: visible exercises ordered by creation date
-- This partial index only includes visible exercises, making it highly efficient
CREATE INDEX IF NOT EXISTS idx_exercises_visible_created_at 
  ON exercises(created_at DESC)
  WHERE is_hidden = false;

-- Enable pg_trgm extension for fuzzy/trigram search support (optional, for future optimization)
-- This allows for more flexible search capabilities beyond simple ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for better search performance with partial matches
-- Useful for autocomplete and fuzzy search scenarios
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
  ON exercises USING gin(name gin_trgm_ops);

-- Note: Basic created_at index already exists from initial migration (line 68)
-- Note: These indexes significantly improve performance for:
--   - Searching exercises by name (ILIKE queries)
--   - Filtering by visibility (is_hidden=false for non-admins)
--   - Pagination with proper ordering

