import { useReducer, useEffect, useCallback } from 'react';
import {
  MatchState,
  MatchAction,
  Ball,
  InningState,
  INITIAL_MATCH_STATE,
  INITIAL_INNING_STATE,
  DEFAULT_TOTAL_OVERS,
  BatsmanState,
  BowlerState,
  DismissalType,
} from '../types';
import { storage } from '../utils/storage';
import { generateId } from '../utils/helpers';

// Helper to get current inning state
function getCurrentInning(state: MatchState): InningState {
  return state.currentInning === 1 ? state.innings.first : state.innings.second;
}

// Helper to update current inning
function updateCurrentInning(state: MatchState, updates: Partial<InningState>): MatchState {
  const inningKey = state.currentInning === 1 ? 'first' : 'second';
  return {
    ...state,
    innings: {
      ...state.innings,
      [inningKey]: {
        ...state.innings[inningKey],
        ...updates,
      },
    },
  };
}

// Check if match should end
function checkMatchEnd(state: MatchState): MatchState {
  if (state.currentInning !== 2 || state.target === null) return state;

  const secondInning = state.innings.second;

  // Batting team wins if they reach or exceed target
  if (secondInning.runs >= state.target) {
    return { ...state, isMatchOver: true, winner: 'batting' };
  }

  // Bowling team wins if all out or balls exhausted
  const maxBalls = state.totalOvers * 6;
  if (secondInning.wickets >= 10 || secondInning.balls >= maxBalls) {
    return { ...state, isMatchOver: true, winner: 'bowling' };
  }

  return state;
}

// Check if over is complete and rotate strike
function checkOverComplete(state: MatchState, ballsBefore: number): MatchState {
  const inning = getCurrentInning(state);
  const ballsInOver = inning.balls % 6;
  const wasLastBallOfOver = ballsBefore % 6 === 5 || (ballsBefore === 0 && inning.balls > 0 && inning.balls % 6 === 0);

  // If over is complete, rotate strike and update maiden
  if (wasLastBallOfOver && ballsInOver === 0) {
    let newState = state;

    // Rotate strike
    const currentStriker = inning.strikerId;
    const currentNonStriker = inning.nonStrikerId;
    newState = updateCurrentInning(newState, {
      strikerId: currentNonStriker,
      nonStrikerId: currentStriker,
    });

    // Update maiden for bowler
    if (inning.bowlerId && inning.currentOverRuns === 0 && inning.currentOverBalls === 6) {
      const bowler = inning.bowlers[inning.bowlerId];
      if (bowler) {
        newState = updateCurrentInning(newState, {
          bowlers: {
            ...getCurrentInning(newState).bowlers,
            [inning.bowlerId]: {
              ...bowler,
              maidens: bowler.maidens + 1,
            },
          },
        });
      }
    }

    // Reset over tracking
    newState = updateCurrentInning(newState, {
      currentOverBalls: 0,
      currentOverRuns: 0,
    });

    return newState;
  }

  return state;
}

// Get next batsman from batting order
function getNextBatsman(state: MatchState): number | null {
  const inning = getCurrentInning(state);
  const battingTeam = state.currentInning === 1
    ? state.battingTeam
    : (state.battingTeam === 'A' ? 'B' : 'A');
  const batsmenList = battingTeam === 'A' ? state.teamABatsmen : state.teamBBatsmen;

  // Find next batsman who hasn't batted yet
  for (let i = 0; i < batsmenList.length; i++) {
    const profileId = batsmenList[i];
    if (!inning.batsmen[profileId] && profileId !== inning.strikerId && profileId !== inning.nonStrikerId) {
      return profileId;
    }
  }

  return null; // No more batsmen available
}

// Create initial batsman state
function createBatsmanState(profileId: number, battingOrder: number): BatsmanState {
  return {
    profileId,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    battingOrder,
  };
}

// Create initial bowler state
function createBowlerState(profileId: number): BowlerState {
  return {
    profileId,
    balls: 0,
    runs: 0,
    wickets: 0,
    maidens: 0,
    wides: 0,
    noBalls: 0,
    overs: [],
  };
}

// Main reducer
function matchReducer(state: MatchState, action: MatchAction): MatchState {
  // Prevent scoring if match is over (but allow LOAD_STATE, NEW_MATCH, etc.)
  if (state.isMatchOver && !['NEW_MATCH', 'LOAD_STATE', 'SET_TEAM_PLAYERS'].includes(action.type)) {
    return state;
  }

  const inning = getCurrentInning(state);

  switch (action.type) {
    case 'SET_TEAM_PLAYERS': {
      return {
        ...state,
        teamABatsmen: action.teamABatsmen,
        teamBBatsmen: action.teamBBatsmen,
        teamABowlers: action.teamABowlers,
        teamBBowlers: action.teamBBowlers,
        battingTeam: action.battingTeam,
      };
    }

    case 'SET_OPENING_BATSMEN': {
      const batsmen = { ...inning.batsmen };
      batsmen[action.strikerId] = createBatsmanState(action.strikerId, 1);
      batsmen[action.nonStrikerId] = createBatsmanState(action.nonStrikerId, 2);

      return updateCurrentInning(state, {
        strikerId: action.strikerId,
        nonStrikerId: action.nonStrikerId,
        batsmen,
        battingOrder: [action.strikerId, action.nonStrikerId],
        nextBattingOrder: 3,
      });
    }

    case 'SET_BOWLER': {
      let bowlers = { ...inning.bowlers };
      if (!bowlers[action.bowlerId]) {
        bowlers[action.bowlerId] = createBowlerState(action.bowlerId);
      }
      return updateCurrentInning(state, { bowlerId: action.bowlerId, bowlers });
    }

    case 'NEXT_BATSMAN': {
      const batsmen = { ...inning.batsmen };
      if (!batsmen[action.batsmanId]) {
        batsmen[action.batsmanId] = createBatsmanState(action.batsmanId, inning.nextBattingOrder);
      }

      return updateCurrentInning(state, {
        strikerId: action.batsmanId,
        batsmen,
        battingOrder: [...inning.battingOrder, action.batsmanId],
        nextBattingOrder: inning.nextBattingOrder + 1,
      });
    }

    case 'ROTATE_STRIKE': {
      return updateCurrentInning(state, {
        strikerId: inning.nonStrikerId,
        nonStrikerId: inning.strikerId,
      });
    }

    case 'SET_DISMISSAL': {
      const batsmen = { ...inning.batsmen };
      const batsman = batsmen[action.batsmanId];
      if (batsman) {
        batsmen[action.batsmanId] = {
          ...batsman,
          isOut: true,
          dismissalType: action.dismissalType,
          bowlerProfileId: action.bowlerId,
          fielderProfileId: action.fielderId,
        };
      }
      return updateCurrentInning(state, { batsmen });
    }

    case 'ADD_RUN': {
      if (!inning.strikerId) return state;

      const ballsBefore = inning.balls;
      const ball: Ball = {
        id: generateId(),
        type: 'run',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
        strikerId: inning.strikerId,
        bowlerId: inning.bowlerId,
      };

      // Update inning state
      let newState = updateCurrentInning(state, {
        runs: inning.runs + action.runs,
        balls: inning.balls + 1,
        currentOverBalls: inning.currentOverBalls + 1,
        currentOverRuns: inning.currentOverRuns + action.runs,
      });

      // Update batsman stats
      const currentInning = getCurrentInning(newState);
      const batsmen = { ...currentInning.batsmen };
      const striker = batsmen[inning.strikerId];
      if (striker) {
        batsmen[inning.strikerId] = {
          ...striker,
          runs: striker.runs + action.runs,
          balls: striker.balls + 1,
          fours: action.runs === 4 ? striker.fours + 1 : striker.fours,
          sixes: action.runs === 6 ? striker.sixes + 1 : striker.sixes,
        };
      }
      newState = updateCurrentInning(newState, { batsmen });

      // Update bowler stats
      if (inning.bowlerId) {
        const bowlers = { ...currentInning.bowlers };
        const bowler = bowlers[inning.bowlerId];
        if (bowler) {
          bowlers[inning.bowlerId] = {
            ...bowler,
            balls: bowler.balls + 1,
            runs: bowler.runs + action.runs,
          };
        }
        newState = updateCurrentInning(newState, { bowlers });
      }

      // Add ball to history
      newState = { ...newState, ballHistory: [...newState.ballHistory, ball] };

      // Rotate strike on odd runs
      if (action.runs % 2 === 1) {
        newState = updateCurrentInning(newState, {
          strikerId: currentInning.nonStrikerId,
          nonStrikerId: currentInning.strikerId,
        });
      }

      // Check for over complete
      newState = checkOverComplete(newState, ballsBefore);

      // Check match end
      newState = checkMatchEnd(newState);

      return newState;
    }

    case 'ADD_WICKET': {
      if (!inning.strikerId) return state;

      const ballsBefore = inning.balls;
      const ball: Ball = {
        id: generateId(),
        type: 'wicket',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
        strikerId: inning.strikerId,
        bowlerId: inning.bowlerId,
        isWicket: true,
        dismissedBatsmanId: inning.strikerId,
      };

      // Update inning state
      let newState = updateCurrentInning(state, {
        runs: inning.runs + action.runs,
        balls: inning.balls + 1,
        wickets: inning.wickets + 1,
        currentOverBalls: inning.currentOverBalls + 1,
        currentOverRuns: inning.currentOverRuns + action.runs,
      });

      // Mark batsman as out
      const currentInning = getCurrentInning(newState);
      const batsmen = { ...currentInning.batsmen };
      const striker = batsmen[inning.strikerId];
      if (striker) {
        batsmen[inning.strikerId] = {
          ...striker,
          runs: striker.runs + action.runs,
          balls: striker.balls + 1,
          isOut: true,
          dismissalType: 'bowled', // Default, can be updated later
          bowlerProfileId: inning.bowlerId,
        };
      }
      newState = updateCurrentInning(newState, { batsmen });

      // Update bowler wickets
      if (inning.bowlerId) {
        const bowlers = { ...currentInning.bowlers };
        const bowler = bowlers[inning.bowlerId];
        if (bowler) {
          bowlers[inning.bowlerId] = {
            ...bowler,
            balls: bowler.balls + 1,
            runs: bowler.runs + action.runs,
            wickets: bowler.wickets + 1,
          };
        }
        newState = updateCurrentInning(newState, { bowlers });
      }

      // Add ball to history
      newState = { ...newState, ballHistory: [...newState.ballHistory, ball] };

      // Get next batsman
      const nextBatsman = getNextBatsman(newState);
      if (nextBatsman) {
        const nextBatsmen = { ...getCurrentInning(newState).batsmen };
        nextBatsmen[nextBatsman] = createBatsmanState(nextBatsman, getCurrentInning(newState).nextBattingOrder);
        newState = updateCurrentInning(newState, {
          strikerId: nextBatsman,
          batsmen: nextBatsmen,
          battingOrder: [...getCurrentInning(newState).battingOrder, nextBatsman],
          nextBattingOrder: getCurrentInning(newState).nextBattingOrder + 1,
        });
      } else {
        // No more batsmen - all out will be handled by checkMatchEnd
        newState = updateCurrentInning(newState, { strikerId: undefined });
      }

      // Check for over complete
      newState = checkOverComplete(newState, ballsBefore);

      // Check match end
      newState = checkMatchEnd(newState);

      return newState;
    }

    case 'ADD_WIDE': {
      if (!inning.bowlerId) return state;

      const ball: Ball = {
        id: generateId(),
        type: 'wide',
        runs: 1,
        inning: state.currentInning,
        timestamp: Date.now(),
        bowlerId: inning.bowlerId,
      };

      let newState = updateCurrentInning(state, {
        runs: inning.runs + 1,
        extras: { ...inning.extras, wides: inning.extras.wides + 1 },
      });

      // Update bowler wides
      const currentInning = getCurrentInning(newState);
      const bowlers = { ...currentInning.bowlers };
      const bowler = bowlers[inning.bowlerId];
      if (bowler) {
        bowlers[inning.bowlerId] = {
          ...bowler,
          runs: bowler.runs + 1,
          wides: bowler.wides + 1,
        };
      }
      newState = updateCurrentInning(newState, { bowlers });

      return { ...newState, ballHistory: [...newState.ballHistory, ball] };
    }

    case 'ADD_WIDE_WICKET': {
      if (!inning.strikerId || !inning.bowlerId) return state;

      const ball: Ball = {
        id: generateId(),
        type: 'wide',
        runs: 1,
        inning: state.currentInning,
        timestamp: Date.now(),
        bowlerId: inning.bowlerId,
        isWicket: true,
        dismissedBatsmanId: inning.strikerId,
      };

      let newState = updateCurrentInning(state, {
        runs: inning.runs + 1,
        wickets: inning.wickets + 1,
        extras: { ...inning.extras, wides: inning.extras.wides + 1 },
      });

      // Mark batsman as out (run out or stumped)
      const currentInning = getCurrentInning(newState);
      const batsmen = { ...currentInning.batsmen };
      const striker = batsmen[inning.strikerId];
      if (striker) {
        batsmen[inning.strikerId] = {
          ...striker,
          isOut: true,
          dismissalType: 'run_out',
        };
      }
      newState = updateCurrentInning(newState, { batsmen });

      // Update bowler
      const bowlers = { ...currentInning.bowlers };
      const bowler = bowlers[inning.bowlerId];
      if (bowler) {
        bowlers[inning.bowlerId] = {
          ...bowler,
          runs: bowler.runs + 1,
          wides: bowler.wides + 1,
        };
      }
      newState = updateCurrentInning(newState, { bowlers });

      // Get next batsman
      const nextBatsman = getNextBatsman(newState);
      if (nextBatsman) {
        const nextBatsmen = { ...getCurrentInning(newState).batsmen };
        nextBatsmen[nextBatsman] = createBatsmanState(nextBatsman, getCurrentInning(newState).nextBattingOrder);
        newState = updateCurrentInning(newState, {
          strikerId: nextBatsman,
          batsmen: nextBatsmen,
          battingOrder: [...getCurrentInning(newState).battingOrder, nextBatsman],
          nextBattingOrder: getCurrentInning(newState).nextBattingOrder + 1,
        });
      }

      return { ...newState, ballHistory: [...newState.ballHistory, ball] };
    }

    case 'ADD_NOBALL': {
      if (!inning.strikerId || !inning.bowlerId) return state;

      const totalRuns = 1 + action.runs; // 1 penalty + runs scored
      const ball: Ball = {
        id: generateId(),
        type: 'noball',
        runs: totalRuns,
        inning: state.currentInning,
        timestamp: Date.now(),
        strikerId: inning.strikerId,
        bowlerId: inning.bowlerId,
        isRunOut: action.isRunOut,
      };

      let newState = updateCurrentInning(state, {
        runs: inning.runs + totalRuns,
        balls: action.isRunOut ? inning.balls + 1 : inning.balls,
        extras: { ...inning.extras, noballs: inning.extras.noballs + 1 },
      });

      // Update batsman (runs from bat count for batsman)
      if (action.runs > 0) {
        const currentInning = getCurrentInning(newState);
        const batsmen = { ...currentInning.batsmen };
        const striker = batsmen[inning.strikerId];
        if (striker) {
          batsmen[inning.strikerId] = {
            ...striker,
            runs: striker.runs + action.runs,
            balls: action.isRunOut ? striker.balls + 1 : striker.balls,
          };
        }
        newState = updateCurrentInning(newState, { batsmen });
      }

      // Update bowler
      const currentInning = getCurrentInning(newState);
      const bowlers = { ...currentInning.bowlers };
      const bowler = bowlers[inning.bowlerId];
      if (bowler) {
        bowlers[inning.bowlerId] = {
          ...bowler,
          balls: action.isRunOut ? bowler.balls + 1 : bowler.balls,
          runs: bowler.runs + totalRuns,
          noBalls: bowler.noBalls + 1,
        };
      }
      newState = updateCurrentInning(newState, { bowlers });

      return { ...newState, ballHistory: [...newState.ballHistory, ball] };
    }

    case 'ADD_BYE': {
      if (!inning.strikerId || !inning.bowlerId) return state;

      const ballsBefore = inning.balls;
      const ball: Ball = {
        id: generateId(),
        type: 'bye',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
        strikerId: inning.strikerId,
        bowlerId: inning.bowlerId,
      };

      let newState = updateCurrentInning(state, {
        runs: inning.runs + action.runs,
        balls: inning.balls + 1,
        currentOverBalls: inning.currentOverBalls + 1,
        currentOverRuns: inning.currentOverRuns + action.runs,
        extras: { ...inning.extras, byes: inning.extras.byes + action.runs },
      });

      // Update batsman balls (not runs)
      const currentInning = getCurrentInning(newState);
      const batsmen = { ...currentInning.batsmen };
      const striker = batsmen[inning.strikerId];
      if (striker) {
        batsmen[inning.strikerId] = { ...striker, balls: striker.balls + 1 };
      }
      newState = updateCurrentInning(newState, { batsmen });

      // Update bowler balls
      if (inning.bowlerId) {
        const bowlers = { ...currentInning.bowlers };
        const bowler = bowlers[inning.bowlerId];
        if (bowler) {
          bowlers[inning.bowlerId] = { ...bowler, balls: bowler.balls + 1 };
        }
        newState = updateCurrentInning(newState, { bowlers });
      }

      // Add ball to history
      newState = { ...newState, ballHistory: [...newState.ballHistory, ball] };

      // Rotate strike on odd runs
      if (action.runs % 2 === 1) {
        newState = updateCurrentInning(newState, {
          strikerId: currentInning.nonStrikerId,
          nonStrikerId: currentInning.strikerId,
        });
      }

      // Check for over complete
      newState = checkOverComplete(newState, ballsBefore);

      return newState;
    }

    case 'ADD_LEGBYE': {
      if (!inning.strikerId || !inning.bowlerId) return state;

      const ballsBefore = inning.balls;
      const ball: Ball = {
        id: generateId(),
        type: 'legbye',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
        strikerId: inning.strikerId,
        bowlerId: inning.bowlerId,
      };

      let newState = updateCurrentInning(state, {
        runs: inning.runs + action.runs,
        balls: inning.balls + 1,
        currentOverBalls: inning.currentOverBalls + 1,
        currentOverRuns: inning.currentOverRuns + action.runs,
        extras: { ...inning.extras, legbyes: inning.extras.legbyes + action.runs },
      });

      // Update batsman balls
      const currentInning = getCurrentInning(newState);
      const batsmen = { ...currentInning.batsmen };
      const striker = batsmen[inning.strikerId];
      if (striker) {
        batsmen[inning.strikerId] = { ...striker, balls: striker.balls + 1 };
      }
      newState = updateCurrentInning(newState, { batsmen });

      // Update bowler balls
      if (inning.bowlerId) {
        const bowlers = { ...currentInning.bowlers };
        const bowler = bowlers[inning.bowlerId];
        if (bowler) {
          bowlers[inning.bowlerId] = { ...bowler, balls: bowler.balls + 1 };
        }
        newState = updateCurrentInning(newState, { bowlers });
      }

      // Add ball to history
      newState = { ...newState, ballHistory: [...newState.ballHistory, ball] };

      // Rotate strike on odd runs
      if (action.runs % 2 === 1) {
        newState = updateCurrentInning(newState, {
          strikerId: currentInning.nonStrikerId,
          nonStrikerId: currentInning.strikerId,
        });
      }

      // Check for over complete
      newState = checkOverComplete(newState, ballsBefore);

      return newState;
    }

    case 'UNDO': {
      if (state.ballHistory.length === 0) return state;
      // For simplicity, reload from localStorage
      // In production, you'd want to track state history
      const savedState = storage.load();
      if (savedState.ballHistory.length === state.ballHistory.length - 1) {
        return savedState;
      }
      return state;
    }

    case 'END_INNINGS': {
      if (state.currentInning === 1) {
        return {
          ...state,
          currentInning: 2,
          target: state.innings.first.runs + 1,
          innings: {
            ...state.innings,
            second: { ...INITIAL_INNING_STATE },
          },
        };
      }
      return state;
    }

    case 'SET_TOTAL_OVERS': {
      return { ...state, totalOvers: action.totalOvers };
    }

    case 'NEW_MATCH': {
      storage.clear();
      return {
        ...INITIAL_MATCH_STATE,
        totalOvers: action.totalOvers ?? DEFAULT_TOTAL_OVERS,
      };
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    default:
      return state;
  }
}

export function useMatch() {
  const [state, dispatch] = useReducer(matchReducer, INITIAL_MATCH_STATE);

  // Load saved state on mount
  useEffect(() => {
    const savedState = storage.load();
    if (savedState.ballHistory.length > 0 || savedState.currentInning === 2 || savedState.totalOvers !== DEFAULT_TOTAL_OVERS) {
      dispatch({ type: 'LOAD_STATE', state: savedState });
    }
  }, []);

  // Auto-save on every state change
  useEffect(() => {
    storage.save(state);
  }, [state]);

  // Action creators
  const addRun = useCallback((runs: number) => {
    dispatch({ type: 'ADD_RUN', runs });
  }, []);

  const addWicket = useCallback((runs: number = 0) => {
    dispatch({ type: 'ADD_WICKET', runs });
  }, []);

  const addWide = useCallback(() => {
    dispatch({ type: 'ADD_WIDE' });
  }, []);

  const addWideWicket = useCallback(() => {
    dispatch({ type: 'ADD_WIDE_WICKET' });
  }, []);

  const addNoBall = useCallback((runs: number, isRunOut: boolean = false) => {
    dispatch({ type: 'ADD_NOBALL', runs, isRunOut });
  }, []);

  const addBye = useCallback((runs: number) => {
    dispatch({ type: 'ADD_BYE', runs });
  }, []);

  const addLegBye = useCallback((runs: number) => {
    dispatch({ type: 'ADD_LEGBYE', runs });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const endInnings = useCallback(() => {
    dispatch({ type: 'END_INNINGS' });
  }, []);

  const setTotalOvers = useCallback((totalOvers: number) => {
    dispatch({ type: 'SET_TOTAL_OVERS', totalOvers });
  }, []);

  const newMatch = useCallback((totalOvers?: number) => {
    dispatch({ type: 'NEW_MATCH', totalOvers });
  }, []);

  const setState = useCallback((newState: MatchState) => {
    dispatch({ type: 'LOAD_STATE', state: newState });
  }, []);

  // Player management
  const setTeamPlayers = useCallback((
    teamABatsmen: number[],
    teamBBatsmen: number[],
    teamABowlers: number[],
    teamBBowlers: number[],
    battingTeam: 'A' | 'B'
  ) => {
    dispatch({ type: 'SET_TEAM_PLAYERS', teamABatsmen, teamBBatsmen, teamABowlers, teamBBowlers, battingTeam });
  }, []);

  const setOpeningBatsmen = useCallback((strikerId: number, nonStrikerId: number) => {
    dispatch({ type: 'SET_OPENING_BATSMEN', strikerId, nonStrikerId });
  }, []);

  const setBowler = useCallback((bowlerId: number) => {
    dispatch({ type: 'SET_BOWLER', bowlerId });
  }, []);

  const nextBatsman = useCallback((batsmanId: number) => {
    dispatch({ type: 'NEXT_BATSMAN', batsmanId });
  }, []);

  const rotateStrike = useCallback(() => {
    dispatch({ type: 'ROTATE_STRIKE' });
  }, []);

  const setDismissal = useCallback((
    batsmanId: number,
    dismissalType: DismissalType,
    bowlerId?: number,
    fielderId?: number
  ) => {
    dispatch({ type: 'SET_DISMISSAL', batsmanId, dismissalType, bowlerId, fielderId });
  }, []);

  // Computed values
  const currentInning = getCurrentInning(state);
  const canEndInnings = !state.isMatchOver &&
    state.currentInning === 1 &&
    state.innings.first.balls > 0;

  const canUndo = state.ballHistory.length > 0 && !state.isMatchOver;
  const canScore = !state.isMatchOver &&
    currentInning.strikerId !== undefined &&
    currentInning.bowlerId !== undefined;

  const isFirstInningsComplete = state.currentInning === 2 || state.isMatchOver;
  const isSecondInningsComplete = state.isMatchOver;

  // Calculate runs required and balls remaining for second innings
  let runsRequired = 0;
  let ballsRemaining = 0;
  if (state.currentInning === 2 && state.target !== null) {
    runsRequired = Math.max(0, state.target - state.innings.second.runs);
    ballsRemaining = Math.max(0, (state.totalOvers * 6) - state.innings.second.balls);
  }

  return {
    state,
    currentInning,
    canEndInnings,
    canUndo,
    canScore,
    isFirstInningsComplete,
    isSecondInningsComplete,
    runsRequired,
    ballsRemaining,
    // Ball actions
    addRun,
    addWicket,
    addWide,
    addWideWicket,
    addNoBall,
    addBye,
    addLegBye,
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
    setState,
    // Player management
    setTeamPlayers,
    setOpeningBatsmen,
    setBowler,
    nextBatsman,
    rotateStrike,
    setDismissal,
  };
}
