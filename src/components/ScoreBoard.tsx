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
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 shadow-xl">
      {/* Main Score */}
      <div className="text-center mb-4">
        <div className="text-6xl font-bold text-white font-mono tracking-tight">
          {currentInning.runs}/{currentInning.wickets}
        </div>
        <div className="text-2xl text-primary-200 font-medium mt-1">
          ({overs} overs)
        </div>
      </div>

      {/* Innings Indicator & Match Format */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <span className={`
          px-4 py-1.5 rounded-full text-sm font-semibold
          ${state.currentInning === 1 
            ? 'bg-blue-500/30 text-blue-200' 
            : 'bg-green-500/30 text-green-200'}
        `}>
          {state.currentInning === 1 ? '1st Innings' : '2nd Innings'}
        </span>
        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-600/50 text-slate-300">
          {state.totalOvers} ov match
        </span>
      </div>

      {/* Match Over Status */}
      {state.isMatchOver && (
        <div className="text-center mb-4">
          <span className="px-4 py-2 rounded-full bg-yellow-500/30 text-yellow-200 text-lg font-bold">
            {state.winner === 'batting' 
              ? `🏆 Batting team wins by ${10 - state.innings.second.wickets} wickets!`
              : state.winner === 'bowling'
              ? '🏆 Bowling team wins!'
              : 'Match Over!'}
          </span>
        </div>
      )}

      {/* First Innings - Show CRR */}
      {!isSecondInnings && (
        <div className="flex justify-center mt-4">
          <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
            <div className="text-xs text-primary-300 uppercase tracking-wider font-medium">
              Current Run Rate
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {formatRate(crr)}
            </div>
          </div>
        </div>
      )}

      {/* Second Innings Stats */}
      {isSecondInnings && state.target !== null && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Target */}
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-300 uppercase tracking-wider font-medium">
              Target
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {state.target}
            </div>
          </div>

          {/* Runs Required */}
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-300 uppercase tracking-wider font-medium">
              Need
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {runsRequired !== null && runsRequired > 0 ? runsRequired : '✓'}
            </div>
          </div>

          {/* Balls Remaining */}
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-300 uppercase tracking-wider font-medium">
              Balls Left
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {ballsRemaining !== null ? ballsRemaining : '-'}
            </div>
          </div>

          {/* CRR */}
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-300 uppercase tracking-wider font-medium">
              CRR
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {formatRate(crr)}
            </div>
          </div>

          {/* RRR - Full width */}
          <div className="col-span-2 bg-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-primary-300 uppercase tracking-wider font-medium">
              Required Run Rate
            </div>
            <div className={`text-2xl font-bold font-mono ${
              rrr !== null && rrr > crr ? 'text-red-300' : 'text-green-300'
            }`}>
              {rrr !== null ? formatRate(rrr) : (runsRequired !== null && runsRequired <= 0 ? '✓ Won' : '-')}
            </div>
            {rrr !== null && runsRequired !== null && ballsRemaining !== null && (
              <div className="text-xs text-primary-400 mt-1">
                {runsRequired} runs from {ballsRemaining} balls
              </div>
            )}
          </div>
        </div>
      )}

      {/* First Innings - Show 1st innings score if in 2nd */}
      {isSecondInnings && (
        <div className="mt-4 pt-4 border-t border-white/20 text-center">
          <span className="text-sm text-primary-300">
            1st Innings: <span className="font-bold text-white">{state.innings.first.runs}/{state.innings.first.wickets}</span>
            <span className="text-primary-400"> ({formatOvers(state.innings.first.balls)})</span>
          </span>
        </div>
      )}

      {/* Extras Summary */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-xs text-primary-300 uppercase tracking-wider font-medium text-center mb-2">
          Extras
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <span className="text-yellow-300">
            WD: {currentInning.extras.wides}
          </span>
          <span className="text-red-300">
            NB: {currentInning.extras.noballs}
          </span>
          <span className="text-purple-300">
            B: {currentInning.extras.byes}
          </span>
          <span className="text-purple-300">
            LB: {currentInning.extras.legbyes}
          </span>
        </div>
      </div>
    </div>
  );
}
