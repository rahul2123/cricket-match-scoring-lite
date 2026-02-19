# Cricket Match Scoring Lite

A Progressive Web App for scoring cricket matches with real-time sharing and tournament management capabilities.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Routing:** React Router v6
- **Styling:** TailwindCSS with custom cricket-themed colors
- **State Management:** Custom hooks with `useReducer` pattern (`useMatch`, `useTournament`)
- **Backend:** Supabase (PostgreSQL + Realtime)
- **PWA:** Service worker for offline functionality

## Project Structure

```
src/
├── components/
│   ├── ScoreBoard.tsx          # Main score display (runs, wickets, overs, CRR/RRR)
│   ├── ScoringButtons.tsx      # Run scoring buttons (0-6, wides, no-balls, etc.)
│   ├── BallHistory.tsx         # Ball-by-ball delivery log
│   ├── ShareMatchDialog.tsx    # UI for sharing matches
│   ├── JoinMatchDialog.tsx     # UI for joining shared matches
│   └── tournament/
│       ├── TournamentList.tsx       # List of user's tournaments + create new
│       ├── TournamentDashboard.tsx  # Tournament overview (teams, matches, standings)
│       ├── CreateTournamentDialog.tsx # Tournament creation form
│       ├── TeamManager.tsx          # Team and player management
│       ├── MatchScheduler.tsx       # Schedule matches between teams
│       └── StandingsTable.tsx       # Tournament standings with NRR
├── hooks/
│   ├── useMatch.ts             # Core match state management (reducer pattern)
│   └── useTournament.ts        # Tournament state management + useUserTournaments
├── utils/
│   ├── storage.ts              # LocalStorage abstraction
│   ├── shareMatch.ts           # Supabase session sharing logic
│   ├── supabase.ts             # Supabase client configuration
│   ├── helpers.ts              # Cricket-specific helpers (overs formatting)
│   └── tournamentApi.ts        # Tournament CRUD operations + real-time subscriptions
├── types/
│   ├── index.ts                # Core types (MatchState, Ball, Innings)
│   └── tournament.ts           # Tournament types (Tournament, Team, Player, Match, Standings)
├── App.tsx                     # Main application with routing
├── main.tsx                    # React app entry point
└── index.css                   # Global styles
```

## Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `ScoringView` | Main scoring interface (default) |
| `/tournaments` | `TournamentListView` | List user's tournaments |
| `/tournaments/:code` | `TournamentDashboardView` | Tournament dashboard |
| `/tournaments/:code/match/:matchId` | `TournamentMatchView` | Score a tournament match |

## Key Features

### Scoring
- Ball-by-ball scoring with all delivery types: runs (0-6), wickets, wides, no-balls, byes, leg byes
- Correct cricket rules (wides/no-balls don't count as valid deliveries)
- Two innings support with target setting
- Current Run Rate (CRR) and Required Run Rate (RRR) calculations
- Undo functionality for any delivery
- Innings end detection and manual end innings option

### Session Sharing
- Create unique 6-character session codes
- Share matches via URL with session code
- Real-time synchronization using Supabase Realtime
- Anonymous authentication with Supabase
- Join existing sessions by code

### Tournament Management
- Create tournaments with custom overs and points configuration
- Add teams with short names
- Add players to teams with roles (batsman, bowler, all-rounder)
- Schedule matches between teams
- Real-time tournament standings with Net Run Rate (NRR)
- Automatic winner determination and points calculation
- Tournament status tracking (upcoming, ongoing, completed)

### Offline Support
- PWA with service worker
- LocalStorage persistence for offline matches
- Automatic state recovery on page reload

## Architecture

### State Management

#### Match State (`useMatch` hook)
- Uses `useReducer` pattern for complex state
- Immutable state updates with undo/redo logic
- Separate state for each inning with extras tracking
- Real-time syncing to Supabase when sharing

#### Tournament State (`useTournament` hook)
- Uses `useReducer` pattern for tournament data
- Manages tournament, teams, players, matches, and standings
- Real-time subscriptions for live updates
- Role-based permissions (admin, scorer, viewer)

### Data Flow
1. Actions triggered in UI components
2. Hook updates state via reducer
3. State changes trigger UI re-renders
4. When sharing/tournament: state synced to Supabase
5. Real-time updates received from Supabase subscriptions
6. All changes auto-saved to localStorage (when not viewing)

### Database Schema (Supabase)

#### Match Sharing Tables
- `sessions`: Sharing session management
- `matches`: JSONB for complete match state
- Row Level Security for authentication

#### Tournament Tables
- `tournaments`: Tournament configuration (code, name, overs, points)
- `teams`: Teams belonging to tournaments
- `players`: Players belonging to teams
- `tournament_matches`: Scheduled/live/completed matches
- `innings_stats`: Innings statistics for standings calculation
- `tournament_members`: User roles (admin/scorer/viewer)
- Row Level Security for authentication

## Development

```bash
npm install      # Install dependencies
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Environment Variables

Create a `.env` file with Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## App Modes

The app operates in different modes managed by state:
- **local:** Standard offline scoring
- **sharing:** Hosting a shared session (read/write)
- **viewing:** Viewing a shared session (read-only)

## Tournament Permissions

| Role | Permissions |
|------|-------------|
| `admin` | Full control: create/edit teams, players, matches; score matches |
| `scorer` | Score matches (future use) |
| `viewer` | View-only access to tournament data |
