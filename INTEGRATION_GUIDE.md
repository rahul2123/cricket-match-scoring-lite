# Player Tracking Integration Guide

## Overview

This guide explains how to integrate the player tracking system with tournament match scoring.

## New Components Created

### 1. PlayerSelectionDialog (`src/components/scoring/PlayerSelectionDialog.tsx`)
Reusable dialog for selecting players with single/multi-select support.

### 2. MatchPlayerManager (`src/components/scoring/MatchPlayerManager.tsx`)
Handles all player selection during match:
- Team setup (initializing player lists)
- Opening batsmen selection
- Bowler selection
- Next batsman after wicket

### 3. CurrentPlayers (`src/components/scoring/CurrentPlayers.tsx`)
Displays current striker, non-striker, and bowler with their live stats.

### 4. BattingScorecard (`src/components/scoring/BattingScorecard.tsx`)
Full batting scorecard with dismissal details.

### 5. BowlingFigures (`src/components/scoring/BowlingFigures.tsx`)
Bowling figures for all bowlers.

## Integration Steps

### Step 1: Update TeamManager to use global players
In `TeamManager.tsx`, replace the old player form with `PlayerRoster` component.

### Step 2: Load team players in TournamentMatchView
Before starting the match, load players using:
```typescript
const players = await playerApi.getTeamPlayers(teamId);
```

### Step 3: Replace current scoring view
Use `TournamentMatchScoringView.example.tsx` as reference to update `App.tsx`.

### Step 4: Save player stats on match completion
After match ends, save stats to database:
```typescript
// For each batsman
await playerApi.saveBattingStats({
  tournamentMatchId: match.id,
  profileId: batsman.profileId,
  teamId: team.id,
  runs: batsman.runs,
  balls: batsman.balls,
  fours: batsman.fours,
  sixes: batsman.sixes,
  isOut: batsman.isOut,
  dismissalType: batsman.dismissalType,
});

// For each bowler
await playerApi.saveBowlingStats({
  tournamentMatchId: match.id,
  profileId: bowler.profileId,
  teamId: team.id,
  balls: bowler.balls,
  runsConceded: bowler.runs,
  wickets: bowler.wickets,
  maidens: bowler.maidens,
  wides: bowler.wides,
  noBalls: bowler.noBalls,
});
```

## Match Flow

1. **Toss Dialog** → Select which team bats first
2. **Team Setup** → MatchPlayerManager auto-initializes team players
3. **Opening Batsmen** → Select striker and non-striker
4. **Bowler Selection** → Select opening bowler
5. **Scoring** → All balls now attributed to batsman and bowler
6. **Wicket** → Next batsman dialog appears
7. **End of Over** → Strike rotation + bowler change option
8. **Innings Break** → Reset for second innings
9. **Match End** → Save all player stats to database

## Key Changes from Old System

### Before
```typescript
// Old: Just tracked runs, wickets, balls
interface InningState {
  runs: number;
  balls: number;
  wickets: number;
}
```

### After
```typescript
// New: Full player tracking
interface InningState {
  runs: number;
  balls: number;
  wickets: number;
  strikerId?: number;           // Current batsman
  nonStrikerId?: number;        // Other batsman
  bowlerId?: number;            // Current bowler
  batsmen: Record<number, BatsmanState>;
  bowlers: Record<number, BowlerState>;
}
```

## Automatic Behaviors

- **Strike Rotation**: Automatic on odd runs and end of over
- **Next Batsman**: Auto-prompted after wicket
- **Bowler Stats**: Tracked per ball (runs, wides, no-balls, wickets)
- **Maiden Tracking**: Calculated when over completes with 0 runs

## Notes

- Players must be added to teams before match can start
- Minimum 2 players per team required
- All player stats saved globally across tournaments
- Career stats aggregated automatically
