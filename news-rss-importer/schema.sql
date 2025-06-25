-- =========================================
-- Step 1: Check Your Current Table Structure
-- =========================================
-- Run this first to see what you have:

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('news', 'import_logs')
ORDER BY table_name, ordinal_position;

-- =========================================
-- Step 2: Safe Schema Updates
-- =========================================

-- Add missing columns to news table (safe - will skip if exists)
ALTER TABLE news ADD COLUMN IF NOT EXISTS source_feed text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to import_logs table (safe - will skip if exists)  
ALTER TABLE import_logs ADD COLUMN IF NOT EXISTS import_type text;
ALTER TABLE import_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';
ALTER TABLE import_logs ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE import_logs ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- =========================================
-- Step 3: Create Indexes (ONLY after columns are added)
-- =========================================

-- Indexes for news table
CREATE INDEX IF NOT EXISTS news_category_idx ON news(category);
CREATE INDEX IF NOT EXISTS news_published_idx ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS news_created_idx ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS news_sentiment_idx ON news(sentiment);

-- Only create source_feed index after we've added the column
CREATE INDEX IF NOT EXISTS news_source_idx ON news(source_feed);

-- Indexes for import_logs (only after adding missing columns)
CREATE INDEX IF NOT EXISTS import_logs_date_idx ON import_logs(import_date DESC);
CREATE INDEX IF NOT EXISTS import_logs_type_idx ON import_logs(import_type);

-- =========================================
-- Step 4: Security Policies
-- =========================================

-- Enable RLS (skip errors if already enabled)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view news" ON news;
DROP POLICY IF EXISTS "Public can view logs" ON import_logs;
DROP POLICY IF EXISTS "Service role can insert news" ON news;
DROP POLICY IF EXISTS "Service role can insert logs" ON import_logs;
DROP POLICY IF EXISTS "Service role can update news" ON news;

-- Create new policies
CREATE POLICY "Public can view news" ON news
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert news" ON news
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update news" ON news
    FOR UPDATE USING (true);

CREATE POLICY "Public can view logs" ON import_logs
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert logs" ON import_logs
    FOR INSERT WITH CHECK (true);

-- =========================================
-- Step 5: Utility Functions
-- =========================================

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get statistics
CREATE OR REPLACE FUNCTION get_news_stats()
RETURNS TABLE(
    total_articles bigint,
    articles_today bigint,
    articles_this_week bigint,
    categories_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_articles,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as articles_today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - interval '7 days') as articles_this_week,
        COUNT(DISTINCT category) as categories_count
    FROM news;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- Step 6: Final Verification
-- =========================================

-- Check final table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('news', 'import_logs')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('news', 'import_logs')
ORDER BY tablename;

-- Test stats function
SELECT * FROM get_news_stats();
