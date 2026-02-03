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

  const buttonBase = "font-semibold rounded-lg transition-all duration-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed tabular-nums";
  const runButton = `${buttonBase} bg-cricket-secondary dark:bg-white/15 hover:opacity-90 text-white dark:text-cricket-dark-text h-9 text-base font-score`;
  const bigRunButton = `${buttonBase} text-white dark:text-cricket-dark-text h-9 text-base font-score-bold bg-cricket-secondary dark:bg-white/20`;
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

  /* Extras = Mustard #CA8A04; Wicket = Muted Red #B42318 */
  const getModeStyles = () => {
    switch (extraMode) {
      case 'noball':
        return { bg: 'rgba(202, 138, 4, 0.15)', border: 'rgba(202, 138, 4, 0.35)', text: '#92400e', btn: '#CA8A04' };
      case 'wicket':
        return { bg: 'rgba(180, 35, 24, 0.12)', border: 'rgba(180, 35, 24, 0.35)', text: '#B42318', btn: '#B42318' };
      default:
        return { bg: 'rgba(202, 138, 4, 0.15)', border: 'rgba(202, 138, 4, 0.35)', text: '#92400e', btn: '#CA8A04' };
    }
  };

  const getRingColor = () => {
    switch (extraMode) {
      case 'noball': return 'ring-cricket-extras';
      case 'wicket': return 'ring-cricket-wicket';
      default: return 'ring-cricket-extras';
    }
  };

  const modeStyles = getModeStyles();

  return (
    <div className="space-y-2 shrink-0">
      {/* Match Format - compact */}
      <div className="flex items-center justify-between bg-cricket-card dark:bg-white/5 rounded-lg px-3 py-1.5 border border-cricket-target/20 dark:border-white/10">
        <span className="text-cricket-target dark:text-cricket-dark-text/60 text-xs">Format</span>
        <button
          onClick={() => setShowOversSelector(true)}
          className="text-cricket-primary dark:text-cricket-dark-accent hover:opacity-80 text-xs font-medium"
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

      {/* Run Buttons - Row 2 (4 & 6) - same secondary, no neon */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => handleRunClick(4)}
          disabled={!canScore}
          className={`${bigRunButton} hover:opacity-90 ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
        >
          4
        </button>
        <button
          onClick={() => handleRunClick(6)}
          disabled={!canScore}
          className={`${bigRunButton} hover:opacity-90 ${extraMode ? `ring-2 ${getRingColor()}` : ''}`}
        >
          6
        </button>
      </div>

      {/* Wicket = Muted Red only; Wide/No Ball = Mustard (extras) */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={handleQuickWicket}
          disabled={!canScore}
          className={`${extraButton} bg-cricket-wicket hover:opacity-90 text-white font-bold col-span-2`}
        >
          Wicket
        </button>
        <button
          onClick={handleWicketClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'wicket' ? 'bg-cricket-wicket text-white ring-2 ring-cricket-wicket' : 'bg-cricket-wicket/80 hover:bg-cricket-wicket/90 text-white'} col-span-2`}
        >
          W+Runs
        </button>
        <button
          onClick={() => canScore && onAddWide()}
          disabled={!canScore || extraMode !== null}
          className={`${extraButton} bg-cricket-extras hover:opacity-90 text-white`}
        >
          Wide
        </button>
        <button
          onClick={handleNoBallClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'noball' ? 'bg-cricket-extras text-white ring-2 ring-cricket-extras' : 'bg-cricket-extras/80 hover:bg-cricket-extras text-white'}`}
        >
          No Ball
        </button>
      </div>

      {/* Bye / Leg Bye - Extras = Mustard */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={handleByeClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'bye' ? 'bg-cricket-extras text-white ring-2 ring-cricket-extras' : 'bg-cricket-extras/70 hover:bg-cricket-extras/90 text-white'}`}
        >
          Bye
        </button>
        <button
          onClick={handleLegByeClick}
          disabled={!canScore}
          className={`${extraButton} ${extraMode === 'legbye' ? 'bg-cricket-extras text-white ring-2 ring-cricket-extras' : 'bg-cricket-extras/70 hover:bg-cricket-extras/90 text-white'}`}
        >
          Leg Bye
        </button>
      </div>

      {/* Action row: Undo (neutral) | End Innings (primary green) | New Match (secondary) */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-cricket-target/20 dark:border-white/10">
        <button onClick={onUndo} disabled={!canUndo} className={`${actionButton} bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text hover:opacity-90`}>
          Undo
        </button>
        <button onClick={handleEndInningsClick} disabled={!canEndInnings} className={`${actionButton} bg-cricket-primary dark:bg-cricket-dark-accent text-white hover:opacity-90`}>
          End Innings
        </button>
        <button onClick={handleNewMatchClick} className={`${actionButton} bg-cricket-secondary dark:bg-white/10 text-white dark:text-cricket-dark-text border border-cricket-target/30 dark:border-white/20 hover:opacity-90`}>
          New Match
        </button>
      </div>

      {/* Overs Selector Modal - Card white / dark card */}
      {showOversSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-4 max-w-sm w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
            <h3 className="text-base font-semibold text-cricket-score dark:text-cricket-dark-text mb-3">Match Overs</h3>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {QUICK_OVER_OPTIONS.map((overs) => (
                <button
                  key={overs}
                  onClick={() => handleOversChange(overs)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all tabular-nums ${
                    selectedOvers === overs && customOvers === ''
                      ? 'bg-cricket-primary dark:bg-cricket-dark-accent text-white'
                      : 'bg-cricket-bg dark:bg-white/10 text-cricket-score dark:text-cricket-dark-text hover:opacity-80'
                  }`}
                >
                  {overs}
                </button>
              ))}
            </div>
            <div className="mb-3">
              <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">Custom</label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="1-100"
                value={customOvers}
                onChange={(e) => handleCustomOversChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cricket-bg dark:bg-white/10 text-cricket-score dark:text-cricket-dark-text border border-cricket-target/30 dark:border-white/20 focus:border-cricket-primary dark:focus:border-cricket-dark-accent focus:outline-none text-center text-sm"
              />
            </div>
            <div className="text-center text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-3">Selected: <span className="font-semibold text-cricket-score dark:text-cricket-dark-text tabular-nums">{selectedOvers}</span> overs</div>
            <div className="flex gap-2">
              <button onClick={() => setShowOversSelector(false)} className="flex-1 py-2 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90">Cancel</button>
              <button onClick={confirmOversAndShowNewMatch} className="flex-1 py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* New Match Confirmation - Success green for submit */}
      {showNewMatchConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-4 max-w-sm w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
            <h3 className="text-base font-semibold text-cricket-score dark:text-cricket-dark-text mb-2">Start New Match?</h3>
            <p className="text-cricket-target dark:text-cricket-dark-text/70 text-xs mb-3">This will clear current match data.</p>
            <p className="text-cricket-score dark:text-cricket-dark-text text-sm mb-4">Format: <span className="font-semibold text-cricket-primary dark:text-cricket-dark-accent tabular-nums">{selectedOvers} overs</span></p>
            <div className="flex gap-2">
              <button onClick={() => setShowNewMatchConfirm(false)} className="flex-1 py-2 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90">Cancel</button>
              <button onClick={confirmNewMatch} className="flex-1 py-2 rounded-lg bg-cricket-success dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90">New Match</button>
            </div>
          </div>
        </div>
      )}

      {/* End Innings Confirmation - Primary green */}
      {showEndInningsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-4 max-w-sm w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
            <h3 className="text-base font-semibold text-cricket-score dark:text-cricket-dark-text mb-2">
              {currentInning === 1 ? 'End First Innings?' : 'End Second Innings?'}
            </h3>
            <p className="text-cricket-target dark:text-cricket-dark-text/70 text-xs mb-4">
              {currentInning === 1 ? 'Set target for 2nd innings. You can undo after.' : 'End match and declare result. You can undo after.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowEndInningsConfirm(false)} className="flex-1 py-2 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90">Cancel</button>
              <button onClick={confirmEndInnings} className="flex-1 py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90">End Innings</button>
            </div>
          </div>
        </div>
      )}

      {/* No Ball Run-Out - Wicket = Muted Red for Run-Out */}
      {showNoBallRunOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-4 max-w-sm w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
            <h3 className="text-base font-semibold text-cricket-score dark:text-cricket-dark-text mb-1">No Ball + {pendingNoBallRuns} runs</h3>
            <p className="text-cricket-target dark:text-cricket-dark-text/70 text-xs mb-2">Total: <span className="font-semibold text-cricket-score dark:text-cricket-dark-text tabular-nums">{1 + pendingNoBallRuns}</span> runs</p>
            <p className="text-cricket-target dark:text-cricket-dark-text/70 text-xs mb-3">Run-out on this ball?</p>
            <div className="flex gap-2">
              <button onClick={() => handleNoBallConfirm(false)} className="flex-1 py-2 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90">No</button>
              <button onClick={() => handleNoBallConfirm(true)} className="flex-1 py-2 rounded-lg bg-cricket-wicket text-white text-sm font-medium hover:opacity-90">Run-Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
