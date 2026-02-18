import { useState } from 'react';

interface CreateTournamentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    oversPerMatch: number;
    pointsWin: number;
    pointsTie: number;
  }) => void;
  isLoading?: boolean;
}

export function CreateTournamentDialog({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateTournamentDialogProps) {
  const [name, setName] = useState('');
  const [oversPerMatch, setOversPerMatch] = useState(20);
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsTie, setPointsTie] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      oversPerMatch,
      pointsWin,
      pointsTie,
    });
  };

  const handleClose = () => {
    setName('');
    setOversPerMatch(20);
    setPointsWin(2);
    setPointsTie(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-5 max-w-md w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
        <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-4">
          Create Tournament
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Tournament Name */}
          <div className="mb-4">
            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
              Tournament Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday Cricket League 2024"
              className="w-full px-3 py-2.5 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-cricket-primary dark:focus:ring-cricket-dark-accent"
              autoFocus
            />
          </div>

          {/* Overs per Match */}
          <div className="mb-4">
            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
              Overs per Match
            </label>
            <select
              value={oversPerMatch}
              onChange={(e) => setOversPerMatch(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-cricket-primary dark:focus:ring-cricket-dark-accent"
            >
              <option value={6}>6 Overs (Tape Ball)</option>
              <option value={10}>10 Overs</option>
              <option value={12}>12 Overs</option>
              <option value={15}>15 Overs</option>
              <option value={20}>20 Overs (T20)</option>
              <option value={25}>25 Overs</option>
              <option value={30}>30 Overs</option>
              <option value={40}>40 Overs</option>
              <option value={50}>50 Overs (ODI)</option>
            </select>
          </div>

          {/* Points Configuration */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                Points for Win
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={pointsWin}
                onChange={(e) => setPointsWin(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm text-center focus:outline-none focus:ring-2 focus:ring-cricket-primary dark:focus:ring-cricket-dark-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                Points for Tie
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={pointsTie}
                onChange={(e) => setPointsTie(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm text-center focus:outline-none focus:ring-2 focus:ring-cricket-primary dark:focus:ring-cricket-dark-accent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
