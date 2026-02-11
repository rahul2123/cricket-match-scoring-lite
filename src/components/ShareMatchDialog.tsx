import { useState } from 'react';

interface ShareMatchDialogProps {
    isOpen: boolean;
    matchCode: string | null;
    isSharing: boolean;
    onClose: () => void;
    onShare: () => void;
    onStopSharing: () => void;
}

export function ShareMatchDialog({
    isOpen,
    matchCode,
    isSharing,
    onClose,
    onShare,
    onStopSharing,
}: ShareMatchDialogProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareUrl = matchCode ? `${window.location.origin}?session=${matchCode}` : '';

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
            <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-5 max-w-md w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
                <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-4">
                    {isSharing ? 'Session Shared' : 'Share Session'}
                </h3>

                {!isSharing ? (
                    <>
                        <p className="text-cricket-target dark:text-cricket-dark-text/70 text-sm mb-4">
                            Share this session with spectators. They can view live score updates for all matches in this session.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onShare}
                                className="flex-1 py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90"
                            >
                                Start Sharing
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                                Session Code
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-cricket-bg dark:bg-white/10 rounded-lg px-4 py-3 border border-cricket-target/30 dark:border-white/20">
                                    <div className="text-2xl font-bold text-cricket-primary dark:text-cricket-dark-accent tracking-wider text-center font-mono">
                                        {matchCode}
                                    </div>
                                </div>
                                <button
                                    onClick={() => matchCode && handleCopy(matchCode)}
                                    className="px-4 py-2 rounded-lg bg-cricket-secondary dark:bg-white/15 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
                                >
                                    {copied ? '✓' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                                Share URL
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-cricket-bg dark:bg-white/10 rounded-lg px-3 py-2 border border-cricket-target/30 dark:border-white/20 overflow-hidden">
                                    <div className="text-xs text-cricket-score dark:text-cricket-dark-text truncate">
                                        {shareUrl}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCopy(shareUrl)}
                                    className="px-4 py-2 rounded-lg bg-cricket-secondary dark:bg-white/15 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
                                >
                                    {copied ? '✓' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 rounded-lg p-3 mb-4">
                            <p className="text-xs text-cricket-target dark:text-cricket-dark-text/70">
                                💡 Share the code or URL with spectators. New matches you create will automatically be visible to viewers.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
                            >
                                Close
                            </button>
                            <button
                                onClick={onStopSharing}
                                className="flex-1 py-2.5 rounded-lg bg-cricket-wicket text-white text-sm font-medium hover:opacity-90"
                            >
                                Stop Sharing
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
