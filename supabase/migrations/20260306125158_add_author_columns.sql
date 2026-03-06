-- Add author column to all content tables
ALTER TABLE love_reasons ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ratih';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ratih';
ALTER TABLE future_letters ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ratih';
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ratih';
ALTER TABLE memorable_places ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ratih';

-- Create notes table if not exists (Notebook feature)
CREATE TABLE IF NOT EXISTS notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    text text NOT NULL,
    date text,
    author text DEFAULT 'Ratih',
    created_at timestamptz DEFAULT now()
);

-- Add author column to notes if table already existed without it
ALTER TABLE notes ADD COLUMN IF NOT EXISTS author text DEFAULT 'Ratih';

-- Enable RLS on notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Notes RLS policies
DROP POLICY IF EXISTS "Allow public select notes" ON notes;
CREATE POLICY "Allow public select notes" ON notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert notes" ON notes;
CREATE POLICY "Allow public insert notes" ON notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete notes" ON notes;
CREATE POLICY "Allow public delete notes" ON notes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public update notes" ON notes;
CREATE POLICY "Allow public update notes" ON notes FOR UPDATE USING (true);

-- Add DELETE policy for future_letters (was missing)
DROP POLICY IF EXISTS "Allow public delete future_letters" ON future_letters;
CREATE POLICY "Allow public delete future_letters" ON future_letters FOR DELETE USING (true);
