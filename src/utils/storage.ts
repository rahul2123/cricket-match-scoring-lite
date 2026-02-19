import { MatchState, InningState, INITIAL_MATCH_STATE, INITIAL_INNING_STATE, DEFAULT_TOTAL_OVERS } from '../types';

const STORAGE_KEY = 'cricket-scorer-match';

export const storage = {
  disabled: false,

  /**
   * Save match state to localStorage
   */
  save(state: MatchState): void {
    if (this.disabled) {
      return; // Skip saving when disabled
    }
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save match state:', error);
    }
  },

  /**
   * Load match state from localStorage
   * Returns INITIAL_MATCH_STATE if no saved state exists
   */
  load(): MatchState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized === null) {
        return { ...INITIAL_MATCH_STATE };
      }
      const state = JSON.parse(serialized) as MatchState;
      return this.validateState(state);
    } catch (error) {
      console.error('Failed to load match state:', error);
      return { ...INITIAL_MATCH_STATE };
    }
  },

  /**
   * Clear saved match state
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear match state:', error);
    }
  },

  /**
   * Validate loaded state to ensure it has all required fields
   */
  validateState(state: unknown): MatchState {
    if (!state || typeof state !== 'object') {
      return { ...INITIAL_MATCH_STATE };
    }

    const s = state as Record<string, unknown>;

    // Check for required top-level fields
    if (
      typeof s.currentInning !== 'number' ||
      !s.innings ||
      typeof s.innings !== 'object' ||
      !Array.isArray(s.ballHistory)
    ) {
      return { ...INITIAL_MATCH_STATE };
    }

    // Validate innings structure
    const innings = s.innings as Record<string, unknown>;
    if (!innings.first || !innings.second) {
      return { ...INITIAL_MATCH_STATE };
    }

    // Return the state with proper typing, merging with defaults for new fields
    return {
      ...INITIAL_MATCH_STATE,
      currentInning: s.currentInning as 1 | 2,
      innings: {
        first: this.validateInning(innings.first),
        second: this.validateInning(innings.second),
      },
      target: typeof s.target === 'number' ? s.target : null,
      ballHistory: s.ballHistory as MatchState['ballHistory'],
      isMatchOver: typeof s.isMatchOver === 'boolean' ? s.isMatchOver : false,
      winner: s.winner as MatchState['winner'] ?? null,
      totalOvers: typeof s.totalOvers === 'number' ? s.totalOvers : DEFAULT_TOTAL_OVERS,
      teamABatsmen: Array.isArray(s.teamABatsmen) ? s.teamABatsmen as number[] : [],
      teamBBatsmen: Array.isArray(s.teamBBatsmen) ? s.teamBBatsmen as number[] : [],
      teamABowlers: Array.isArray(s.teamABowlers) ? s.teamABowlers as number[] : [],
      teamBBowlers: Array.isArray(s.teamBBowlers) ? s.teamBBowlers as number[] : [],
      battingTeam: (s.battingTeam === 'A' || s.battingTeam === 'B') ? s.battingTeam : 'A',
    };
  },

  /**
   * Validate inning state
   */
  validateInning(inning: unknown): InningState {
    if (!inning || typeof inning !== 'object') {
      return { ...INITIAL_INNING_STATE };
    }

    const i = inning as Record<string, unknown>;
    const extras = (i.extras as Record<string, number>) || {};
    const batsmen = (i.batsmen as Record<string, unknown>) || {};
    const bowlers = (i.bowlers as Record<string, unknown>) || {};

    return {
      ...INITIAL_INNING_STATE,
      runs: typeof i.runs === 'number' ? i.runs : 0,
      balls: typeof i.balls === 'number' ? i.balls : 0,
      wickets: typeof i.wickets === 'number' ? i.wickets : 0,
      extras: {
        wides: typeof extras.wides === 'number' ? extras.wides : 0,
        noballs: typeof extras.noballs === 'number' ? extras.noballs : 0,
        byes: typeof extras.byes === 'number' ? extras.byes : 0,
        legbyes: typeof extras.legbyes === 'number' ? extras.legbyes : 0,
      },
      strikerId: typeof i.strikerId === 'number' ? i.strikerId : undefined,
      nonStrikerId: typeof i.nonStrikerId === 'number' ? i.nonStrikerId : undefined,
      bowlerId: typeof i.bowlerId === 'number' ? i.bowlerId : undefined,
      batsmen: batsmen as InningState['batsmen'],
      bowlers: bowlers as InningState['bowlers'],
      battingOrder: Array.isArray(i.battingOrder) ? i.battingOrder as number[] : [],
      nextBattingOrder: typeof i.nextBattingOrder === 'number' ? i.nextBattingOrder : 1,
      currentOverBalls: typeof i.currentOverBalls === 'number' ? i.currentOverBalls : 0,
      currentOverRuns: typeof i.currentOverRuns === 'number' ? i.currentOverRuns : 0,
    };
  },
};
