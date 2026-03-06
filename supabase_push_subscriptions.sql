-- =============================================
-- Push Subscriptions Table
-- =============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Anonymous',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read push_subscriptions"
    ON push_subscriptions FOR SELECT USING (true);

CREATE POLICY "Allow public insert push_subscriptions"
    ON push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update push_subscriptions"
    ON push_subscriptions FOR UPDATE USING (true);

CREATE POLICY "Allow public delete push_subscriptions"
    ON push_subscriptions FOR DELETE USING (true);
