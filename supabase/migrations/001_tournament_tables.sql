-- Cricket Tournament Tables Migration
-- Run this in Supabase SQL Editor to create tournament tables

-- =============================================================================
-- 1. TOURNAMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS tournaments (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    overs_per_match INTEGER NOT NULL DEFAULT 20,
    points_win INTEGER NOT NULL DEFAULT 2,
    points_tie INTEGER NOT NULL DEFAULT 1,
    points_loss INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_code ON tournaments(code);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);

-- =============================================================================
-- 2. TEAMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);

-- =============================================================================
-- 3. PLAYERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'batsman' CHECK (role IN ('batsman', 'bowler', 'all-rounder')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);

-- =============================================================================
-- 4. TOURNAMENT MATCHES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS tournament_matches (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_a_id BIGINT NOT NULL REFERENCES teams(id),
    team_b_id BIGINT NOT NULL REFERENCES teams(id),
    match_number INTEGER NOT NULL,
    scheduled_date DATE,
    overs INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'abandoned')),
    winner_team_id BIGINT REFERENCES teams(id),
    result_type TEXT CHECK (result_type IN ('win', 'tie', 'no_result')),
    match_state JSONB,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, match_number),
    CHECK (team_a_id != team_b_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_teams ON tournament_matches(team_a_id, team_b_id);

-- =============================================================================
-- 5. INNINGS STATS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS innings_stats (
    id BIGSERIAL PRIMARY KEY,
    tournament_match_id BIGINT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES teams(id),
    inning_number INTEGER NOT NULL CHECK (inning_number IN (1, 2)),
    runs_scored INTEGER NOT NULL DEFAULT 0,
    overs_faced DECIMAL(5,1) NOT NULL DEFAULT 0,
    wickets_lost INTEGER NOT NULL DEFAULT 0,
    is_all_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_match_id, team_id, inning_number)
);

CREATE INDEX IF NOT EXISTS idx_innings_stats_match ON innings_stats(tournament_match_id);
CREATE INDEX IF NOT EXISTS idx_innings_stats_team ON innings_stats(team_id);

-- =============================================================================
-- 6. PLAYER BATTING STATS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS player_batting_stats (
    id BIGSERIAL PRIMARY KEY,
    tournament_match_id BIGINT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    runs INTEGER NOT NULL DEFAULT 0,
    balls INTEGER NOT NULL DEFAULT 0,
    fours INTEGER NOT NULL DEFAULT 0,
    sixes INTEGER NOT NULL DEFAULT 0,
    is_out BOOLEAN DEFAULT FALSE,
    dismissal_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_batting_match ON player_batting_stats(tournament_match_id);
CREATE INDEX IF NOT EXISTS idx_player_batting_player ON player_batting_stats(player_id);

-- =============================================================================
-- 7. PLAYER BOWLING STATS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS player_bowling_stats (
    id BIGSERIAL PRIMARY KEY,
    tournament_match_id BIGINT NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    overs DECIMAL(5,1) NOT NULL DEFAULT 0,
    runs_conceded INTEGER NOT NULL DEFAULT 0,
    wickets INTEGER NOT NULL DEFAULT 0,
    maidens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_bowling_match ON player_bowling_stats(tournament_match_id);
CREATE INDEX IF NOT EXISTS idx_player_bowling_player ON player_bowling_stats(player_id);

-- =============================================================================
-- 8. TOURNAMENT MEMBERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS tournament_members (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'scorer', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_members_tournament ON tournament_members(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_members_user ON tournament_members(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_batting_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_bowling_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_members ENABLE ROW LEVEL SECURITY;

-- TOURNAMENTS
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Users can create tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own tournaments" ON tournaments FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "Users can delete their own tournaments" ON tournaments FOR DELETE USING (created_by = auth.uid()::text);

-- TEAMS
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Tournament creators can add teams" ON teams FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = teams.tournament_id AND tournaments.created_by = auth.uid()::text)
);
CREATE POLICY "Tournament creators can update teams" ON teams FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = teams.tournament_id AND tournaments.created_by = auth.uid()::text)
);
CREATE POLICY "Tournament creators can delete teams" ON teams FOR DELETE USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = teams.tournament_id AND tournaments.created_by = auth.uid()::text)
);

-- PLAYERS
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Tournament creators can add players" ON players FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams t JOIN tournaments tor ON tor.id = t.tournament_id WHERE t.id = players.team_id AND tor.created_by = auth.uid()::text)
);
CREATE POLICY "Tournament creators can delete players" ON players FOR DELETE USING (
    EXISTS (SELECT 1 FROM teams t JOIN tournaments tor ON tor.id = t.tournament_id WHERE t.id = players.team_id AND tor.created_by = auth.uid()::text)
);

-- TOURNAMENT_MATCHES
CREATE POLICY "Tournament matches are viewable by everyone" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Tournament creators can create matches" ON tournament_matches FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_matches.tournament_id AND tournaments.created_by = auth.uid()::text)
);
CREATE POLICY "Tournament creators can update matches" ON tournament_matches FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_matches.tournament_id AND tournaments.created_by = auth.uid()::text)
);

-- INNINGS_STATS
CREATE POLICY "Innings stats are viewable by everyone" ON innings_stats FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage innings stats" ON innings_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM tournament_matches tm JOIN tournaments t ON t.id = tm.tournament_id WHERE tm.id = innings_stats.tournament_match_id AND t.created_by = auth.uid()::text)
);

-- PLAYER_BATTING_STATS
CREATE POLICY "Player batting stats are viewable by everyone" ON player_batting_stats FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage batting stats" ON player_batting_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM tournament_matches tm JOIN tournaments t ON t.id = tm.tournament_id WHERE tm.id = player_batting_stats.tournament_match_id AND t.created_by = auth.uid()::text)
);

-- PLAYER_BOWLING_STATS
CREATE POLICY "Player bowling stats are viewable by everyone" ON player_bowling_stats FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage bowling stats" ON player_bowling_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM tournament_matches tm JOIN tournaments t ON t.id = tm.tournament_id WHERE tm.id = player_bowling_stats.tournament_match_id AND t.created_by = auth.uid()::text)
);

-- TOURNAMENT_MEMBERS
CREATE POLICY "Tournament members are viewable by everyone" ON tournament_members FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage members" ON tournament_members FOR ALL USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_members.tournament_id AND tournaments.created_by = auth.uid()::text)
);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournament_matches_updated_at ON tournament_matches;
CREATE TRIGGER update_tournament_matches_updated_at
    BEFORE UPDATE ON tournament_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
