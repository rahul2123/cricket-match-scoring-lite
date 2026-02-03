import { MatchState, InningState } from '../types';
import { formatOvers, calculateCRR, calculateRRR, formatRate } from '../utils/helpers';

interface ScoreBoardProps {
  state: MatchState;
  currentInning: InningState;
  runsRequired: number | null;
  ballsRemaining: number | null;
}

export function ScoreBoard({ state, currentInning, runsRequired, ballsRemaining }: ScoreBoardProps) {
  const isSecondInnings = state.currentInning === 2;
  const overs = formatOvers(currentInning.balls);
  
  // Calculate CRR (for both innings)
  const crr = calculateCRR(currentInning.runs, currentInning.balls);
  
  // Calculate RRR (only for second innings, using balls remaining)
  const rrr = runsRequired !== null && runsRequired > 0 && ballsRemaining !== null && ballsRemaining > 0
    ? calculateRRR(runsRequired, ballsRemaining)
    : null;

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-sm shrink-0">
      {/* Main Score + Innings */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-white font-mono tabular-nums">
            {currentInning.runs}<span className="text-slate-400 font-normal">/</span>{currentInning.wickets}
          </span>
          <span className="text-sm text-slate-400 font-medium">({overs})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
            state.currentInning === 1 ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            {state.currentInning === 1 ? '1st' : '2nd'}
          </span>
          <span className="text-[10px] text-slate-500">{state.totalOvers}ov</span>
        </div>
      </div>

      {/* Match Over Status */}
      {state.isMatchOver && (
        <div className="mb-2 py-1.5 px-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-center">
          <span className="text-xs font-semibold text-amber-200">
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
          <span className="text-[10px] text-slate-500">CRR <span className="font-mono text-slate-400">{formatRate(crr)}</span></span>
        </div>
      )}

      {/* Second Innings Stats - single compact row */}
      {isSecondInnings && state.target !== null && (
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <div className="bg-slate-700/50 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-slate-500 uppercase">Tgt</div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">{state.target}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-slate-500 uppercase">Need</div>
            <div className="text-sm font-bold font-mono tabular-nums text-emerald-400">
              {runsRequired !== null && runsRequired > 0 ? runsRequired : '✓'}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-slate-500 uppercase">Balls</div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">{ballsRemaining ?? '-'}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg px-1.5 py-1 text-center">
            <div className="text-[9px] text-slate-500 uppercase">RRR</div>
            <div className={`text-sm font-bold font-mono ${rrr !== null && rrr > crr ? 'text-red-400' : 'text-emerald-400'}`}>
              {rrr !== null ? formatRate(rrr) : (runsRequired !== null && runsRequired <= 0 ? '✓' : '-')}
            </div>
          </div>
        </div>
      )}

      {/* 1st innings ref + Extras - one line */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-700/60">
        {isSecondInnings ? (
          <span>1st: <span className="text-slate-400 font-medium">{state.innings.first.runs}/{state.innings.first.wickets}</span> ({formatOvers(state.innings.first.balls)})</span>
        ) : (
          <span />
        )}
        <span>WD {currentInning.extras.wides} · NB {currentInning.extras.noballs} · B {currentInning.extras.byes} · LB {currentInning.extras.legbyes}</span>
      </div>
    </div>
  );
}
