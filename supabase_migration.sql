-- Migration: Convert from match-based to session-based sharing
-- This migration creates a new sessions table and updates the matches table

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    session_code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create new matches table with session support
CREATE TABLE IF NOT EXISTS matches_new (
    id BIGSERIAL PRIMARY KEY,
    session_code TEXT NOT NULL REFERENCES sessions(session_code) ON DELETE CASCADE,
    match_number INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    match_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_code, match_number)
);

-- Migrate existing data (if matches table exists)
-- Note: This assumes old matches table had match_code and created_by fields
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matches') THEN
        -- Create sessions from existing matches
        INSERT INTO sessions (session_code, created_by, created_at)
        SELECT DISTINCT match_code, created_by, created_at
        FROM matches
        ON CONFLICT (session_code) DO NOTHING;
        
        -- Migrate matches to new structure
        INSERT INTO matches_new (session_code, match_number, created_by, match_state, created_at, updated_at)
        SELECT match_code, 1, created_by, match_state, created_at, updated_at
        FROM matches;
        
        -- Drop old matches table
        DROP TABLE matches;
    END IF;
END $$;

-- Rename new matches table
ALTER TABLE IF EXISTS matches_new RENAME TO matches;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_session_code ON matches(session_code);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_session_match ON matches(session_code, match_number);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
-- Allow anyone to read sessions (for joining)
CREATE POLICY "Allow public read access to sessions"
    ON sessions FOR SELECT
    USING (true);

-- Allow authenticated users to create sessions
CREATE POLICY "Allow authenticated users to create sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid()::text = created_by);

-- Allow users to delete their own sessions
CREATE POLICY "Allow users to delete own sessions"
    ON sessions FOR DELETE
    USING (auth.uid()::text = created_by);

-- Create policies for matches
-- Allow anyone to read matches (for viewing)
CREATE POLICY "Allow public read access to matches"
    ON matches FOR SELECT
    USING (true);

-- Allow authenticated users to create matches
CREATE POLICY "Allow authenticated users to create matches"
    ON matches FOR INSERT
    WITH CHECK (auth.uid()::text = created_by);

-- Allow users to update their own matches
CREATE POLICY "Allow users to update own matches"
    ON matches FOR UPDATE
    USING (auth.uid()::text = created_by);

-- Allow users to delete their own matches
CREATE POLICY "Allow users to delete own matches"
    ON matches FOR DELETE
    USING (auth.uid()::text = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
