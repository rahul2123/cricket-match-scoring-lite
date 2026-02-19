import { useState } from 'react';
import type { Team } from '../../types/tournament';

interface TossDialogProps {
  isOpen: boolean;
  teamA: Team;
  teamB: Team;
  onConfirm: (battingFirstTeamId: number) => void;
  onCancel: () => void;
}

export function TossDialog({
  isOpen,
  teamA,
  teamB,
  onConfirm,
  onCancel,
}: TossDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedTeamId !== null) {
      onConfirm(selectedTeamId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-5 max-w-md w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
        <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-2">
          Toss
        </h3>

        <p className="text-cricket-target dark:text-cricket-dark-text/70 text-sm mb-4">
          Who won the toss and chose to bat first?
        </p>

        <div className="space-y-2 mb-4">
          <button
            onClick={() => setSelectedTeamId(teamA.id)}
            className={`w-full p-3 rounded-lg border text-left transition-all ${
              selectedTeamId === teamA.id
                ? 'bg-cricket-primary/10 border-cricket-primary dark:border-cricket-dark-accent'
                : 'bg-cricket-bg dark:bg-white/5 border-cricket-target/30 dark:border-white/20 hover:border-cricket-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTeamId === teamA.id
                    ? 'border-cricket-primary dark:border-cricket-dark-accent'
                    : 'border-cricket-target/50 dark:border-white/30'
                }`}
              >
                {selectedTeamId === teamA.id && (
                  <div className="w-3 h-3 rounded-full bg-cricket-primary dark:bg-cricket-dark-accent" />
                )}
              </div>
              <span className="font-medium text-cricket-score dark:text-cricket-dark-text">
                {teamA.name}
              </span>
              {teamA.shortName && (
                <span className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
                  ({teamA.shortName})
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setSelectedTeamId(teamB.id)}
            className={`w-full p-3 rounded-lg border text-left transition-all ${
              selectedTeamId === teamB.id
                ? 'bg-cricket-primary/10 border-cricket-primary dark:border-cricket-dark-accent'
                : 'bg-cricket-bg dark:bg-white/5 border-cricket-target/30 dark:border-white/20 hover:border-cricket-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTeamId === teamB.id
                    ? 'border-cricket-primary dark:border-cricket-dark-accent'
                    : 'border-cricket-target/50 dark:border-white/30'
                }`}
              >
                {selectedTeamId === teamB.id && (
                  <div className="w-3 h-3 rounded-full bg-cricket-primary dark:bg-cricket-dark-accent" />
                )}
              </div>
              <span className="font-medium text-cricket-score dark:text-cricket-dark-text">
                {teamB.name}
              </span>
              {teamB.shortName && (
                <span className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
                  ({teamB.shortName})
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 rounded-lg p-3 mb-4">
          <p className="text-xs text-cricket-target dark:text-cricket-dark-text/70">
            Select the team that won the toss and elected to bat first. This determines which team bats in the first innings.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedTeamId === null}
            className="flex-1 py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
}
