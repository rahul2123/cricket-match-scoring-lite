export type BallType =
  | 'run'      // Normal run (0, 1, 2, 3, 4, 6)
  | 'wicket'   // Wicket - ball counts, no runs (unless runs scored before wicket)
  | 'wide'     // Wide - adds 1 run, no ball count
  | 'noball'   // No Ball - adds 1 + extra runs, ball counts ONLY if runout
  | 'bye'      // Bye - adds runs, ball counts
  | 'legbye';  // Leg Bye - adds runs, ball counts

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'handled_ball'
  | 'obstructing'
  | 'timed_out';

export interface BatsmanState {
  profileId: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  bowlerProfileId?: number; // Who dismissed this batsman
  fielderProfileId?: number; // For catches/run-outs
  battingOrder: number; // Order they came in to bat
}

export interface BowlerState {
  profileId: number;
  balls: number; // Total balls bowled
  runs: number; // Runs conceded
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
  overs: number[]; // Runs conceded per over (for maiden calculation)
}

export interface Ball {
  id: string;
  type: BallType;
  runs: number;
  inning: 1 | 2;
  timestamp: number;
  isRunOut?: boolean; // For no-ball with run-out (ball counts)
  isWicket?: boolean; // Track if wicket fell on this delivery
  // Player attribution
  strikerId?: number; // Profile ID of batsman who faced the ball
  bowlerId?: number;  // Profile ID of bowler
  dismissedBatsmanId?: number; // Profile ID of batsman dismissed (if wicket)
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
  // Player tracking
  strikerId?: number; // Current striker profile ID
  nonStrikerId?: number; // Current non-striker profile ID
  bowlerId?: number; // Current bowler profile ID
  batsmen: Record<number, BatsmanState>; // profileId -> BatsmanState
  bowlers: Record<number, BowlerState>; // profileId -> BowlerState
  battingOrder: number[]; // Array of profile IDs in batting order
  nextBattingOrder: number; // Next batting position
  currentOverBalls: number; // Balls in current over (for maiden tracking)
  currentOverRuns: number; // Runs in current over (for maiden tracking)
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
  totalOvers: number;
  // Team player IDs (set before match starts)
  teamABatsmen: number[]; // Profile IDs for team A
  teamBBatsmen: number[]; // Profile IDs for team B
  teamABowlers: number[]; // Profile IDs for team A bowlers
  teamBBowlers: number[]; // Profile IDs for team B bowlers
  battingTeam: 'A' | 'B'; // Which team is currently batting
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
  strikerId: undefined,
  nonStrikerId: undefined,
  bowlerId: undefined,
  batsmen: {},
  bowlers: {},
  battingOrder: [],
  nextBattingOrder: 1,
  currentOverBalls: 0,
  currentOverRuns: 0,
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
  teamABatsmen: [],
  teamBBatsmen: [],
  teamABowlers: [],
  teamBBowlers: [],
  battingTeam: 'A',
};

export type MatchAction =
  | { type: 'ADD_RUN'; runs: number }
  | { type: 'ADD_WICKET'; runs: number }
  | { type: 'ADD_WIDE' }
  | { type: 'ADD_WIDE_WICKET' }
  | { type: 'ADD_NOBALL'; runs: number; isRunOut: boolean }
  | { type: 'ADD_BYE'; runs: number }
  | { type: 'ADD_LEGBYE'; runs: number }
  | { type: 'UNDO' }
  | { type: 'END_INNINGS' }
  | { type: 'NEW_MATCH'; totalOvers?: number }
  | { type: 'SET_TOTAL_OVERS'; totalOvers: number }
  | { type: 'LOAD_STATE'; state: MatchState }
  // Player management actions
  | { type: 'SET_TEAM_PLAYERS'; teamABatsmen: number[]; teamBBatsmen: number[]; teamABowlers: number[]; teamBBowlers: number[]; battingTeam: 'A' | 'B' }
  | { type: 'SET_OPENING_BATSMEN'; strikerId: number; nonStrikerId: number }
  | { type: 'SET_BOWLER'; bowlerId: number }
  | { type: 'NEXT_BATSMAN'; batsmanId: number }
  | { type: 'ROTATE_STRIKE' }
  | { type: 'SET_DISMISSAL'; batsmanId: number; dismissalType: DismissalType; bowlerId?: number; fielderId?: number };
