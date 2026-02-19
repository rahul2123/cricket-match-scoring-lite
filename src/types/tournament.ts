import type { MatchState } from './index';

// =============================================================================
// ENUM TYPES
// =============================================================================

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type TournamentFormat = 'custom' | 'round_robin' | 'knockout';
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
  format: TournamentFormat;
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

/**
 * Global player profile - unique across all tournaments
 * One player = one profile, can play in multiple tournaments
 */
export interface PlayerProfile {
  id: number;
  name: string;
  createdBy: string; // User who created this profile
  createdAt: string;
  updatedAt: string;
}

/**
 * Team player - links a profile to a team in a tournament
 * This is the tournament-specific roster entry
 */
export interface TeamPlayer {
  id: number;
  teamId: number;
  profileId: number;
  role: PlayerRole;
  profile?: PlayerProfile;
  createdAt: string;
}

/**
 * Legacy Player type - kept for backward compatibility
 * @deprecated Use TeamPlayer instead
 */
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
  battingFirstTeamId?: number; // Team that chose to bat first after toss
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
  ballsFaced: number; // Total balls faced (e.g., 117 for 19.3 overs)
  wicketsLost: number;
  isAllOut: boolean;
}

export interface PlayerBattingStats {
  id: number;
  tournamentMatchId: number;
  profileId: number; // Changed from playerId to profileId
  teamId: number; // Which team this player was playing for
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  bowlerProfileId?: number; // Who dismissed this player
  fielderProfileId?: number; // Who caught/run out this player
}

export interface PlayerBowlingStats {
  id: number;
  tournamentMatchId: number;
  profileId: number; // Changed from playerId to profileId
  teamId: number; // Which team this player was playing for
  overs: number; // Stored as balls (e.g., 27 for 4.3 overs)
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
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
  ballsFaced: number; // Total balls faced while batting
  runsConceded: number;
  ballsBowled: number; // Total balls bowled while fielding
  nrr: number;
}

export interface PlayerTournamentStats {
  profileId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  role: PlayerRole;
  // Batting stats
  battingInnings: number;
  totalRuns: number;
  battingBalls: number; // Balls faced while batting
  fours: number;
  sixes: number;
  notOuts: number;
  highestScore: number;
  strikeRate: number;
  average: number;
  // Bowling stats
  bowlingInnings: number;
  bowlingBalls: number; // Balls bowled
  runsConceded: number;
  wickets: number;
  maidens: number;
  economy: number;
  bowlingAverage: number;
}

/**
 * Career stats for a player across all tournaments
 * Aggregated from all tournament participations
 */
export interface PlayerCareerStats {
  profileId: number;
  playerName: string;
  // Batting career stats
  battingInnings: number;
  totalRuns: number;
  battingBalls: number; // Total balls faced
  fours: number;
  sixes: number;
  notOuts: number;
  highestScore: number;
  strikeRate: number;
  average: number;
  fifties: number;
  hundreds: number;
  // Bowling career stats
  bowlingInnings: number;
  bowlingBalls: number; // Total balls bowled
  runsConceded: number;
  wickets: number;
  maidens: number;
  economy: number;
  bowlingAverage: number;
  bestFiguresWickets: number;
  bestFiguresRuns: number;
  fiveWicketHauls: number;
  // Tournament participation
  tournamentsPlayed: number;
  teamsPlayedFor: string[];
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
  format?: TournamentFormat;
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
  ballsFaced: number; // Total balls faced (e.g., 117 for 19.3 overs)
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
