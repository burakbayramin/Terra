-- Premium Subscription Table
-- Bu tablo kullanıcıların premium abonelik bilgilerini saklar

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Premium durumu
    is_premium BOOLEAN DEFAULT FALSE,
    premium_package_type TEXT DEFAULT 'free' CHECK (premium_package_type IN ('free', 'supporter', 'protector', 'sponsor')),
    
    -- Ödeme bilgileri
    payment_period TEXT DEFAULT 'monthly' CHECK (payment_period IN ('monthly', 'yearly')),
    first_payment_date TIMESTAMP WITH TIME ZONE,
    next_payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Abonelik bilgileri
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT FALSE,
    auto_renew BOOLEAN DEFAULT FALSE,
    
    -- Ödeme sağlayıcısı bilgileri
    payment_provider TEXT, -- 'stripe', 'apple', 'google' gibi
    payment_provider_subscription_id TEXT,
    
    -- Meta bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_premium ON user_subscriptions(is_premium);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_payment_date ON user_subscriptions(next_payment_date);

-- RLS (Row Level Security) Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi abonelik bilgilerini görebilir
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi abonelik bilgilerini güncelleyebilir
CREATE POLICY "Users can update own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi abonelik bilgilerini silebilir
CREATE POLICY "Users can delete own subscription" ON user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi abonelik bilgilerini ekleyebilir
CREATE POLICY "Users can insert own subscription" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Premium Package Features Table
-- Bu tablo premium özelliklerin hangi paketlerde mevcut olduğunu tanımlar
CREATE TABLE IF NOT EXISTS premium_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    required_package_type TEXT NOT NULL CHECK (required_package_type IN ('free', 'supporter', 'protector', 'sponsor')),
    location TEXT, -- Hangi ekran/bileşende kullanıldığı
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Premium özellikler için trigger
CREATE TRIGGER update_premium_features_updated_at 
    BEFORE UPDATE ON premium_features 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Default premium features
INSERT INTO premium_features (feature_id, name, description, required_package_type, location) VALUES
('all-comments', 'Tüm Yorumları Gör', 'Deprem detay sayfasında tüm kullanıcı yorumlarını görüntüleyin', 'supporter', 'earthquake-detail'),
('terra-ai-comment', 'Terra AI Deprem Yorumu', 'Deprem detay sayfasında AI tarafından oluşturulan özel yorumları görün', 'supporter', 'earthquake-detail'),
('earthquake-risk-analysis', 'Deprem Risk Analizi', 'Gelişmiş deprem risk analizi ve tahmin araçlarına erişim', 'protector', 'home'),
('detailed-statistics', 'Detaylı İstatistikler', 'Gelişmiş deprem istatistikleri ve analiz raporları', 'protector', 'home'),
('smart-notification-engine', 'Akıllı Bildirim Kural Motoru', 'Gelişmiş bildirim kuralları ve otomatik filtreleme', 'supporter', 'home'),
('risk-assessment-ai', 'Risk Değerlendirme AI Yorumu', 'Risk formu sonuçlarında AI tarafından oluşturulan detaylı analizler', 'supporter', 'risk-form'),
('terra-ai-daily-questions', 'Terra AI Günlük 3+ Soru Kullanımı', 'Günlük AI soru limitini aşın ve sınırsız AI desteği alın', 'supporter', 'ai-menu')
ON CONFLICT (feature_id) DO NOTHING;

-- Premium Package History Table
-- Bu tablo kullanıcıların abonelik geçmişini saklar
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Abonelik bilgileri
    package_type TEXT NOT NULL CHECK (package_type IN ('free', 'supporter', 'protector', 'sponsor')),
    payment_period TEXT NOT NULL CHECK (payment_period IN ('monthly', 'yearly')),
    
    -- Tarih bilgileri
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Durum bilgileri
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'upgraded', 'downgraded')),
    reason TEXT, -- İptal nedeni, yükseltme nedeni gibi
    
    -- Ödeme bilgileri
    payment_amount DECIMAL(10,2),
    payment_currency TEXT DEFAULT 'TRY',
    payment_provider TEXT,
    
    -- Meta bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for history table
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_start_date ON subscription_history(start_date);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);

-- RLS for history table
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history" ON subscription_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription history" ON subscription_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get user's current premium level
CREATE OR REPLACE FUNCTION get_user_premium_level(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    premium_level TEXT;
BEGIN
    SELECT premium_package_type INTO premium_level
    FROM user_subscriptions
    WHERE user_id = user_uuid AND is_active = TRUE;
    
    RETURN COALESCE(premium_level, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_level TEXT;
    required_level TEXT;
    level_weights INTEGER;
BEGIN
    -- Get user's current level
    SELECT get_user_premium_level(user_uuid) INTO user_level;
    
    -- Get required level for the feature
    SELECT required_package_type INTO required_level
    FROM premium_features
    WHERE feature_id = feature_id_param AND is_active = TRUE;
    
    -- If feature not found, allow access
    IF required_level IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Define level weights
    CASE user_level
        WHEN 'free' THEN level_weights := 0;
        WHEN 'supporter' THEN level_weights := 1;
        WHEN 'protector' THEN level_weights := 2;
        WHEN 'sponsor' THEN level_weights := 3;
        ELSE level_weights := 0;
    END CASE;
    
    -- Check if user level is sufficient
    CASE required_level
        WHEN 'free' THEN RETURN level_weights >= 0;
        WHEN 'supporter' THEN RETURN level_weights >= 1;
        WHEN 'protector' THEN RETURN level_weights >= 2;
        WHEN 'sponsor' THEN RETURN level_weights >= 3;
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 