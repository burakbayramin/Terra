-- Emergency Plans Table
CREATE TABLE IF NOT EXISTS emergency_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Plan Steps Table
CREATE TABLE IF NOT EXISTS emergency_plan_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES emergency_plans(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('emergency', 'post_emergency')),
    order_index INTEGER NOT NULL,
    safe_zone_id UUID REFERENCES safe_zones(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_plans_network_id ON emergency_plans(network_id);
CREATE INDEX IF NOT EXISTS idx_emergency_plans_created_by ON emergency_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_emergency_plans_is_active ON emergency_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_plan_steps_plan_id ON emergency_plan_steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_emergency_plan_steps_category ON emergency_plan_steps(category);
CREATE INDEX IF NOT EXISTS idx_emergency_plan_steps_order ON emergency_plan_steps(order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE emergency_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_plan_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_plans
-- Users can view plans in networks they are members of
CREATE POLICY "Users can view emergency plans in their networks" ON emergency_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = emergency_plans.network_id 
            AND network_members.user_id = auth.uid()
        )
    );

-- Users can insert plans in networks they are members of
CREATE POLICY "Users can insert emergency plans in their networks" ON emergency_plans
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM network_members 
            WHERE network_members.network_id = emergency_plans.network_id 
            AND network_members.user_id = auth.uid()
        )
    );

-- Users can update plans they created
CREATE POLICY "Users can update their own emergency plans" ON emergency_plans
    FOR UPDATE USING (
        auth.uid() = created_by
    );

-- Users can delete plans they created
CREATE POLICY "Users can delete their own emergency plans" ON emergency_plans
    FOR DELETE USING (
        auth.uid() = created_by
    );

-- RLS Policies for emergency_plan_steps
-- Users can view steps of plans they can access
CREATE POLICY "Users can view emergency plan steps" ON emergency_plan_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM emergency_plans ep
            JOIN network_members nm ON nm.network_id = ep.network_id
            WHERE ep.id = emergency_plan_steps.plan_id 
            AND nm.user_id = auth.uid()
        )
    );

-- Users can insert steps for plans they created
CREATE POLICY "Users can insert emergency plan steps" ON emergency_plan_steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM emergency_plans ep
            WHERE ep.id = emergency_plan_steps.plan_id 
            AND ep.created_by = auth.uid()
        )
    );

-- Users can update steps for plans they created
CREATE POLICY "Users can update emergency plan steps" ON emergency_plan_steps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM emergency_plans ep
            WHERE ep.id = emergency_plan_steps.plan_id 
            AND ep.created_by = auth.uid()
        )
    );

-- Users can delete steps for plans they created
CREATE POLICY "Users can delete emergency plan steps" ON emergency_plan_steps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM emergency_plans ep
            WHERE ep.id = emergency_plan_steps.plan_id 
            AND ep.created_by = auth.uid()
        )
    );

-- Function to update updated_at timestamp for emergency_plans
CREATE OR REPLACE FUNCTION update_emergency_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp for emergency_plan_steps
CREATE OR REPLACE FUNCTION update_emergency_plan_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_emergency_plans_updated_at
    BEFORE UPDATE ON emergency_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_emergency_plans_updated_at();

CREATE TRIGGER update_emergency_plan_steps_updated_at
    BEFORE UPDATE ON emergency_plan_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_emergency_plan_steps_updated_at();

-- Function to ensure only one active plan per network
CREATE OR REPLACE FUNCTION ensure_single_active_plan()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new plan is being set as active, deactivate all other plans in the network
    IF NEW.is_active = true THEN
        UPDATE emergency_plans 
        SET is_active = false 
        WHERE network_id = NEW.network_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active plan per network
CREATE TRIGGER ensure_single_active_plan_trigger
    BEFORE INSERT OR UPDATE ON emergency_plans
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_plan();

-- Insert default emergency plan template
INSERT INTO emergency_plans (id, name, network_id, created_by, is_active, is_default)
VALUES (
    gen_random_uuid(),
    'Varsayılan Acil Durum Planı',
    (SELECT id FROM networks WHERE name LIKE '%Aile%' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    true,
    true
) ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE emergency_plans IS 'Stores emergency action plans created by network members';
COMMENT ON COLUMN emergency_plans.name IS 'Name of the emergency plan';
COMMENT ON COLUMN emergency_plans.network_id IS 'ID of the network this plan belongs to';
COMMENT ON COLUMN emergency_plans.created_by IS 'ID of the user who created this plan';
COMMENT ON COLUMN emergency_plans.is_active IS 'Whether this plan is currently active for the network';
COMMENT ON COLUMN emergency_plans.is_default IS 'Whether this is a system-provided default plan';

COMMENT ON TABLE emergency_plan_steps IS 'Stores individual steps within emergency plans';
COMMENT ON COLUMN emergency_plan_steps.plan_id IS 'ID of the emergency plan this step belongs to';
COMMENT ON COLUMN emergency_plan_steps.title IS 'Title/name of the step';
COMMENT ON COLUMN emergency_plan_steps.description IS 'Detailed description of the step';
COMMENT ON COLUMN emergency_plan_steps.category IS 'Category of the step (emergency or post_emergency)';
COMMENT ON COLUMN emergency_plan_steps.order_index IS 'Order of the step within its category';
COMMENT ON COLUMN emergency_plan_steps.safe_zone_id IS 'Optional reference to a safe zone for this step'; 