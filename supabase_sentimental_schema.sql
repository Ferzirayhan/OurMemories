-- Love Reasons Table (Virtual Love Jar)
CREATE TABLE IF NOT EXISTS love_reasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    color TEXT DEFAULT '#FFC0CB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Future Letters Table
CREATE TABLE IF NOT EXISTS future_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_opened BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Notes Table
CREATE TABLE IF NOT EXISTS voice_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Kangen', 'Tidur', 'Semangat', 'Random')),
    audio_url TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memories Table
CREATE TABLE IF NOT EXISTS memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    curhatan TEXT,
    image_url TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood Letters Table
CREATE TABLE IF NOT EXISTS mood_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mood TEXT NOT NULL CHECK (mood IN ('Happy', 'Neutral', 'Tired', 'Sad')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



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


-- Enable RLS for all tables
ALTER TABLE love_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorable_places ENABLE ROW LEVEL SECURITY;



-- Allow public read access
CREATE POLICY "Allow public read access" ON love_reasons FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON future_letters FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON voice_notes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON milestones FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON memories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON mood_letters FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON memorable_places FOR SELECT USING (true);



-- Allow public insert access
CREATE POLICY "Allow public insert" ON love_reasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON future_letters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON memorable_places FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON voice_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON mood_letters FOR INSERT WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Allow public delete" ON memories FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON love_reasons FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON milestones FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON memorable_places FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON voice_notes FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON future_letters FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON mood_letters FOR DELETE USING (true);

-- Allow public update for future letters (mark as opened)
CREATE POLICY "Allow public update" ON future_letters FOR UPDATE USING (true) WITH CHECK (true);

-- Allow authenticated all
CREATE POLICY "Allow auth all" ON love_reasons FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all" ON future_letters FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all" ON voice_notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all" ON milestones FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all" ON memories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all" ON mood_letters FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow auth all" ON memorable_places FOR ALL TO authenticated USING (true);


