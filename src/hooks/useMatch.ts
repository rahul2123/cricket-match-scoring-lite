import { useReducer, useEffect, useCallback } from 'react';
import {
  MatchState,
  MatchAction,
  Ball,
  InningState,
  INITIAL_MATCH_STATE,
  INITIAL_INNING_STATE,
  DEFAULT_TOTAL_OVERS,
} from '../types';
import { storage } from '../utils/storage';
import { generateId } from '../utils/helpers';

function getCurrentInningState(state: MatchState): InningState {
  return state.currentInning === 1 ? state.innings.first : state.innings.second;
}

function checkMatchEnd(state: MatchState): MatchState {
  // Only check for match end in second innings
  if (state.currentInning !== 2 || state.target === null) {
    return state;
  }

  const secondInning = state.innings.second;
  
  // Batting team wins if they reach or exceed target (no 10-wicket auto-end; use End Innings to finish)
  if (secondInning.runs >= state.target) {
    return {
      ...state,
      isMatchOver: true,
      winner: 'batting',
    };
  }

  return state;
}

function matchReducer(state: MatchState, action: MatchAction): MatchState {
  // Prevent any scoring if match is over
  if (state.isMatchOver && action.type !== 'NEW_MATCH' && action.type !== 'UNDO') {
    return state;
  }

  switch (action.type) {
    case 'ADD_RUN': {
      const ball: Ball = {
        id: generateId(),
        type: 'run',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + action.runs,
        balls: currentInning.balls + 1,
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'ADD_WICKET': {
      const ball: Ball = {
        id: generateId(),
        type: 'wicket',
        runs: action.runs, // Runs scored before the wicket (e.g., caught on boundary attempt)
        inning: state.currentInning,
        timestamp: Date.now(),
        isWicket: true,
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + action.runs,
        balls: currentInning.balls + 1,
        wickets: currentInning.wickets + 1,
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'ADD_WIDE': {
      const ball: Ball = {
        id: generateId(),
        type: 'wide',
        runs: 1,
        inning: state.currentInning,
        timestamp: Date.now(),
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + 1,
        // Wide does NOT increase ball count
        extras: {
          ...currentInning.extras,
          wides: currentInning.extras.wides + 1,
        },
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'ADD_WIDE_WICKET': {
      // Wide + wicket (e.g. stumping): 1 run, 1 wicket, ball does NOT count
      const ball: Ball = {
        id: generateId(),
        type: 'wide',
        runs: 1,
        inning: state.currentInning,
        timestamp: Date.now(),
        isWicket: true,
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + 1,
        wickets: currentInning.wickets + 1,
        // Wide does NOT increase ball count
        extras: {
          ...currentInning.extras,
          wides: currentInning.extras.wides + 1,
        },
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'ADD_NOBALL': {
      // No-ball: 1 run penalty + any runs scored on the ball
      // Ball counts ONLY if there's a run-out
      const totalRuns = 1 + action.runs; // 1 for no-ball + runs scored
      
      const ball: Ball = {
        id: generateId(),
        type: 'noball',
        runs: totalRuns,
        inning: state.currentInning,
        timestamp: Date.now(),
        isRunOut: action.isRunOut,
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + totalRuns,
        // Ball counts ONLY if there's a run-out
        balls: action.isRunOut ? currentInning.balls + 1 : currentInning.balls,
        // Wicket counts if run-out
        wickets: action.isRunOut ? currentInning.wickets + 1 : currentInning.wickets,
        extras: {
          ...currentInning.extras,
          noballs: currentInning.extras.noballs + 1,
        },
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'ADD_BYE': {
      const ball: Ball = {
        id: generateId(),
        type: 'bye',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + action.runs,
        balls: currentInning.balls + 1, // Bye DOES increase ball count
        extras: {
          ...currentInning.extras,
          byes: currentInning.extras.byes + action.runs,
        },
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'ADD_LEGBYE': {
      const ball: Ball = {
        id: generateId(),
        type: 'legbye',
        runs: action.runs,
        inning: state.currentInning,
        timestamp: Date.now(),
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + action.runs,
        balls: currentInning.balls + 1, // Leg bye DOES increase ball count
        extras: {
          ...currentInning.extras,
          legbyes: currentInning.extras.legbyes + action.runs,
        },
      };

      const newState: MatchState = {
        ...state,
        innings: {
          first: state.currentInning === 1 ? updatedInning : state.innings.first,
          second: state.currentInning === 2 ? updatedInning : state.innings.second,
        },
        ballHistory: [...state.ballHistory, ball],
      };

      return checkMatchEnd(newState);
    }

    case 'UNDO': {
      if (state.ballHistory.length === 0) {
        return state;
      }

      const lastBall = state.ballHistory[state.ballHistory.length - 1];
      const targetInning = lastBall.inning;
      const inningToUpdate = targetInning === 1 ? state.innings.first : state.innings.second;

      // Calculate the changes to revert
      let updatedInning: InningState = { 
        ...inningToUpdate,
        extras: { ...inningToUpdate.extras },
      };
      
      // Revert runs
      updatedInning.runs = Math.max(0, updatedInning.runs - lastBall.runs);
      
      // Revert ball count
      // For no-ball: only revert ball count if it was a run-out
      if (lastBall.type === 'run' || lastBall.type === 'bye' || lastBall.type === 'legbye' || lastBall.type === 'wicket') {
        updatedInning.balls = Math.max(0, updatedInning.balls - 1);
      } else if (lastBall.type === 'noball' && lastBall.isRunOut) {
        updatedInning.balls = Math.max(0, updatedInning.balls - 1);
      }

      // Revert wicket
      if (lastBall.type === 'wicket' || (lastBall.type === 'noball' && lastBall.isRunOut) || (lastBall.type === 'wide' && lastBall.isWicket)) {
        updatedInning.wickets = Math.max(0, updatedInning.wickets - 1);
      }

      // Revert extras
      switch (lastBall.type) {
        case 'wide':
          updatedInning.extras = {
            ...updatedInning.extras,
            wides: Math.max(0, updatedInning.extras.wides - 1),
          };
          break;
        case 'noball':
          updatedInning.extras = {
            ...updatedInning.extras,
            noballs: Math.max(0, updatedInning.extras.noballs - 1),
          };
          break;
        case 'bye':
          updatedInning.extras = {
            ...updatedInning.extras,
            byes: Math.max(0, updatedInning.extras.byes - lastBall.runs),
          };
          break;
        case 'legbye':
          updatedInning.extras = {
            ...updatedInning.extras,
            legbyes: Math.max(0, updatedInning.extras.legbyes - lastBall.runs),
          };
          break;
      }

      // If we're undoing from second innings and it becomes empty,
      // and the last ball was from the first innings' last ball,
      // we need to handle the case where we undo across innings
      const newBallHistory = state.ballHistory.slice(0, -1);
      
      // Check if we need to switch back to first innings
      const shouldSwitchToFirstInnings = 
        state.currentInning === 2 && 
        targetInning === 1 &&
        newBallHistory.filter(b => b.inning === 2).length === 0;

      const newState: MatchState = {
        ...state,
        currentInning: shouldSwitchToFirstInnings ? 1 : state.currentInning,
        innings: {
          first: targetInning === 1 ? updatedInning : state.innings.first,
          second: targetInning === 2 ? updatedInning : (shouldSwitchToFirstInnings ? { ...INITIAL_INNING_STATE } : state.innings.second),
        },
        target: shouldSwitchToFirstInnings ? null : state.target,
        ballHistory: newBallHistory,
        isMatchOver: false,
        winner: null,
      };

      return newState;
    }

    case 'END_INNINGS': {
      if (state.currentInning === 1) {
        const firstInningsScore = state.innings.first.runs;
        return {
          ...state,
          currentInning: 2,
          target: firstInningsScore + 1,
        };
      }

      // End second innings: declare match over and set winner by runs
      if (state.currentInning === 2 && state.target !== null) {
        const secondInning = state.innings.second;
        const battingWins = secondInning.runs >= state.target;
        return {
          ...state,
          isMatchOver: true,
          winner: battingWins ? 'batting' : 'bowling',
        };
      }

      return state;
    }

    case 'SET_TOTAL_OVERS': {
      return {
        ...state,
        totalOvers: action.totalOvers,
      };
    }

    case 'NEW_MATCH': {
      storage.clear();
      return {
        ...INITIAL_MATCH_STATE,
        innings: {
          first: { ...INITIAL_INNING_STATE },
          second: { ...INITIAL_INNING_STATE },
        },
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

  // Computed values
  const currentInning = state.currentInning === 1 ? state.innings.first : state.innings.second;
  const canEndInnings = !state.isMatchOver;
  const canUndo = state.ballHistory.length > 0;
  const totalBallsPerInnings = state.totalOvers * 6;
  const isFirstInningsComplete = state.currentInning === 1 && state.innings.first.balls >= totalBallsPerInnings;
  const isSecondInningsComplete = state.currentInning === 2 && state.innings.second.balls >= totalBallsPerInnings;
  const canScore = !state.isMatchOver && !isFirstInningsComplete && !isSecondInningsComplete;

  // Calculate runs required and balls remaining for second innings
  const runsRequired = state.target !== null ? state.target - state.innings.second.runs : null;
  const totalBalls = state.totalOvers * 6;
  const ballsRemaining = state.currentInning === 2 ? totalBalls - state.innings.second.balls : null;

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
    totalBalls,
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
  };
}
