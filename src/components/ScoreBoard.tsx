import { MatchState, InningState } from '../types';
import { formatOvers, calculateCRR, calculateRRR, formatRate } from '../utils/helpers';

interface ScoreBoardProps {
  state: MatchState;
  currentInning: InningState;
  runsRequired: number | null;
  ballsRemaining: number | null;
  isFirstInningsComplete?: boolean;
  isSecondInningsComplete?: boolean;
  onEndInnings?: () => void;
}

export function ScoreBoard({ state, currentInning, runsRequired, ballsRemaining, isFirstInningsComplete, isSecondInningsComplete, onEndInnings }: ScoreBoardProps) {
  const isSecondInnings = state.currentInning === 2;
  const overs = formatOvers(currentInning.balls);
  const crr = calculateCRR(currentInning.runs, currentInning.balls);
  const rrr = runsRequired !== null && runsRequired > 0 && ballsRemaining !== null && ballsRemaining > 0
    ? calculateRRR(runsRequired, ballsRemaining)
    : null;

  return (
    <div className="bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-xl p-3 shadow-sm shrink-0">
      {/* Main Score + Innings - Runs: Almost Black, Wickets: Muted Red */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-score-bold text-cricket-score dark:text-cricket-dark-text tabular-nums">
            {currentInning.runs}
            <span className="text-cricket-target dark:text-cricket-dark-text/70 font-normal">/</span>
            <span className="text-cricket-wicket">{currentInning.wickets}</span>
          </span>
          <span className="text-sm text-cricket-target dark:text-cricket-dark-text/70 font-medium">({overs})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
            state.currentInning === 1
              ? 'bg-cricket-secondary/15 text-cricket-secondary dark:bg-white/15 dark:text-cricket-dark-text'
              : 'bg-cricket-primary/15 text-cricket-primary dark:bg-cricket-dark-accent/20 dark:text-cricket-dark-accent'
          }`}>
            {state.currentInning === 1 ? '1st' : '2nd'}
          </span>
          <span className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">{state.totalOvers}ov</span>
        </div>
      </div>

      {/* First innings complete - prompt to end innings (no more runs until then) */}
      {isFirstInningsComplete && onEndInnings && (
        <div className="mb-2 py-2 px-3 rounded-lg bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 border border-cricket-primary/30 dark:border-cricket-dark-accent/30">
          <p className="text-xs text-cricket-score dark:text-cricket-dark-text text-center mb-2">
            First innings complete ({state.totalOvers} overs). End innings to start second innings.
          </p>
          <button
            type="button"
            onClick={onEndInnings}
            className="w-full py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-semibold hover:opacity-90"
          >
            End Innings
          </button>
        </div>
      )}

      {/* Second innings complete - prompt to end innings and declare result */}
      {isSecondInningsComplete && onEndInnings && (
        <div className="mb-2 py-2 px-3 rounded-lg bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 border border-cricket-primary/30 dark:border-cricket-dark-accent/30">
          <p className="text-xs text-cricket-score dark:text-cricket-dark-text text-center mb-2">
            Second innings complete ({state.totalOvers} overs). End innings to declare result.
          </p>
          <button
            type="button"
            onClick={onEndInnings}
            className="w-full py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-semibold hover:opacity-90"
          >
            End Innings
          </button>
        </div>
      )}

      {/* Match Over Status - Success green / neutral */}
      {state.isMatchOver && (
        <div className="mb-2 py-1.5 px-2 rounded-lg bg-cricket-success/15 dark:bg-cricket-dark-accent/15 border border-cricket-success/30 dark:border-cricket-dark-accent/30 text-center">
          <span className="text-xs font-semibold text-cricket-success dark:text-cricket-dark-accent">
            {state.winner === 'batting'
              ? `Batting wins by ${10 - state.innings.second.wickets} wkt`
              : state.winner === 'bowling'
              ? 'Bowling wins'
              : 'Match Over'}
          </span>
        </div>
      )}

      {/* First Innings - CRR only */}
      {!isSecondInnings && (
        <div className="flex justify-end">
          <span className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">CRR <span className="font-score text-cricket-score dark:text-cricket-dark-text">{formatRate(crr)}</span></span>
        </div>
      )}

      {/* Second Innings Stats - Target/Need/Balls/RRR: Slate; Success when done */}
      {isSecondInnings && state.target !== null && (
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <div className="bg-cricket-bg dark:bg-white/5 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-cricket-target dark:text-cricket-dark-text/60 uppercase">Tgt</div>
            <div className="text-sm font-score-bold text-cricket-score dark:text-cricket-dark-text tabular-nums">{state.target}</div>
          </div>
          <div className="bg-cricket-bg dark:bg-white/5 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-cricket-target dark:text-cricket-dark-text/60 uppercase">Need</div>
            <div className={`text-sm font-score-bold tabular-nums ${runsRequired !== null && runsRequired > 0 ? 'text-cricket-target dark:text-cricket-dark-text' : 'text-cricket-success dark:text-cricket-dark-accent'}`}>
              {runsRequired !== null && runsRequired > 0 ? runsRequired : '✓'}
            </div>
          </div>
          <div className="bg-cricket-bg dark:bg-white/5 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-cricket-target dark:text-cricket-dark-text/60 uppercase">Balls</div>
            <div className="text-sm font-score-bold text-cricket-score dark:text-cricket-dark-text tabular-nums">{ballsRemaining ?? '-'}</div>
          </div>
          <div className="bg-cricket-bg dark:bg-white/5 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-cricket-target dark:text-cricket-dark-text/60 uppercase">RRR</div>
            <div className={`text-sm font-score-bold tabular-nums ${rrr !== null && rrr > crr ? 'text-cricket-wicket' : 'text-cricket-success dark:text-cricket-dark-accent'}`}>
              {rrr !== null ? formatRate(rrr) : (runsRequired !== null && runsRequired <= 0 ? '✓' : '-')}
            </div>
          </div>
        </div>
      )}

      {/* 1st innings ref + Extras - Extras: Mustard */}
      <div className="flex items-center justify-between text-[10px] text-cricket-target dark:text-cricket-dark-text/60 pt-1.5 border-t border-cricket-target/20 dark:border-white/10">
        {isSecondInnings ? (
          <span>1st: <span className="text-cricket-score dark:text-cricket-dark-text font-medium tabular-nums">{state.innings.first.runs}/{state.innings.first.wickets}</span> ({formatOvers(state.innings.first.balls)})</span>
        ) : (
          <span />
        )}
        <span className="text-cricket-extras">WD {currentInning.extras.wides} · NB {currentInning.extras.noballs} · B {currentInning.extras.byes} · LB {currentInning.extras.legbyes}</span>
      </div>
    </div>
  );
}
