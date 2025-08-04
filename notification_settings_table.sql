-- Bildirim ayarları tablosu
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sources TEXT[] NOT NULL DEFAULT '{}',
  magnitude_range JSONB NOT NULL DEFAULT '{"min": 3.0, "max": 10.0}',
  location JSONB NOT NULL DEFAULT '{"type": "all", "cities": null}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirim ayarlarını görebilir
CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi bildirim ayarlarını ekleyebilir
CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar sadece kendi bildirim ayarlarını güncelleyebilir
CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi bildirim ayarlarını silebilir
CREATE POLICY "Users can delete own notification settings" ON notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at alanını otomatik güncellemek için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- İndeksler
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_settings_is_active ON notification_settings(is_active);
CREATE INDEX idx_notification_settings_created_at ON notification_settings(created_at DESC); 