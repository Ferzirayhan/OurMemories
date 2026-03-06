-- Add author column to voice_notes
ALTER TABLE voice_notes ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ezi';

-- Make category nullable (we'll use it for mood-based categorization)
ALTER TABLE voice_notes ALTER COLUMN category DROP NOT NULL;

-- Drop the CHECK constraint so we can use mood categories too
ALTER TABLE voice_notes DROP CONSTRAINT IF EXISTS voice_notes_category_check;

-- Ensure all RLS policies exist for voice_notes
DROP POLICY IF EXISTS "Allow public read access" ON voice_notes;
CREATE POLICY "Allow public read access" ON voice_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON voice_notes;
CREATE POLICY "Allow public insert" ON voice_notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete" ON voice_notes;
CREATE POLICY "Allow public delete" ON voice_notes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public update" ON voice_notes;
CREATE POLICY "Allow public update" ON voice_notes FOR UPDATE USING (true);

-- Create storage bucket for voice notes (run in Supabase Dashboard > SQL Editor)
-- Note: Storage bucket creation via SQL may require running this manually:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for the voice-notes bucket (run after bucket is created):
-- CREATE POLICY "Allow public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voice-notes');
-- CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'voice-notes');
-- CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id = 'voice-notes');
