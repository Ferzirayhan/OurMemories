-- Create bucket_list table
CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- Allow all operations for everyone (both Ezi and Ratih can add/delete/update)
CREATE POLICY "Allow public select" ON bucket_list FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON bucket_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON bucket_list FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON bucket_list FOR DELETE USING (true);

-- Seed with initial bucket list items
INSERT INTO bucket_list (title, is_completed) VALUES
  ('Watch Coldplay concert together', false),
  ('Road trip across the island', false),
  ('Cook a failed viral recipe together in the kitchen', true),
  ('Watch the sunrise from the mountain top', false),
  ('Adopt a cute puppy', false);
