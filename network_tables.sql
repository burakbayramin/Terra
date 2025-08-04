-- Network Tables for Emergency Network Feature

-- User Networks Table
CREATE TABLE IF NOT EXISTS user_networks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network Members Table
CREATE TABLE IF NOT EXISTS network_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID NOT NULL REFERENCES user_networks(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Notifications Table
CREATE TABLE IF NOT EXISTS emergency_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID NOT NULL REFERENCES user_networks(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_networks_owner_id ON user_networks(owner_id);
CREATE INDEX IF NOT EXISTS idx_network_members_network_id ON network_members(network_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_network_id ON emergency_notifications(network_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_sender_id ON emergency_notifications(sender_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_notifications ENABLE ROW LEVEL SECURITY;

-- User Networks Policies
CREATE POLICY "Users can view their own networks" ON user_networks
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own networks" ON user_networks
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own networks" ON user_networks
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own networks" ON user_networks
    FOR DELETE USING (auth.uid() = owner_id);

-- Network Members Policies
CREATE POLICY "Network owners can view their network members" ON network_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_networks 
            WHERE user_networks.id = network_members.network_id 
            AND user_networks.owner_id = auth.uid()
        )
    );

CREATE POLICY "Network owners can add members to their networks" ON network_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_networks 
            WHERE user_networks.id = network_members.network_id 
            AND user_networks.owner_id = auth.uid()
        )
    );

CREATE POLICY "Network owners can update their network members" ON network_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_networks 
            WHERE user_networks.id = network_members.network_id 
            AND user_networks.owner_id = auth.uid()
        )
    );

CREATE POLICY "Network owners can delete their network members" ON network_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_networks 
            WHERE user_networks.id = network_members.network_id 
            AND user_networks.owner_id = auth.uid()
        )
    );

-- Emergency Notifications Policies
CREATE POLICY "Users can view notifications from their networks" ON emergency_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_networks 
            WHERE user_networks.id = emergency_notifications.network_id 
            AND user_networks.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can send notifications to their networks" ON emergency_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_networks 
            WHERE user_networks.id = emergency_notifications.network_id 
            AND user_networks.owner_id = auth.uid()
        )
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_user_networks_updated_at 
    BEFORE UPDATE ON user_networks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_members_updated_at 
    BEFORE UPDATE ON network_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 