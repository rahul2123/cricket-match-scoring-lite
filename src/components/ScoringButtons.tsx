import { useState } from 'react';

interface ScoringButtonsProps {
  canScore: boolean;
  canUndo: boolean;
  canEndInnings: boolean;
  currentInning: 1 | 2;
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
  currentInning,
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

  const buttonBase = "font-semibold rounded-lg transition-all duration-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed";
  const runButton = `${buttonBase} bg-slate-700 hover:bg-slate-600 text-white h-9 text-base`;
  const bigRunButton = `${buttonBase} text-white h-9 text-base font-bold`;
  const extraButton = `${buttonBase} h-8 text-xs`;
  const actionButton = `${buttonBase} h-8 text-xs font-medium`;

  const getExtraModeLabel = () => {
    switch (extraMode) {
      case 'bye': return 'Bye';
      case 'legbye': return 'Leg Bye';
      case 'noball': return 'No Ball';
      case 'wicket': return 'Wicket';
      default: return '';
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
    <div className="space-y-2 shrink-0">
      {/* Match Format - compact */}
      <div className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/60">
        <span className="text-slate-500 text-xs">Format</span>
        <button
          onClick={() => setShowOversSelector(true)}
          className="text-teal-400 hover:text-teal-300 text-xs font-medium"
        >
          {totalOvers} overs ▾
        </button>
      </div>

      {/* Extra Mode Indicator - compact */}
      {extraMode && (
        <div
          className="rounded-lg px-2 py-1.5 text-center flex items-center justify-center gap-2 flex-wrap"
          style={{ backgroundColor: modeStyles.bg, borderColor: modeStyles.border, borderWidth: 1 }}
        >
          <span className="text-[11px]" style={{ color: modeStyles.text }}>
            {extraMode === 'wicket' ? 'Tap 0 or runs' : extraMode === 'noball' ? 'Tap runs (1+scored)' : `Tap runs for ${getExtraModeLabel()}`}
          </span>
          <button onClick={() => setExtraMode(null)} className="text-[11px] underline hover:opacity-80" style={{ color: modeStyles.btn }}>Cancel</button>
        </div>
      )}

      {/* Run Buttons - Row 1 (0-3) */}
      <div className="grid grid-cols-4 gap-1.5">
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
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => handleRunClick(4)}
          disabled={!canScore}
          className={`${bigRunButton} bg-sky-600 hover:bg-sky-500 ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
        >
          4
        </button>
        <button
          onClick={() => handleRunClick(6)}
          disabled={!canScore}
          className={`${bigRunButton} bg-emerald-600 hover:bg-emerald-500 ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
        >
          6
        </button>
      </div>

      {/* Wicket + Wide + No Ball - one row */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={handleQuickWicket}
          disabled={!canScore}
          className={`${extraButton} bg-amber-600 hover:bg-amber-500 text-white font-bold col-span-2`}
        >
          Wicket
        </button>
        <button
          onClick={handleWicketClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'wicket' ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-amber-600/70 hover:bg-amber-500/70 text-amber-100'} col-span-2`}
        >
          W+Runs
        </button>
        <button
          onClick={() => canScore && onAddWide()}
          disabled={!canScore || extraMode !== null}
          className={`${extraButton} bg-yellow-600/80 hover:bg-yellow-500/80 text-yellow-100`}
        >
          Wide
        </button>
        <button
          onClick={handleNoBallClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'noball' ? 'bg-red-600 text-white ring-2 ring-red-400' : 'bg-red-600/80 hover:bg-red-500/80 text-red-100'}`}
        >
          No Ball
        </button>
      </div>

      {/* Bye / Leg Bye */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={handleByeClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'bye' ? 'bg-violet-600 text-white ring-2 ring-violet-400' : 'bg-violet-600/60 hover:bg-violet-500/60 text-violet-200'}`}
        >
          Bye
        </button>
        <button
          onClick={handleLegByeClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'legbye' ? 'bg-violet-600 text-white ring-2 ring-violet-400' : 'bg-violet-600/60 hover:bg-violet-500/60 text-violet-200'}`}
        >
          Leg Bye
        </button>
      </div>

      {/* Action row: Undo | End Innings | New Match */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-700/60">
        <button onClick={onUndo} disabled={!canUndo} className={`${actionButton} bg-slate-600 hover:bg-slate-500 text-slate-200`}>
          Undo
        </button>
        <button onClick={handleEndInningsClick} disabled={!canEndInnings} className={`${actionButton} bg-teal-600 hover:bg-teal-500 text-teal-100`}>
          End Innings
        </button>
        <button onClick={handleNewMatchClick} className={`${actionButton} bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600`}>
          New Match
        </button>
      </div>

      {/* Overs Selector Modal */}
      {showOversSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
          <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full shadow-xl border border-slate-700">
            <h3 className="text-base font-semibold text-white mb-3">Match Overs</h3>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {QUICK_OVER_OPTIONS.map((overs) => (
                <button
                  key={overs}
                  onClick={() => handleOversChange(overs)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedOvers === overs && customOvers === ''
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {overs}
                </button>
              ))}
            </div>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Custom</label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="1-100"
                value={customOvers}
                onChange={(e) => handleCustomOversChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-teal-500 focus:outline-none text-center text-sm"
              />
            </div>
            <div className="text-center text-xs text-slate-400 mb-3">Selected: <span className="font-semibold text-white">{selectedOvers}</span> overs</div>
            <div className="flex gap-2">
              <button onClick={() => setShowOversSelector(false)} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Cancel</button>
              <button onClick={confirmOversAndShowNewMatch} className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* New Match Confirmation Modal */}
      {showNewMatchConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
          <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full shadow-xl border border-slate-700">
            <h3 className="text-base font-semibold text-white mb-2">Start New Match?</h3>
            <p className="text-slate-400 text-xs mb-3">This will clear current match data.</p>
            <p className="text-slate-300 text-sm mb-4">Format: <span className="font-semibold text-teal-400">{selectedOvers} overs</span></p>
            <div className="flex gap-2">
              <button onClick={() => setShowNewMatchConfirm(false)} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Cancel</button>
              <button onClick={confirmNewMatch} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium">New Match</button>
            </div>
          </div>
        </div>
      )}

      {/* End Innings Confirmation Modal */}
      {showEndInningsConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
          <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full shadow-xl border border-slate-700">
            <h3 className="text-base font-semibold text-white mb-2">
              {currentInning === 1 ? 'End First Innings?' : 'End Second Innings?'}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              {currentInning === 1 ? 'Set target for 2nd innings. You can undo after.' : 'End match and declare result. You can undo after.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowEndInningsConfirm(false)} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">Cancel</button>
              <button onClick={confirmEndInnings} className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium">End Innings</button>
            </div>
          </div>
        </div>
      )}

      {/* No Ball Run-Out Confirmation Modal */}
      {showNoBallRunOutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
          <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full shadow-xl border border-slate-700">
            <h3 className="text-base font-semibold text-white mb-1">No Ball + {pendingNoBallRuns} runs</h3>
            <p className="text-slate-400 text-xs mb-2">Total: <span className="text-white font-semibold">{1 + pendingNoBallRuns}</span> runs</p>
            <p className="text-slate-400 text-xs mb-3">Run-out on this ball?</p>
            <div className="flex gap-2">
              <button onClick={() => handleNoBallConfirm(false)} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">No</button>
              <button onClick={() => handleNoBallConfirm(true)} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium">Run-Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
