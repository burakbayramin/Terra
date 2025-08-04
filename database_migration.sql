-- Migration: Add location and emergency contacts fields to profiles table
-- Date: 2024-01-XX

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS emergency_contacts TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN profiles.address IS 'User''s detailed address information';
COMMENT ON COLUMN profiles.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN profiles.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN profiles.emergency_contacts IS 'Array of emergency contact phone numbers';

-- Create indexes for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_city_district ON profiles(city, district);

-- Update RLS policies if needed (assuming RLS is enabled)
-- Note: Adjust these policies according to your existing RLS setup

-- Example RLS policy for location data (uncomment and modify as needed)
-- CREATE POLICY "Users can view their own location data" ON profiles
--     FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update their own location data" ON profiles
--     FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Users can insert their own location data" ON profiles
--     FOR INSERT WITH CHECK (auth.uid() = id); 