import { useEffect, useState } from 'react';
import { useMatch } from './hooks/useMatch';
import { ScoreBoard } from './components/ScoreBoard';
import { ScoringButtons } from './components/ScoringButtons';
import { BallHistory } from './components/BallHistory';
import { ShareMatchDialog } from './components/ShareMatchDialog';
import { JoinMatchDialog } from './components/JoinMatchDialog';
import { createSharedMatch, updateSharedMatch, getMatchByCode, subscribeToMatch, deleteSharedMatch } from './utils/shareMatch';
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
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Check URL for match code on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('match');
    if (code) {
      setShowJoinDialog(true);
      // Auto-fill the code if it's valid
      if (code.length === 6) {
        handleJoinMatch(code);
      }
    }
  }, []);

  // Sync state to Supabase when sharing
  useEffect(() => {
    if (shareMode === 'sharing' && matchCode) {
      updateSharedMatch(matchCode, state);
    }
  }, [state, shareMode, matchCode]);

  // Subscribe to real-time updates when viewing
  useEffect(() => {
    if (shareMode === 'viewing' && matchCode) {
      const unsubscribe = subscribeToMatch(matchCode, (newState) => {
        setState(newState);
      });
      return unsubscribe;
    }
  }, [shareMode, matchCode, setState]);

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

      // Create shared match
      const code = await createSharedMatch(state);
      if (code) {
        setMatchCode(code);
        setShareMode('sharing');
        setShowShareDialog(true);
      } else {
        alert('Failed to share match. Please check your Supabase configuration.');
      }
    } catch (error) {
      console.error('Error sharing match:', error);
      alert('Failed to share match. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleStopSharing = async () => {
    if (matchCode) {
      await deleteSharedMatch(matchCode);
      setMatchCode(null);
      setShareMode('local');
      setShowShareDialog(false);
    }
  };

  const handleJoinMatch = async (code: string) => {
    setIsJoining(true);
    setJoinError(null);

    try {
      const matchState = await getMatchByCode(code);
      if (matchState) {
        setState(matchState);
        setMatchCode(code);
        setShareMode('viewing');
        setShowJoinDialog(false);
        setJoinError(null);
      } else {
        setJoinError('Match not found. Please check the code and try again.');
      }
    } catch (error) {
      setJoinError('Failed to join match. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleNewMatch = (totalOvers?: number) => {
    // Exit viewing mode and stop sharing
    if (shareMode === 'viewing') {
      setShareMode('local');
      setMatchCode(null);
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    } else if (shareMode === 'sharing' && matchCode) {
      deleteSharedMatch(matchCode);
      setShareMode('local');
      setMatchCode(null);
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
          isViewing={shareMode === 'viewing'}
          isSharingLoading={isSharing}
          onAddRun={addRun}
          onAddWicket={addWicket}
          onAddWide={addWide}
          onAddWideWicket={addWideWicket}
          onAddNoBall={addNoBall}
          // onAddBye={addBye}
          // onAddLegBye={addLegBye}
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
      </main>

      {/* Footer - minimal */}
      <footer className="shrink-0 border-t border-cricket-target/30 dark:border-white/10 py-1">
        <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 text-center">
          {shareMode === 'viewing' ? `Viewing: ${matchCode}` : shareMode === 'sharing' ? `Sharing: ${matchCode}` : 'Offline • Saved locally'}
        </p>
      </footer>

      {/* Share Match Dialog */}
      <ShareMatchDialog
        isOpen={showShareDialog}
        matchCode={matchCode}
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
        onJoin={handleJoinMatch}
        isLoading={isJoining}
        error={joinError}
      />
    </div>
  );
}

export default App;
