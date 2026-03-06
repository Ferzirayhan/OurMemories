-- =============================================
-- Dear Ezi Table — Safe space for Ratih to share her feelings
-- =============================================

CREATE TABLE IF NOT EXISTS dear_ezi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    mood TEXT,                              -- optional emoji mood
    reply TEXT,                             -- Ezi's reply (admin only)
    replied_at TIMESTAMPTZ,                 -- when Ezi replied
    author TEXT NOT NULL DEFAULT 'Ratih',
    is_read BOOLEAN DEFAULT FALSE,          -- Ezi read silently (not shown to Ratih)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dear_ezi ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read dear_ezi"
    ON dear_ezi FOR SELECT USING (true);

CREATE POLICY "Allow public insert dear_ezi"
    ON dear_ezi FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update dear_ezi"
    ON dear_ezi FOR UPDATE USING (true);

CREATE POLICY "Allow public delete dear_ezi"
    ON dear_ezi FOR DELETE USING (true);
