-- Fresh Setup: Session-Based Sharing for Cricket Scoring App
-- Use this script if you're setting up the database for the first time
-- (No existing matches table to migrate from)

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    session_code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table with session support
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    session_code TEXT NOT NULL REFERENCES sessions(session_code) ON DELETE CASCADE,
    match_number INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    match_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_code, match_number)
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_code ON sessions(session_code);
CREATE INDEX idx_sessions_created_by ON sessions(created_by);
CREATE INDEX idx_matches_session_code ON matches(session_code);
CREATE INDEX idx_matches_created_by ON matches(created_by);
CREATE INDEX idx_matches_session_match ON matches(session_code, match_number);

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
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup complete! Tables created: sessions, matches';
    RAISE NOTICE 'Next step: Enable Realtime for the matches table in Database > Replication';
END $$;
