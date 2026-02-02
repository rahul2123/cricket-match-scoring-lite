import { useState } from 'react';

interface ScoringButtonsProps {
  canScore: boolean;
  canUndo: boolean;
  canEndInnings: boolean;
  onAddRun: (runs: number) => void;
  onAddWide: () => void;
  onAddNoBall: () => void;
  onAddBye: (runs: number) => void;
  onAddLegBye: (runs: number) => void;
  onUndo: () => void;
  onEndInnings: () => void;
  onNewMatch: () => void;
}

type ExtraMode = 'bye' | 'legbye' | null;

export function ScoringButtons({
  canScore,
  canUndo,
  canEndInnings,
  onAddRun,
  onAddWide,
  onAddNoBall,
  onAddBye,
  onAddLegBye,
  onUndo,
  onEndInnings,
  onNewMatch,
}: ScoringButtonsProps) {
  const [extraMode, setExtraMode] = useState<ExtraMode>(null);
  const [showNewMatchConfirm, setShowNewMatchConfirm] = useState(false);
  const [showEndInningsConfirm, setShowEndInningsConfirm] = useState(false);

  const handleRunClick = (runs: number) => {
    if (!canScore) return;
    
    if (extraMode === 'bye') {
      onAddBye(runs);
      setExtraMode(null);
    } else if (extraMode === 'legbye') {
      onAddLegBye(runs);
      setExtraMode(null);
    } else {
      onAddRun(runs);
    }
  };

  const handleByeClick = () => {
    setExtraMode(extraMode === 'bye' ? null : 'bye');
  };

  const handleLegByeClick = () => {
    setExtraMode(extraMode === 'legbye' ? null : 'legbye');
  };

  const handleNewMatchClick = () => {
    setShowNewMatchConfirm(true);
  };

  const confirmNewMatch = () => {
    onNewMatch();
    setShowNewMatchConfirm(false);
    setExtraMode(null);
  };

  const handleEndInningsClick = () => {
    setShowEndInningsConfirm(true);
  };

  const confirmEndInnings = () => {
    onEndInnings();
    setShowEndInningsConfirm(false);
  };

  const buttonBase = "font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const runButton = `${buttonBase} bg-slate-700 hover:bg-slate-600 text-white h-14 text-xl`;
  const bigRunButton = `${buttonBase} text-white h-14 text-xl font-bold`;
  const extraButton = `${buttonBase} h-12 text-sm`;
  const actionButton = `${buttonBase} h-12 text-sm font-medium`;

  return (
    <div className="space-y-4">
      {/* Extra Mode Indicator */}
      {extraMode && (
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 text-center">
          <span className="text-purple-300 text-sm">
            Tap a run button to add {extraMode === 'bye' ? 'Bye' : 'Leg Bye'} runs
          </span>
          <button
            onClick={() => setExtraMode(null)}
            className="ml-3 text-purple-400 hover:text-purple-200 text-sm underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Run Buttons - Row 1 */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((runs) => (
          <button
            key={runs}
            onClick={() => handleRunClick(runs)}
            disabled={!canScore}
            className={`${runButton} ${extraMode ? 'ring-2 ring-purple-500' : ''}`}
          >
            {runs}
          </button>
        ))}
      </div>

      {/* Run Buttons - Row 2 (4 & 6) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleRunClick(4)}
          disabled={!canScore}
          className={`${bigRunButton} bg-blue-600 hover:bg-blue-500 ${extraMode ? 'ring-2 ring-purple-500' : ''}`}
        >
          4
        </button>
        <button
          onClick={() => handleRunClick(6)}
          disabled={!canScore}
          className={`${bigRunButton} bg-green-600 hover:bg-green-500 ${extraMode ? 'ring-2 ring-purple-500' : ''}`}
        >
          6
        </button>
      </div>

      {/* Extras Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => canScore && onAddWide()}
          disabled={!canScore || extraMode !== null}
          className={`${extraButton} bg-yellow-600/80 hover:bg-yellow-500/80 text-yellow-100`}
        >
          Wide
        </button>
        <button
          onClick={() => canScore && onAddNoBall()}
          disabled={!canScore || extraMode !== null}
          className={`${extraButton} bg-red-600/80 hover:bg-red-500/80 text-red-100`}
        >
          No Ball
        </button>
      </div>

      {/* Bye/Leg Bye Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleByeClick}
          disabled={!canScore}
          className={`${extraButton} ${
            extraMode === 'bye'
              ? 'bg-purple-600 text-white ring-2 ring-purple-400'
              : 'bg-purple-600/60 hover:bg-purple-500/60 text-purple-100'
          }`}
        >
          Bye
        </button>
        <button
          onClick={handleLegByeClick}
          disabled={!canScore}
          className={`${extraButton} ${
            extraMode === 'legbye'
              ? 'bg-purple-600 text-white ring-2 ring-purple-400'
              : 'bg-purple-600/60 hover:bg-purple-500/60 text-purple-100'
          }`}
        >
          Leg Bye
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700 my-2" />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`${actionButton} bg-slate-600 hover:bg-slate-500 text-slate-200`}
        >
          ↩ Undo
        </button>
        <button
          onClick={handleEndInningsClick}
          disabled={!canEndInnings}
          className={`${actionButton} bg-orange-600/80 hover:bg-orange-500/80 text-orange-100`}
        >
          End Innings
        </button>
      </div>

      {/* New Match Button */}
      <button
        onClick={handleNewMatchClick}
        className={`${actionButton} w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600`}
      >
        🏏 New Match
      </button>

      {/* New Match Confirmation Modal */}
      {showNewMatchConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Start New Match?</h3>
            <p className="text-slate-400 mb-6">
              This will clear all current match data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewMatchConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewMatch}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium"
              >
                New Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Innings Confirmation Modal */}
      {showEndInningsConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">End First Innings?</h3>
            <p className="text-slate-400 mb-6">
              This will set the target for the second innings. You can still undo after ending the innings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndInningsConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndInnings}
                className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium"
              >
                End Innings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
