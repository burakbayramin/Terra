-- Emergency Status Table
-- This table tracks when users mark themselves as "in danger" during emergencies

CREATE TABLE IF NOT EXISTS emergency_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'in_danger',
    location TEXT,
    coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Index for quick lookups
    CONSTRAINT valid_status CHECK (status IN ('in_danger', 'safe', 'needs_help', 'evacuated')),
    CONSTRAINT valid_coordinates CHECK (coordinates IS NULL OR (coordinates[0] >= -180 AND coordinates[0] <= 180 AND coordinates[1] >= -90 AND coordinates[1] <= 90))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_status_profile_id ON emergency_status(profile_id);
CREATE INDEX IF NOT EXISTS idx_emergency_status_status ON emergency_status(status);
CREATE INDEX IF NOT EXISTS idx_emergency_status_created_at ON emergency_status(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_status_location ON emergency_status USING GIN(to_tsvector('turkish', location));

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_emergency_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER trigger_update_emergency_status_updated_at
    BEFORE UPDATE ON emergency_status
    FOR EACH ROW
    EXECUTE FUNCTION update_emergency_status_updated_at();

-- Insert sample data (optional - for testing)
-- INSERT INTO emergency_status (profile_id, status, location, notes) VALUES 
-- ('sample-profile-id', 'in_danger', 'İstanbul, Kadıköy', 'Test emergency status');

-- Grant permissions (adjust according to your Supabase setup)
-- GRANT ALL ON emergency_status TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated; 