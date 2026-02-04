import { useState } from 'react';

interface JoinMatchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin: (matchCode: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

export function JoinMatchDialog({
    isOpen,
    onClose,
    onJoin,
    isLoading = false,
    error = null,
}: JoinMatchDialogProps) {
    const [matchCode, setMatchCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = matchCode.trim().toUpperCase();
        if (code.length === 6) {
            onJoin(code);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 6) {
            setMatchCode(value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
            <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-5 max-w-md w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-2">
                    Join Match
                </h3>
                <p className="text-cricket-target dark:text-cricket-dark-text/70 text-sm mb-4">
                    Enter the 6-character match code to view live score updates.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                            Match Code
                        </label>
                        <input
                            type="text"
                            value={matchCode}
                            onChange={handleInputChange}
                            placeholder="ABC123"
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-lg bg-cricket-bg dark:bg-white/10 text-cricket-score dark:text-cricket-dark-text border border-cricket-target/30 dark:border-white/20 focus:border-cricket-primary dark:focus:border-cricket-dark-accent focus:outline-none text-center text-2xl font-bold tracking-wider font-mono uppercase"
                            disabled={isLoading}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-xs text-cricket-wicket">{error}</p>
                        )}
                    </div>

                    <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 rounded-lg p-3 mb-4">
                        <p className="text-xs text-cricket-target dark:text-cricket-dark-text/70">
                            💡 Get the match code from the scorer who is sharing their match.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                            disabled={matchCode.length !== 6 || isLoading}
                        >
                            {isLoading ? 'Joining...' : 'Join Match'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
