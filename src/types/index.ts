export type BallType = 
  | 'run'      // Normal run (0, 1, 2, 3, 4, 6)
  | 'wicket'   // Wicket - ball counts, no runs (unless runs scored before wicket)
  | 'wide'     // Wide - adds 1 run, no ball count
  | 'noball'   // No Ball - adds 1 + extra runs, ball counts ONLY if runout
  | 'bye'      // Bye - adds runs, ball counts
  | 'legbye';  // Leg Bye - adds runs, ball counts

export interface Ball {
  id: string;
  type: BallType;
  runs: number;
  inning: 1 | 2;
  timestamp: number;
  isRunOut?: boolean; // For no-ball with run-out (ball counts)
  isWicket?: boolean; // Track if wicket fell on this delivery
}

export interface InningState {
  runs: number;
  balls: number;
  wickets: number;
  extras: {
    wides: number;
    noballs: number;
    byes: number;
    legbyes: number;
  };
}

export interface MatchState {
  currentInning: 1 | 2;
  innings: {
    first: InningState;
    second: InningState;
  };
  target: number | null;
  ballHistory: Ball[];
  isMatchOver: boolean;
  winner: 'batting' | 'bowling' | null;
  totalOvers: number; // Total overs in the match (e.g., 20 for T20, 50 for ODI)
}

export const DEFAULT_TOTAL_OVERS = 20;

export const INITIAL_INNING_STATE: InningState = {
  runs: 0,
  balls: 0,
  wickets: 0,
  extras: {
    wides: 0,
    noballs: 0,
    byes: 0,
    legbyes: 0,
  },
};

export const INITIAL_MATCH_STATE: MatchState = {
  currentInning: 1,
  innings: {
    first: { ...INITIAL_INNING_STATE },
    second: { ...INITIAL_INNING_STATE },
  },
  target: null,
  ballHistory: [],
  isMatchOver: false,
  winner: null,
  totalOvers: DEFAULT_TOTAL_OVERS,
};

export type MatchAction =
  | { type: 'ADD_RUN'; runs: number }
  | { type: 'ADD_WICKET'; runs: number }
  | { type: 'ADD_WIDE' }
  | { type: 'ADD_NOBALL'; runs: number; isRunOut: boolean }
  | { type: 'ADD_BYE'; runs: number }
  | { type: 'ADD_LEGBYE'; runs: number }
  | { type: 'UNDO' }
  | { type: 'END_INNINGS' }
  | { type: 'NEW_MATCH'; totalOvers?: number }
  | { type: 'SET_TOTAL_OVERS'; totalOvers: number }
  | { type: 'LOAD_STATE'; state: MatchState };
