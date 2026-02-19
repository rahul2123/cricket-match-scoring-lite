-- Migration: Add global player profiles and update stats tables
-- This enables unique players across tournaments with aggregated stats

-- Create player_profiles table for global players
CREATE TABLE IF NOT EXISTS player_profiles (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_players table to link profiles to teams
CREATE TABLE IF NOT EXISTS team_players (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    profile_id BIGINT NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'batsman' CHECK (role IN ('batsman', 'bowler', 'all-rounder')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, profile_id)
);

-- Add profile_id to player_batting_stats
ALTER TABLE player_batting_stats
ADD COLUMN IF NOT EXISTS profile_id BIGINT REFERENCES player_profiles(id),
ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS bowler_profile_id BIGINT REFERENCES player_profiles(id),
ADD COLUMN IF NOT EXISTS fielder_profile_id BIGINT REFERENCES player_profiles(id);

-- Add profile_id to player_bowling_stats
ALTER TABLE player_bowling_stats
ADD COLUMN IF NOT EXISTS profile_id BIGINT REFERENCES player_profiles(id),
ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS wides INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_balls INTEGER DEFAULT 0;

-- Update bowling_stats overs column to store balls instead
-- (This is a semantic change - the column still stores balls)
-- 4.3 overs = 27 balls, stored as 27

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_profile_id ON team_players(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_batting_profile ON player_batting_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_bowling_profile ON player_bowling_stats(profile_id);

-- Enable RLS on new tables
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_profiles
CREATE POLICY "Player profiles are viewable by everyone" ON player_profiles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create profiles" ON player_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profiles" ON player_profiles FOR UPDATE USING (created_by = auth.uid()::text);

-- RLS Policies for team_players
CREATE POLICY "Team players are viewable by everyone" ON team_players FOR SELECT USING (true);
CREATE POLICY "Tournament creators can add team players" ON team_players FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM teams t
        JOIN tournaments tor ON tor.id = t.tournament_id
        WHERE t.id = team_players.team_id AND tor.created_by = auth.uid()::text
    )
);
CREATE POLICY "Tournament creators can delete team players" ON team_players FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM teams t
        JOIN tournaments tor ON tor.id = t.tournament_id
        WHERE t.id = team_players.team_id AND tor.created_by = auth.uid()::text
    )
);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_profiles_updated_at
    BEFORE UPDATE ON player_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
