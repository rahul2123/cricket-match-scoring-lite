import type { MatchState } from './index';

// =============================================================================
// ENUM TYPES
// =============================================================================

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'abandoned';
export type ResultType = 'win' | 'tie' | 'no_result';
export type PlayerRole = 'batsman' | 'bowler' | 'all-rounder';
export type UserRole = 'admin' | 'scorer' | 'viewer';
export type DismissalType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'obstructing' | 'handled_ball' | 'timed_out';

// =============================================================================
// DATABASE RECORD TYPES
// =============================================================================

export interface Tournament {
  id: number;
  code: string;
  name: string;
  oversPerMatch: number;
  pointsWin: number;
  pointsTie: number;
  pointsLoss: number;
  status: TournamentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  tournamentId: number;
  name: string;
  shortName?: string;
  createdAt: string;
}

export interface Player {
  id: number;
  teamId: number;
  name: string;
  role: PlayerRole;
  createdAt: string;
}

export interface TournamentMatch {
  id: number;
  tournamentId: number;
  teamAId: number;
  teamBId: number;
  teamA?: Team;
  teamB?: Team;
  matchNumber: number;
  scheduledDate?: string;
  overs: number;
  status: MatchStatus;
  winnerTeamId?: number;
  resultType?: ResultType;
  matchState?: MatchState;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InningsStats {
  id: number;
  tournamentMatchId: number;
  teamId: number;
  inningNumber: 1 | 2;
  runsScored: number;
  oversFaced: number; // Decimal: 19.3 overs = 19.5
  wicketsLost: number;
  isAllOut: boolean;
}

export interface PlayerBattingStats {
  id: number;
  tournamentMatchId: number;
  playerId: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
}

export interface PlayerBowlingStats {
  id: number;
  tournamentMatchId: number;
  playerId: number;
  overs: number; // Decimal: 4.3 overs = 4.5
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface TournamentMember {
  id: number;
  tournamentId: number;
  userId: string;
  role: UserRole;
}

// =============================================================================
// AGGREGATED STATISTICS TYPES
// =============================================================================

export interface TeamStandings {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  nrr: number;
}

export interface PlayerTournamentStats {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  role: PlayerRole;
  // Batting stats
  battingInnings: number;
  totalRuns: number;
  totalBalls: number;
  fours: number;
  sixes: number;
  notOuts: number;
  highestScore: number;
  strikeRate: number;
  average: number;
  // Bowling stats
  bowlingInnings: number;
  totalOvers: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  economy: number;
  bowlingAverage: number;
}

// =============================================================================
// TOURNAMENT STATE (for useReducer)
// =============================================================================

export type TournamentAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_TOURNAMENT'; tournament: Tournament | null }
  | { type: 'SET_TEAMS'; teams: Team[] }
  | { type: 'ADD_TEAM'; team: Team }
  | { type: 'UPDATE_TEAM'; team: Team }
  | { type: 'REMOVE_TEAM'; teamId: number }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'SET_PLAYERS_FOR_TEAM'; teamId: number; players: Player[] }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'UPDATE_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: number }
  | { type: 'SET_MATCHES'; matches: TournamentMatch[] }
  | { type: 'ADD_MATCH'; match: TournamentMatch }
  | { type: 'UPDATE_MATCH'; match: TournamentMatch }
  | { type: 'SET_USER_ROLE'; role: UserRole }
  | { type: 'SET_STANDINGS'; standings: TeamStandings[] }
  | { type: 'CLEAR_TOURNAMENT' };

export interface TournamentState {
  tournament: Tournament | null;
  teams: Team[];
  playersByTeam: Record<number, Player[]>;
  matches: TournamentMatch[];
  userRole: UserRole;
  standings: TeamStandings[];
  isLoading: boolean;
  error: string | null;
}

export const INITIAL_TOURNAMENT_STATE: TournamentState = {
  tournament: null,
  teams: [],
  playersByTeam: {},
  matches: [],
  userRole: 'viewer',
  standings: [],
  isLoading: false,
  error: null,
};

// =============================================================================
// INPUT TYPES (for API functions)
// =============================================================================

export interface CreateTournamentInput {
  name: string;
  oversPerMatch?: number;
  pointsWin?: number;
  pointsTie?: number;
  pointsLoss?: number;
}

export interface CreateTeamInput {
  tournamentId: number;
  name: string;
  shortName?: string;
}

export interface CreatePlayerInput {
  teamId: number;
  name: string;
  role?: PlayerRole;
}

export interface CreateMatchInput {
  tournamentId: number;
  teamAId: number;
  teamBId: number;
  scheduledDate?: string;
  overs?: number;
}

export interface SaveInningsStatsInput {
  tournamentMatchId: number;
  teamId: number;
  inningNumber: 1 | 2;
  runsScored: number;
  oversFaced: number;
  wicketsLost: number;
  isAllOut: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface TournamentWithDetails extends Tournament {
  teams: Team[];
  matches: TournamentMatch[];
  standings: TeamStandings[];
}

export interface MatchWithTeams extends TournamentMatch {
  teamA: Team;
  teamB: Team;
  inningsStats: InningsStats[];
}
