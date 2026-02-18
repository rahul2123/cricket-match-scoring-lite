# Cricket Match Scoring Lite

A Progressive Web App for scoring cricket matches with real-time sharing capabilities.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** TailwindCSS with custom cricket-themed colors
- **State Management:** Custom `useMatch` hook with `useReducer`
- **Backend:** Supabase (PostgreSQL + Realtime)
- **PWA:** Service worker for offline functionality

## Project Structure

```
src/
├── components/
│   ├── ScoreBoard.tsx       # Main score display (runs, wickets, overs, CRR/RRR)
│   ├── ScoringButtons.tsx   # Run scoring buttons (0-6, wides, no-balls, etc.)
│   ├── BallHistory.tsx      # Ball-by-ball delivery log
│   ├── ShareMatchDialog.tsx # UI for sharing matches
│   └── JoinMatchDialog.tsx  # UI for joining shared matches
├── hooks/
│   └── useMatch.ts          # Core match state management (reducer pattern)
├── utils/
│   ├── storage.ts           # LocalStorage abstraction
│   ├── shareMatch.ts        # Supabase session sharing logic
│   ├── supabase.ts          # Supabase client configuration
│   └── helpers.ts           # Cricket-specific helpers (overs formatting)
├── types/
│   └── index.ts             # Core types (MatchState, Ball, Innings)
├── App.tsx                  # Main application component
├── main.tsx                 # React app entry point
└── index.css                # Global styles
```

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

### Offline Support
- PWA with service worker
- LocalStorage persistence for offline matches
- Automatic state recovery on page reload

## Architecture

### State Management
- `useMatch` hook uses `useReducer` pattern for complex state
- Immutable state updates with undo/redo logic
- Separate state for each inning with extras tracking
- Real-time syncing to Supabase when sharing

### Data Flow
1. Actions triggered in ScoringButtons
2. useMatch hook updates state via reducer
3. State changes trigger UI re-renders
4. When sharing: state synced to Supabase
5. When viewing: real-time updates from Supabase
6. All changes auto-saved to localStorage

### Database Schema (Supabase)
- `sessions` table: sharing session management
- `matches` table: JSONB for complete match state
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
