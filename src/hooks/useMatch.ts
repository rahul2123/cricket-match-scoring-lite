import { useReducer, useEffect, useCallback } from 'react';
import {
  MatchState,
  MatchAction,
  Ball,
  InningState,
  INITIAL_MATCH_STATE,
  INITIAL_INNING_STATE,
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
  
  // Batting team wins if they reach or exceed target
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

    case 'ADD_NOBALL': {
      const ball: Ball = {
        id: generateId(),
        type: 'noball',
        runs: 1,
        inning: state.currentInning,
        timestamp: Date.now(),
      };

      const currentInning = getCurrentInningState(state);
      const updatedInning: InningState = {
        ...currentInning,
        runs: currentInning.runs + 1,
        // No-ball does NOT increase ball count
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
      let updatedInning: InningState = { ...inningToUpdate };
      
      // Revert runs
      updatedInning.runs = Math.max(0, updatedInning.runs - lastBall.runs);
      
      // Revert ball count (only for run, bye, legbye)
      if (lastBall.type === 'run' || lastBall.type === 'bye' || lastBall.type === 'legbye') {
        updatedInning.balls = Math.max(0, updatedInning.balls - 1);
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

      let newState: MatchState = {
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
      // Can only end innings in first innings
      if (state.currentInning !== 1) {
        return state;
      }

      const firstInningsScore = state.innings.first.runs;
      
      return {
        ...state,
        currentInning: 2,
        target: firstInningsScore + 1,
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
    if (savedState.ballHistory.length > 0 || savedState.currentInning === 2) {
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

  const addWide = useCallback(() => {
    dispatch({ type: 'ADD_WIDE' });
  }, []);

  const addNoBall = useCallback(() => {
    dispatch({ type: 'ADD_NOBALL' });
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

  const newMatch = useCallback(() => {
    dispatch({ type: 'NEW_MATCH' });
  }, []);

  // Computed values
  const currentInning = state.currentInning === 1 ? state.innings.first : state.innings.second;
  const canEndInnings = state.currentInning === 1;
  const canUndo = state.ballHistory.length > 0;
  const canScore = !state.isMatchOver;

  // Calculate runs required and balls remaining for second innings
  const runsRequired = state.target !== null ? state.target - state.innings.second.runs : null;
  
  return {
    state,
    currentInning,
    canEndInnings,
    canUndo,
    canScore,
    runsRequired,
    addRun,
    addWide,
    addNoBall,
    addBye,
    addLegBye,
    undo,
    endInnings,
    newMatch,
  };
}
