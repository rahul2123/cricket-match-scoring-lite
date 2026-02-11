# Cricket Scorer PWA

A minimalist ball-by-ball cricket scoring app for casual matches. Works fully offline with localStorage persistence.

## Features

- **Ball-by-ball scoring**: Track runs (0-6), wides, no-balls, byes, and leg byes
- **Two innings support**: First innings sets target, second innings shows required runs
- **Full statistics**: Current Run Rate (CRR), Required Run Rate (RRR)
- **Offline support**: PWA with service worker for offline functionality
- **Data persistence**: All match data saved to localStorage
- **Undo support**: Undo any ball, even across innings
- **Mobile-first design**: Optimized for touch devices

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- PWA (vite-plugin-pwa)
- LocalStorage for persistence

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Scoring Rules

### Ball Counting
- Regular deliveries (0-6 runs): Ball counts
- Byes & Leg Byes: Ball counts, runs added
- Wides & No-balls: Ball does NOT count, 1 run added

### Match Flow
1. **First Innings**: Score normally, click "End Innings" when done
2. **Second Innings**: Target = First innings score + 1
3. **Match ends**: When batting team reaches or exceeds target

## Project Structure

```
src/
├── components/
│   ├── ScoreBoard.tsx      # Main score display
│   ├── ScoringButtons.tsx  # Run/extra buttons
│   └── BallHistory.tsx     # Ball-by-ball log
├── hooks/
│   └── useMatch.ts         # Game state management
├── types/
│   └── index.ts            # TypeScript types
├── utils/
│   ├── storage.ts          # LocalStorage abstraction
│   └── helpers.ts          # Utility functions
├── App.tsx
├── main.tsx
└── index.css
```

## License


## ENV

# Your Supabase project URL (e.g., https://xxxxx.supabase.co)
VITE_SUPABASE_URL=""

# Your Supabase anonymous/public key
VITE_SUPABASE_ANON_KEY=""


MIT
