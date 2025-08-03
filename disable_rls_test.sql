-- Temporarily disable RLS for testing
ALTER TABLE comment_upvotes DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy for testing
DROP POLICY IF EXISTS "Users can view upvotes" ON comment_upvotes;
DROP POLICY IF EXISTS "Users can insert their own upvotes" ON comment_upvotes;
DROP POLICY IF EXISTS "Users can delete their own upvotes" ON comment_upvotes;

-- Create permissive policies for testing
CREATE POLICY "Allow all operations for testing" ON comment_upvotes
    FOR ALL USING (true) WITH CHECK (true); 