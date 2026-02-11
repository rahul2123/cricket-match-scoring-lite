import { useEffect, useState } from 'react';
import { useMatch } from './hooks/useMatch';
import { ScoreBoard } from './components/ScoreBoard';
import { ScoringButtons } from './components/ScoringButtons';
import { BallHistory } from './components/BallHistory';
import { ShareMatchDialog } from './components/ShareMatchDialog';
import { JoinMatchDialog } from './components/JoinMatchDialog';
import { createSharedSession, saveMatchToSession, getLatestMatchFromSession, subscribeToSession, deleteSharedSession } from './utils/shareMatch';
import { getUserId } from './utils/supabase';

function App() {
  const {
    state,
    currentInning,
    canEndInnings,
    canUndo,
    canScore,
    isFirstInningsComplete,
    isSecondInningsComplete,
    runsRequired,
    ballsRemaining,
    addRun,
    addWicket,
    addWide,
    addWideWicket,
    addNoBall,
    // addBye,
    // addLegBye,
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
    setState,
  } = useMatch();

  const [shareMode, setShareMode] = useState<'local' | 'sharing' | 'viewing'>('local');
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [currentMatchNumber, setCurrentMatchNumber] = useState<number>(1);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Check URL for session code on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('session');
    if (code) {
      setShowJoinDialog(true);
      // Auto-fill the code if it's valid
      if (code.length === 6) {
        handleJoinSession(code);
      }
    }
  }, []);

  // Sync state to Supabase when sharing
  useEffect(() => {
    if (shareMode === 'sharing' && sessionCode) {
      saveMatchToSession(sessionCode, state, currentMatchNumber);
    }
  }, [state, shareMode, sessionCode, currentMatchNumber]);

  // Subscribe to real-time updates when viewing
  useEffect(() => {
    if (shareMode === 'viewing' && sessionCode) {
      const unsubscribe = subscribeToSession(sessionCode, (newState, matchNumber) => {
        setState(newState);
        setCurrentMatchNumber(matchNumber);
      });
      return unsubscribe;
    }
  }, [shareMode, sessionCode, setState]);

  const handleShareMatch = async () => {
    if (shareMode === 'sharing') {
      // Already sharing, just show the dialog
      setShowShareDialog(true);
      return;
    }

    // Prevent multiple clicks
    if (isSharing) return;

    setIsSharing(true);
    try {
      // Initialize user auth
      await getUserId();

      // Create shared session
      const code = await createSharedSession();
      if (code) {
        // Save the current match as match #1
        const matchNum = await saveMatchToSession(code, state, 1);
        if (matchNum) {
          setSessionCode(code);
          setCurrentMatchNumber(matchNum);
          setShareMode('sharing');
          setShowShareDialog(true);
        } else {
          alert('Failed to save match. Please try again.');
        }
      } else {
        alert('Failed to share session. Please check your Supabase configuration.');
      }
    } catch (error) {
      console.error('Error sharing session:', error);
      alert('Failed to share session. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleStopSharing = async () => {
    if (sessionCode) {
      await deleteSharedSession(sessionCode);
      setSessionCode(null);
      setShareMode('local');
      setShowShareDialog(false);
    }
  };

  const handleJoinSession = async (code: string) => {
    setIsJoining(true);
    setJoinError(null);

    try {
      // First, clear any existing state to prevent stale data
      setSessionCode(null);
      setCurrentMatchNumber(1);
      setShareMode('local');

      const matchData = await getLatestMatchFromSession(code);
      if (matchData) {
        setState(matchData.matchState);
        setSessionCode(code);
        setCurrentMatchNumber(matchData.matchNumber);
        setShareMode('viewing');
        setShowJoinDialog(false);
        setJoinError(null);
      } else {
        setJoinError('Session not found. Please check the code and try again.');
      }
    } catch (error) {
      setJoinError('Failed to join session. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleNewMatch = (totalOvers?: number) => {
    // Exit viewing mode
    if (shareMode === 'viewing') {
      setShareMode('local');
      setSessionCode(null);
      setCurrentMatchNumber(1);
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    } else if (shareMode === 'sharing') {
      // When sharing, increment match number for the new match
      setCurrentMatchNumber(prev => prev + 1);
    }
    newMatch(totalOvers);
  };

  return (
    <div className="min-h-screen h-screen max-h-[100dvh] flex flex-col bg-cricket-bg dark:bg-cricket-dark-bg overflow-hidden">
      {/* Header - Deep Green / Dark Navy */}
      <header className="shrink-0 bg-cricket-primary dark:bg-cricket-secondary border-b border-cricket-primary/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-3 py-2">
          <h1 className="text-base font-semibold text-center text-white tracking-tight">
            Cricket Scorer
          </h1>
        </div>
      </header>

      {/* Main Content - scrollable */}
      <main className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-3 py-2 space-y-2">
        {shareMode === 'viewing' ? (
          // Viewing mode: Show only ScoreBoard and BallHistory
          <>
            <ScoreBoard
              state={state}
              currentInning={currentInning}
              runsRequired={runsRequired}
              ballsRemaining={ballsRemaining}
              isFirstInningsComplete={isFirstInningsComplete}
              isSecondInningsComplete={isSecondInningsComplete}
              onEndInnings={endInnings}
            />
            <BallHistory
              balls={state.ballHistory}
              currentInning={state.currentInning}
            />
            {/* Exit viewing mode button */}
            <div className="pt-2">
              <button
                onClick={() => handleNewMatch()}
                className="w-full py-2.5 rounded-lg bg-cricket-secondary dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
              >
                Exit Viewing Mode
              </button>
            </div>
          </>
        ) : (
          // Scorer mode: Show ScoreBoard, ScoringButtons, and BallHistory
          <>
            <ScoreBoard
              state={state}
              currentInning={currentInning}
              runsRequired={runsRequired}
              ballsRemaining={ballsRemaining}
              isFirstInningsComplete={isFirstInningsComplete}
              isSecondInningsComplete={isSecondInningsComplete}
              onEndInnings={endInnings}
            />
            <ScoringButtons
              canScore={canScore}
              canUndo={canUndo}
              canEndInnings={canEndInnings}
              currentInning={state.currentInning}
              totalOvers={state.totalOvers}
              isSharing={shareMode === 'sharing'}
              isViewing={false}
              isSharingLoading={isSharing}
              onAddRun={addRun}
              onAddWicket={addWicket}
              onAddWide={addWide}
              onAddWideWicket={addWideWicket}
              onAddNoBall={addNoBall}
              onUndo={undo}
              onEndInnings={endInnings}
              onNewMatch={handleNewMatch}
              onSetTotalOvers={setTotalOvers}
              onShareMatch={handleShareMatch}
            />
            <BallHistory
              balls={state.ballHistory}
              currentInning={state.currentInning}
            />
          </>
        )}
      </main>

      {/* Footer - minimal */}
      <footer className="shrink-0 border-t border-cricket-target/30 dark:border-white/10 py-1">
        <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 text-center">
          {shareMode === 'viewing' ? `Viewing: ${sessionCode}` : shareMode === 'sharing' ? `Sharing: ${sessionCode}` : 'Offline • Saved locally'}
        </p>
      </footer>

      {/* Share Match Dialog */}
      <ShareMatchDialog
        isOpen={showShareDialog}
        matchCode={sessionCode}
        isSharing={shareMode === 'sharing'}
        onClose={() => setShowShareDialog(false)}
        onShare={handleShareMatch}
        onStopSharing={handleStopSharing}
      />

      {/* Join Match Dialog */}
      <JoinMatchDialog
        isOpen={showJoinDialog}
        onClose={() => {
          setShowJoinDialog(false);
          setJoinError(null);
          // Clear URL parameter
          window.history.replaceState({}, '', window.location.pathname);
        }}
        onJoin={handleJoinSession}
        isLoading={isJoining}
        error={joinError}
      />
    </div>
  );
}

export default App;
