-- Smart Emergency Route Tables

-- Smart Route Feature Settings Table
CREATE TABLE IF NOT EXISTS smart_route_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(network_id)
);

-- Smart Routes Table
CREATE TABLE IF NOT EXISTS smart_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    route_type VARCHAR(50) NOT NULL DEFAULT 'default', -- 'default', 'family', 'disabled_friendly', 'elderly_friendly', 'custom'
    is_default BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route Waypoints Table
CREATE TABLE IF NOT EXISTS route_waypoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES smart_routes(id) ON DELETE CASCADE,
    waypoint_type VARCHAR(50) NOT NULL, -- 'gathering_point', 'safe_zone', 'checkpoint'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    order_index INTEGER NOT NULL,
    estimated_time_minutes INTEGER,
    distance_meters INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Route Selections Table
CREATE TABLE IF NOT EXISTS user_route_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES smart_routes(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, network_id)
);

-- User Route Progress Table
CREATE TABLE IF NOT EXISTS user_route_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES smart_routes(id) ON DELETE CASCADE,
    current_waypoint_id UUID REFERENCES route_waypoints(id),
    status VARCHAR(50) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'at_gathering_point', 'at_safe_zone', 'completed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route Statistics Table
CREATE TABLE IF NOT EXISTS route_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES smart_routes(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    total_users_selected INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    average_completion_time_minutes INTEGER,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_smart_route_settings_network_id ON smart_route_settings(network_id);
CREATE INDEX IF NOT EXISTS idx_smart_routes_network_id ON smart_routes(network_id);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id ON route_waypoints(route_id);
CREATE INDEX IF NOT EXISTS idx_user_route_selections_user_id ON user_route_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_route_selections_network_id ON user_route_selections(network_id);
CREATE INDEX IF NOT EXISTS idx_user_route_progress_user_id ON user_route_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_route_progress_network_id ON user_route_progress(network_id);
CREATE INDEX IF NOT EXISTS idx_route_statistics_route_id ON route_statistics(route_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE smart_route_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_route_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_route_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_statistics ENABLE ROW LEVEL SECURITY;

-- Smart Route Settings Policies
CREATE POLICY "Network admins can manage route settings" ON smart_route_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = smart_route_settings.network_id 
            AND network_members.user_id = auth.uid()
            AND network_members.role = 'creator'
        )
    );

-- Smart Routes Policies
CREATE POLICY "Network members can view routes" ON smart_routes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = smart_routes.network_id 
            AND network_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Network admins can manage routes" ON smart_routes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = smart_routes.network_id 
            AND network_members.user_id = auth.uid()
            AND network_members.role = 'creator'
        )
    );

-- Route Waypoints Policies
CREATE POLICY "Network members can view waypoints" ON route_waypoints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM smart_routes sr
            JOIN network_members nm ON nm.network_id = sr.network_id
            WHERE sr.id = route_waypoints.route_id 
            AND nm.user_id = auth.uid()
        )
    );

CREATE POLICY "Network admins can manage waypoints" ON route_waypoints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM smart_routes sr
            JOIN network_members nm ON nm.network_id = sr.network_id
            WHERE sr.id = route_waypoints.route_id 
            AND nm.user_id = auth.uid()
            AND nm.role = 'creator'
        )
    );

-- User Route Selections Policies
CREATE POLICY "Users can manage their own route selections" ON user_route_selections
    FOR ALL USING (auth.uid() = user_id);

-- User Route Progress Policies
CREATE POLICY "Users can manage their own progress" ON user_route_progress
    FOR ALL USING (auth.uid() = user_id);

-- Route Statistics Policies
CREATE POLICY "Network members can view route statistics" ON route_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = route_statistics.network_id 
            AND network_members.user_id = auth.uid()
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
CREATE TRIGGER update_smart_route_settings_updated_at 
    BEFORE UPDATE ON smart_route_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_routes_updated_at 
    BEFORE UPDATE ON smart_routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_statistics_updated_at 
    BEFORE UPDATE ON route_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update route statistics
CREATE OR REPLACE FUNCTION update_route_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update route statistics when user selects a route
    IF TG_OP = 'INSERT' THEN
        INSERT INTO route_statistics (route_id, network_id, total_users_selected, last_used)
        VALUES (NEW.route_id, NEW.network_id, 1, NOW())
        ON CONFLICT (route_id) DO UPDATE SET
            total_users_selected = route_statistics.total_users_selected + 1,
            last_used = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update route statistics
CREATE TRIGGER update_route_stats_on_selection
    AFTER INSERT ON user_route_selections
    FOR EACH ROW EXECUTE FUNCTION update_route_statistics(); 