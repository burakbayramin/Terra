-- Test script to check and create comment_upvotes table

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'comment_upvotes'
);

-- 2. If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS comment_upvotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES earthquake_comments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, profile_id)
);

-- 3. Add upvotes_count column to earthquake_comments if it doesn't exist
ALTER TABLE earthquake_comments 
ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment_id ON comment_upvotes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_profile_id ON comment_upvotes(profile_id);

-- 5. Enable RLS
ALTER TABLE comment_upvotes ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies
DROP POLICY IF EXISTS "Users can view upvotes" ON comment_upvotes;
CREATE POLICY "Users can view upvotes" ON comment_upvotes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own upvotes" ON comment_upvotes;
CREATE POLICY "Users can insert their own upvotes" ON comment_upvotes
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete their own upvotes" ON comment_upvotes;
CREATE POLICY "Users can delete their own upvotes" ON comment_upvotes
    FOR DELETE USING (auth.uid() = profile_id);

-- 7. Test insert
-- INSERT INTO comment_upvotes (comment_id, profile_id) 
-- VALUES ('test-comment-id', 'test-profile-id')
-- ON CONFLICT (comment_id, profile_id) DO NOTHING; 