-- ============================================
-- FIX ALL RLS POLICIES & MISSING COLUMNS
-- ============================================

-- 1. Add missing 'color' column to love_reasons
ALTER TABLE love_reasons ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FFC0CB';

-- 2. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS memorable_places (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE memorable_places ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON memorable_places;
CREATE POLICY "Allow public read access" ON memorable_places FOR SELECT USING (true);

-- 3. Drop & recreate DELETE policies for all tables
DROP POLICY IF EXISTS "Allow public delete" ON memories;
DROP POLICY IF EXISTS "Allow public delete" ON love_reasons;
DROP POLICY IF EXISTS "Allow public delete" ON milestones;
DROP POLICY IF EXISTS "Allow public delete" ON memorable_places;
DROP POLICY IF EXISTS "Allow public delete" ON voice_notes;
DROP POLICY IF EXISTS "Allow public delete" ON future_letters;
DROP POLICY IF EXISTS "Allow public delete" ON mood_letters;

CREATE POLICY "Allow public delete" ON memories FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON love_reasons FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON milestones FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON memorable_places FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON voice_notes FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON future_letters FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON mood_letters FOR DELETE USING (true);

-- 4. Drop & recreate INSERT policies for all tables
DROP POLICY IF EXISTS "Allow public insert" ON memories;
DROP POLICY IF EXISTS "Allow public insert" ON love_reasons;
DROP POLICY IF EXISTS "Allow public insert" ON milestones;
DROP POLICY IF EXISTS "Allow public insert" ON memorable_places;
DROP POLICY IF EXISTS "Allow public insert" ON voice_notes;
DROP POLICY IF EXISTS "Allow public insert" ON future_letters;
DROP POLICY IF EXISTS "Allow public insert" ON mood_letters;

CREATE POLICY "Allow public insert" ON memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON love_reasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON memorable_places FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON voice_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON future_letters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON mood_letters FOR INSERT WITH CHECK (true);

-- 5. UPDATE policy for future_letters (needed to mark letters as opened)
DROP POLICY IF EXISTS "Allow public update" ON future_letters;
CREATE POLICY "Allow public update" ON future_letters FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Storage policies for memories bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public storage select memories'
  ) THEN
    CREATE POLICY "Allow public storage select memories" ON storage.objects FOR SELECT USING (bucket_id = 'memories');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public storage insert memories'
  ) THEN
    CREATE POLICY "Allow public storage insert memories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memories');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public storage delete memories'
  ) THEN
    CREATE POLICY "Allow public storage delete memories" ON storage.objects FOR DELETE USING (bucket_id = 'memories');
  END IF;
END $$;
