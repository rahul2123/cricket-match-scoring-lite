import type { TeamPlayer } from '../../types/tournament';

interface PlayerSelectionDialogProps {
  isOpen: boolean;
  title: string;
  players: TeamPlayer[];
  selectedIds: number[];
  onSelect: (profileId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  multiSelect?: boolean;
  showRole?: boolean;
}

export function PlayerSelectionDialog({
  isOpen,
  title,
  players,
  selectedIds,
  onSelect,
  onConfirm,
  onCancel,
  multiSelect = false,
  showRole = true,
}: PlayerSelectionDialogProps) {
  if (!isOpen) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'batsman':
        return 'bg-cricket-primary/20 text-cricket-primary';
      case 'bowler':
        return 'bg-cricket-success/20 text-cricket-success';
      case 'all-rounder':
        return 'bg-cricket-extras/20 text-cricket-extras';
      default:
        return 'bg-cricket-target/20 text-cricket-target';
    }
  };

  const canConfirm = selectedIds.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-4 max-w-md w-full shadow-xl border border-cricket-target/20 dark:border-white/10 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-3">
          {title}
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {players.length === 0 ? (
            <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60 text-center py-4">
              No players available
            </p>
          ) : (
            players.map((player) => {
              const isSelected = selectedIds.includes(player.profileId);
              const isDisabled = !multiSelect && selectedIds.length > 0 && !isSelected;

              return (
                <button
                  key={player.id}
                  onClick={() => !isDisabled && onSelect(player.profileId)}
                  disabled={isDisabled}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-cricket-primary/20 border-cricket-primary dark:border-cricket-dark-accent'
                      : isDisabled
                      ? 'bg-cricket-bg/50 dark:bg-white/5 border-transparent opacity-50'
                      : 'bg-cricket-bg dark:bg-white/5 border-cricket-target/20 dark:border-white/10 hover:border-cricket-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${
                      isSelected
                        ? 'text-cricket-primary dark:text-cricket-dark-accent'
                        : 'text-cricket-score dark:text-cricket-dark-text'
                    }`}>
                      {player.profile?.name || 'Unknown'}
                    </span>
                    {showRole && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRoleColor(player.role)}`}>
                        {player.role.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-cricket-primary dark:text-cricket-dark-accent text-lg">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-cricket-target/10 dark:border-white/10">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
