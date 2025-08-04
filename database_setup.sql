-- Database setup for earthquake comments upvote system

-- 1. Add upvotes_count column to earthquake_comments table
ALTER TABLE earthquake_comments 
ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;

-- 2. Create comment_upvotes table
CREATE TABLE IF NOT EXISTS comment_upvotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES earthquake_comments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, profile_id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment_id ON comment_upvotes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_profile_id ON comment_upvotes(profile_id);
CREATE INDEX IF NOT EXISTS idx_earthquake_comments_upvotes_count ON earthquake_comments(upvotes_count DESC);

-- 4. Create RLS policies for comment_upvotes table
ALTER TABLE comment_upvotes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see upvotes for comments
CREATE POLICY "Users can view upvotes" ON comment_upvotes
    FOR SELECT USING (true);

-- Policy to allow users to insert their own upvotes
CREATE POLICY "Users can insert their own upvotes" ON comment_upvotes
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Policy to allow users to delete their own upvotes
CREATE POLICY "Users can delete their own upvotes" ON comment_upvotes
    FOR DELETE USING (auth.uid() = profile_id);

-- 5. Create trigger to update upvotes_count when upvotes are added/removed
CREATE OR REPLACE FUNCTION update_comment_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE earthquake_comments 
        SET upvotes_count = COALESCE(upvotes_count, 0) + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE earthquake_comments 
        SET upvotes_count = GREATEST(COALESCE(upvotes_count, 0) - 1, 0) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_comment_upvotes_count ON comment_upvotes;
CREATE TRIGGER trigger_update_comment_upvotes_count
    AFTER INSERT OR DELETE ON comment_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_upvotes_count(); 