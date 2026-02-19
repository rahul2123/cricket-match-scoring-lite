import { useState, useEffect } from 'react';
import { calculateDLSTarget, formatOversForDisplay, getMinimumOvers } from '../../utils/dls';

interface DLSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team1Name: string;
  team2Name: string;
  team1Runs: number;
  team1Overs: number;
  team1AllOut: boolean;
  maxOvers: number;
  onApply: (revisedTarget: number, revisedOvers: number) => void;
}

export function DLSDialog({
  isOpen,
  onClose,
  team1Name,
  team2Name,
  team1Runs,
  team1Overs,
  team1AllOut,
  maxOvers,
  onApply,
}: DLSDialogProps) {
  const [oversLost, setOversLost] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof calculateDLSTarget> | null>(null);

  const format = maxOvers <= 20 ? 't20' : maxOvers <= 50 ? 'odi' : 'custom';
  const minOvers = getMinimumOvers(format);
  const maxOversLost = maxOvers - minOvers;

  useEffect(() => {
    if (isOpen) {
      setOversLost(0);
      setResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (oversLost > 0 && oversLost <= maxOversLost) {
      const dlsResult = calculateDLSTarget(
        team1Runs,
        team1Overs,
        team1AllOut,
        maxOvers,
        oversLost
      );
      setResult(dlsResult);
    } else {
      setResult(null);
    }
  }, [oversLost, team1Runs, team1Overs, team1AllOut, maxOvers, maxOversLost]);

  if (!isOpen) return null;

  const revisedOvers = maxOvers - oversLost;
  const canApply = result && revisedOvers >= minOvers;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-5 max-w-md w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
        <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-4">
          🌧️ DLS Calculator
        </h3>

        <div className="bg-cricket-bg dark:bg-white/5 rounded-lg p-3 mb-4">
          <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
            First Innings Result
          </p>
          <p className="text-sm font-medium text-cricket-score dark:text-cricket-dark-text">
            {team1Name}: {team1Runs} {team1AllOut ? '(All Out)' : `in ${formatOversForDisplay(team1Overs)}`}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
            Overs lost due to rain (Team 2)
          </label>
          <input
            type="range"
            min="0"
            max={maxOversLost}
            value={oversLost}
            onChange={(e) => setOversLost(Number(e.target.value))}
            className="w-full h-2 bg-cricket-target/20 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-cricket-target dark:text-cricket-dark-text/60 mt-1">
            <span>0 overs lost</span>
            <span className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {oversLost} overs lost
            </span>
            <span>{maxOversLost} overs lost</span>
          </div>
        </div>

        {result && oversLost > 0 && (
          <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 rounded-lg p-4 mb-4">
            <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-3">
              Revised Target for {team2Name}
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-cricket-score dark:text-cricket-dark-text">
                  {result.target}
                </p>
                <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60">Target</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cricket-score dark:text-cricket-dark-text">
                  {formatOversForDisplay(revisedOvers)}
                </p>
                <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60">Overs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cricket-score dark:text-cricket-dark-text">
                  {result.parScore}
                </p>
                <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60">Par</p>
              </div>
            </div>

            {revisedOvers < minOvers && (
              <p className="text-xs text-cricket-wicket text-center mt-3">
                ⚠️ Match requires minimum {minOvers} overs per side
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-cricket-target/20 dark:border-white/10">
              <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 text-center">
                Resources: {team1Name} {result.resourcesTeam1}% • {team2Name} {result.resourcesTeam2}%
              </p>
            </div>
          </div>
        )}

        {oversLost === 0 && (
          <div className="bg-cricket-bg dark:bg-white/5 rounded-lg p-4 mb-4 text-center">
            <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">
              No overs lost. Original target: <span className="font-semibold text-cricket-score dark:text-cricket-dark-text">{team1Runs + 1}</span> in <span className="font-semibold text-cricket-score dark:text-cricket-dark-text">{maxOvers}</span> overs
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (canApply) {
                onApply(result!.target, revisedOvers);
                onClose();
              }
            }}
            disabled={!canApply}
            className="flex-1 py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium disabled:opacity-50"
          >
            Apply DLS
          </button>
        </div>

        <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/40 text-center mt-3">
          Simplified DLS calculation for amateur cricket
        </p>
      </div>
    </div>
  );
}
