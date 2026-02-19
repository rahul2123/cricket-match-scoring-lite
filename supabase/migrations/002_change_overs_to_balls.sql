-- Migration: Change overs_faced to balls_faced in innings_stats
-- This stores raw balls (integer) instead of decimal overs for more accurate NRR calculation

-- Step 1: Add the new column
ALTER TABLE innings_stats
ADD COLUMN IF NOT EXISTS balls_faced INTEGER;

-- Step 2: Migrate existing data (convert decimal overs to balls)
-- Note: This assumes overs_faced was stored as "overs.balls" format (e.g., 19.3 = 19.3)
-- We convert: 19.3 -> 19 overs + 3 balls = 19*6 + 3 = 117 balls
UPDATE innings_stats
SET balls_faced = (
    FLOOR(overs_faced) * 6 + ROUND((overs_faced - FLOOR(overs_faced)) * 10)
)
WHERE balls_faced IS NULL AND overs_faced IS NOT NULL;

-- Step 3: Set default and make NOT NULL
ALTER TABLE innings_stats
ALTER COLUMN balls_faced SET DEFAULT 0;

ALTER TABLE innings_stats
ALTER COLUMN balls_faced SET NOT NULL;

-- Step 4: Drop the old column (optional - can keep for reference)
-- Uncomment the line below if you want to remove the old column
-- ALTER TABLE innings_stats DROP COLUMN IF EXISTS overs_faced;

-- Step 5: Add batting_first_team_id to tournament_matches (from previous fix)
ALTER TABLE tournament_matches
ADD COLUMN IF NOT EXISTS batting_first_team_id BIGINT REFERENCES teams(id);
