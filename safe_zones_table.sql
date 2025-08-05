-- Safe Zones Table
CREATE TABLE IF NOT EXISTS safe_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safe_zones_network_id ON safe_zones(network_id);
CREATE INDEX IF NOT EXISTS idx_safe_zones_created_by ON safe_zones(created_by);
CREATE INDEX IF NOT EXISTS idx_safe_zones_created_at ON safe_zones(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view safe zones in networks they are members of
CREATE POLICY "Users can view safe zones in their networks" ON safe_zones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = safe_zones.network_id 
            AND network_members.user_id = auth.uid()
        )
    );

-- Users can insert safe zones in networks they are members of
CREATE POLICY "Users can insert safe zones in their networks" ON safe_zones
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = safe_zones.network_id 
            AND network_members.user_id = auth.uid()
        )
    );

-- Users can update safe zones they created
CREATE POLICY "Users can update their own safe zones" ON safe_zones
    FOR UPDATE USING (
        auth.uid() = created_by
    );

-- Users can delete safe zones they created
CREATE POLICY "Users can delete their own safe zones" ON safe_zones
    FOR DELETE USING (
        auth.uid() = created_by
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_safe_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_safe_zones_updated_at
    BEFORE UPDATE ON safe_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_safe_zones_updated_at();

-- Add comments
COMMENT ON TABLE safe_zones IS 'Stores safe zones added by network members';
COMMENT ON COLUMN safe_zones.name IS 'Name of the safe zone';
COMMENT ON COLUMN safe_zones.latitude IS 'Latitude coordinate of the safe zone';
COMMENT ON COLUMN safe_zones.longitude IS 'Longitude coordinate of the safe zone';
COMMENT ON COLUMN safe_zones.network_id IS 'ID of the network this safe zone belongs to';
COMMENT ON COLUMN safe_zones.created_by IS 'ID of the user who created this safe zone'; 