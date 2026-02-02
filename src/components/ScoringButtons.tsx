import { useState } from 'react';

interface ScoringButtonsProps {
  canScore: boolean;
  canUndo: boolean;
  canEndInnings: boolean;
  totalOvers: number;
  onAddRun: (runs: number) => void;
  onAddWicket: (runs: number) => void;
  onAddWide: () => void;
  onAddNoBall: (runs: number, isRunOut: boolean) => void;
  onAddBye: (runs: number) => void;
  onAddLegBye: (runs: number) => void;
  onUndo: () => void;
  onEndInnings: () => void;
  onNewMatch: (totalOvers?: number) => void;
  onSetTotalOvers: (totalOvers: number) => void;
}

type ExtraMode = 'bye' | 'legbye' | 'noball' | 'wicket' | null;

const QUICK_OVER_OPTIONS = [5, 10, 20];

export function ScoringButtons({
  canScore,
  canUndo,
  canEndInnings,
  totalOvers,
  onAddRun,
  onAddWicket,
  onAddWide,
  onAddNoBall,
  onAddBye,
  onAddLegBye,
  onUndo,
  onEndInnings,
  onNewMatch,
  onSetTotalOvers,
}: ScoringButtonsProps) {
  const [extraMode, setExtraMode] = useState<ExtraMode>(null);
  const [showNewMatchConfirm, setShowNewMatchConfirm] = useState(false);
  const [showEndInningsConfirm, setShowEndInningsConfirm] = useState(false);
  const [showNoBallRunOutConfirm, setShowNoBallRunOutConfirm] = useState(false);
  const [pendingNoBallRuns, setPendingNoBallRuns] = useState(0);
  const [showOversSelector, setShowOversSelector] = useState(false);
  const [selectedOvers, setSelectedOvers] = useState(totalOvers);
  const [customOvers, setCustomOvers] = useState('');

  const handleRunClick = (runs: number) => {
    if (!canScore) return;
    
    if (extraMode === 'bye') {
      onAddBye(runs);
      setExtraMode(null);
    } else if (extraMode === 'legbye') {
      onAddLegBye(runs);
      setExtraMode(null);
    } else if (extraMode === 'noball') {
      // Ask if there was a run-out
      setPendingNoBallRuns(runs);
      setShowNoBallRunOutConfirm(true);
    } else if (extraMode === 'wicket') {
      // Wicket with runs scored before (e.g., caught attempting second run)
      onAddWicket(runs);
      setExtraMode(null);
    } else {
      onAddRun(runs);
    }
  };

  const handleNoBallConfirm = (isRunOut: boolean) => {
    onAddNoBall(pendingNoBallRuns, isRunOut);
    setShowNoBallRunOutConfirm(false);
    setPendingNoBallRuns(0);
    setExtraMode(null);
  };

  const handleByeClick = () => {
    setExtraMode(extraMode === 'bye' ? null : 'bye');
  };

  const handleLegByeClick = () => {
    setExtraMode(extraMode === 'legbye' ? null : 'legbye');
  };

  const handleNoBallClick = () => {
    setExtraMode(extraMode === 'noball' ? null : 'noball');
  };

  const handleWicketClick = () => {
    if (!canScore) return;
    // If already in wicket mode, cancel it
    if (extraMode === 'wicket') {
      setExtraMode(null);
    } else {
      // Default: wicket with 0 runs
      setExtraMode('wicket');
    }
  };

  const handleQuickWicket = () => {
    if (!canScore) return;
    onAddWicket(0);
  };

  const handleNewMatchClick = () => {
    setSelectedOvers(totalOvers);
    setCustomOvers('');
    setShowOversSelector(true);
  };

  const confirmOversAndShowNewMatch = () => {
    setShowOversSelector(false);
    setShowNewMatchConfirm(true);
  };

  const confirmNewMatch = () => {
    onNewMatch(selectedOvers);
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

  const handleOversChange = (overs: number) => {
    setSelectedOvers(overs);
    setCustomOvers('');
    onSetTotalOvers(overs);
  };

  const handleCustomOversChange = (value: string) => {
    setCustomOvers(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      setSelectedOvers(parsed);
      onSetTotalOvers(parsed);
    }
  };

  const buttonBase = "font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const runButton = `${buttonBase} bg-slate-700 hover:bg-slate-600 text-white h-14 text-xl`;
  const bigRunButton = `${buttonBase} text-white h-14 text-xl font-bold`;
  const extraButton = `${buttonBase} h-12 text-sm`;
  const actionButton = `${buttonBase} h-12 text-sm font-medium`;

  const getExtraModeLabel = () => {
    switch (extraMode) {
      case 'bye': return 'Bye';
      case 'legbye': return 'Leg Bye';
      case 'noball': return 'No Ball';
      case 'wicket': return 'Wicket';
      default: return '';
    }
  };

  const getExtraModeColor = () => {
    switch (extraMode) {
      case 'bye':
      case 'legbye':
        return 'purple';
      case 'noball':
        return 'red';
      case 'wicket':
        return 'orange';
      default:
        return 'purple';
    }
  };

  const getModeStyles = () => {
    switch (extraMode) {
      case 'noball':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5', btn: '#f87171' };
      case 'wicket':
        return { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.3)', text: '#fdba74', btn: '#fb923c' };
      default:
        return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.3)', text: '#d8b4fe', btn: '#c084fc' };
    }
  };

  const getRingColor = () => {
    switch (extraMode) {
      case 'noball': return 'ring-red-500';
      case 'wicket': return 'ring-orange-500';
      default: return 'ring-purple-500';
    }
  };

  const modeStyles = getModeStyles();

  return (
    <div className="space-y-4">
      {/* Match Overs Display */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-2">
        <span className="text-slate-400 text-sm">Match Format</span>
        <button
          onClick={() => setShowOversSelector(true)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          {totalOvers} overs ▾
        </button>
      </div>

      {/* Extra Mode Indicator */}
      {extraMode && (
        <div 
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: modeStyles.bg, borderColor: modeStyles.border, borderWidth: 1 }}
        >
          <span className="text-sm" style={{ color: modeStyles.text }}>
            {extraMode === 'wicket' 
              ? 'Tap 0 for clean wicket, or tap runs if batsman crossed before wicket'
              : extraMode === 'noball'
              ? 'Tap a run button to add No Ball runs (1 penalty + runs scored)'
              : `Tap a run button to add ${getExtraModeLabel()} runs`
            }
          </span>
          <button
            onClick={() => setExtraMode(null)}
            className="ml-3 hover:opacity-70 text-sm underline"
            style={{ color: modeStyles.btn }}
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
            className={`${runButton} ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
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
          className={`${bigRunButton} bg-blue-600 hover:bg-blue-500 ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
        >
          4
        </button>
        <button
          onClick={() => handleRunClick(6)}
          disabled={!canScore}
          className={`${bigRunButton} bg-green-600 hover:bg-green-500 ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
        >
          6
        </button>
      </div>

      {/* Wicket Button */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleQuickWicket}
          disabled={!canScore}
          className={`${extraButton} bg-orange-600 hover:bg-orange-500 text-white font-bold`}
        >
          W (Wicket)
        </button>
        <button
          onClick={handleWicketClick}
          disabled={!canScore}
          className={`${extraButton} ${
            extraMode === 'wicket'
              ? 'bg-orange-600 text-white ring-2 ring-orange-400'
              : 'bg-orange-600/60 hover:bg-orange-500/60 text-orange-100'
          }`}
        >
          W + Runs
        </button>
      </div>

      {/* Extras Row - Wide & No Ball */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => canScore && onAddWide()}
          disabled={!canScore || extraMode !== null}
          className={`${extraButton} bg-yellow-600/80 hover:bg-yellow-500/80 text-yellow-100`}
        >
          Wide (+1)
        </button>
        <button
          onClick={handleNoBallClick}
          disabled={!canScore}
          className={`${extraButton} ${
            extraMode === 'noball'
              ? 'bg-red-600 text-white ring-2 ring-red-400'
              : 'bg-red-600/80 hover:bg-red-500/80 text-red-100'
          }`}
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
          className={`${actionButton} bg-cyan-600/80 hover:bg-cyan-500/80 text-cyan-100`}
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

      {/* Overs Selector Modal */}
      {showOversSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Match Overs</h3>
            
            {/* Quick Options */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {QUICK_OVER_OPTIONS.map((overs) => (
                <button
                  key={overs}
                  onClick={() => handleOversChange(overs)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    selectedOvers === overs && customOvers === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {overs}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Custom overs</label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Enter overs (1-100)"
                value={customOvers}
                onChange={(e) => handleCustomOversChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none text-center text-lg"
              />
            </div>

            <div className="text-center mb-4">
              <span className="text-slate-400">Selected: </span>
              <span className="text-white font-bold text-lg">{selectedOvers} overs</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOversSelector(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Match Confirmation Modal */}
      {showNewMatchConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Start New Match?</h3>
            <p className="text-slate-400 mb-4">
              This will clear all current match data. This action cannot be undone.
            </p>
            <p className="text-slate-300 mb-6">
              Match format: <span className="font-bold text-blue-400">{selectedOvers} overs</span>
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
                className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                End Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Ball Run-Out Confirmation Modal */}
      {showNoBallRunOutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">No Ball + {pendingNoBallRuns} runs</h3>
            <p className="text-slate-400 mb-2">
              Total: <span className="text-white font-bold">{1 + pendingNoBallRuns}</span> runs (1 penalty + {pendingNoBallRuns} scored)
            </p>
            <p className="text-slate-400 mb-6">
              Was there a <span className="text-red-400 font-semibold">run-out</span> on this ball?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleNoBallConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                No Run-Out
              </button>
              <button
                onClick={() => handleNoBallConfirm(true)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium"
              >
                Run-Out
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Ball counts only if there's a run-out
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
