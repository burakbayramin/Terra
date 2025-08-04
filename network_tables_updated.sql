-- Updated Network Tables for Multiple Networks Feature

-- User Networks Table (supports multiple networks per user)
CREATE TABLE IF NOT EXISTS user_networks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    notification_settings JSONB DEFAULT '{
        "emergency_alerts": true,
        "location_sharing": true,
        "sound_enabled": true,
        "vibration_enabled": true,
        "auto_location": true
    }'::jsonb,
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
    notification_preferences JSONB DEFAULT '{
        "receive_emergency": true,
        "receive_location": true,
        "silent_mode": false
    }'::jsonb,
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
    notification_type VARCHAR(50) DEFAULT 'emergency',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_networks_owner_id ON user_networks(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_networks_active ON user_networks(owner_id, is_active);
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

CREATE POLICY "Users can create their own networks (max 3)" ON user_networks
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND
        (SELECT COUNT(*) FROM user_networks WHERE owner_id = auth.uid()) < 3
    );

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

-- Function to check network limit
CREATE OR REPLACE FUNCTION check_network_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM user_networks WHERE owner_id = NEW.owner_id) > 3 THEN
        RAISE EXCEPTION 'Maximum 3 networks allowed per user';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to enforce network limit
CREATE TRIGGER enforce_network_limit
    BEFORE INSERT ON user_networks
    FOR EACH ROW EXECUTE FUNCTION check_network_limit();

-- Insert sample data for testing
INSERT INTO user_networks (name, owner_id, description, notification_settings) VALUES
(
    'Aile Ağım',
    (SELECT id FROM auth.users LIMIT 1),
    'Acil durumlar için aile üyelerim',
    '{
        "emergency_alerts": true,
        "location_sharing": true,
        "sound_enabled": true,
        "vibration_enabled": true,
        "auto_location": true
    }'::jsonb
),
(
    'İş Arkadaşları',
    (SELECT id FROM auth.users LIMIT 1),
    'Ofis ve iş arkadaşlarım',
    '{
        "emergency_alerts": true,
        "location_sharing": false,
        "sound_enabled": false,
        "vibration_enabled": true,
        "auto_location": false
    }'::jsonb
),
(
    'Yakın Arkadaşlar',
    (SELECT id FROM auth.users LIMIT 1),
    'En yakın arkadaşlarım',
    '{
        "emergency_alerts": true,
        "location_sharing": true,
        "sound_enabled": true,
        "vibration_enabled": true,
        "auto_location": true
    }'::jsonb
);

-- Insert sample members for the first network
INSERT INTO network_members (network_id, name, phone, notification_preferences) VALUES
(
    (SELECT id FROM user_networks WHERE name = 'Aile Ağım' LIMIT 1),
    'Ahmet Yılmaz',
    '+905551234567',
    '{
        "receive_emergency": true,
        "receive_location": true,
        "silent_mode": false
    }'::jsonb
),
(
    (SELECT id FROM user_networks WHERE name = 'Aile Ağım' LIMIT 1),
    'Ayşe Yılmaz',
    '+905559876543',
    '{
        "receive_emergency": true,
        "receive_location": true,
        "silent_mode": false
    }'::jsonb
),
(
    (SELECT id FROM user_networks WHERE name = 'İş Arkadaşları' LIMIT 1),
    'Mehmet Demir',
    '+905556789012',
    '{
        "receive_emergency": true,
        "receive_location": false,
        "silent_mode": true
    }'::jsonb
),
(
    (SELECT id FROM user_networks WHERE name = 'Yakın Arkadaşlar' LIMIT 1),
    'Fatma Kaya',
    '+905553456789',
    '{
        "receive_emergency": true,
        "receive_location": true,
        "silent_mode": false
    }'::jsonb
); 