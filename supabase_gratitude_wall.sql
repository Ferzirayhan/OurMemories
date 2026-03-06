-- =============================================
-- Gratitude Wall Table
-- =============================================

CREATE TABLE IF NOT EXISTS gratitude_wall (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gratitude_wall ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read gratitude_wall"
    ON gratitude_wall FOR SELECT USING (true);

CREATE POLICY "Allow public insert gratitude_wall"
    ON gratitude_wall FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete gratitude_wall"
    ON gratitude_wall FOR DELETE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE gratitude_wall;
