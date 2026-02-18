import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useMatch } from './hooks/useMatch';
import { useTournament } from './hooks/useTournament';
import { ScoreBoard } from './components/ScoreBoard';
import { ScoringButtons } from './components/ScoringButtons';
import { BallHistory } from './components/BallHistory';
import { ShareMatchDialog } from './components/ShareMatchDialog';
import { JoinMatchDialog } from './components/JoinMatchDialog';
import { TournamentList } from './components/tournament/TournamentList';
import { TournamentDashboard } from './components/tournament/TournamentDashboard';
import { createSharedSession, saveMatchToSession, getLatestMatchFromSession, subscribeToSession, deleteSharedSession } from './utils/shareMatch';
import { getUserId } from './utils/supabase';
import { storage } from './utils/storage';

// =============================================================================
// MAIN SCORING VIEW (Default route: /)
// =============================================================================
function ScoringView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
    setState,
  } = useMatch();

  // Session sharing state
  const savedSession = useRef(() => {
    try {
      const raw = localStorage.getItem('cricket-sharing-session');
      if (raw) {
        const parsed = JSON.parse(raw) as { mode: 'sharing'; code: string; matchNumber: number; lastActive: number };
        const twoHoursMs = 2 * 60 * 60 * 1000;
        if (Date.now() - parsed.lastActive < twoHoursMs) {
          return parsed;
        }
        localStorage.removeItem('cricket-sharing-session');
      }
    } catch { }
    return null;
  });
  const initialSession = savedSession.current();

  const [shareMode, setShareMode] = useState<'local' | 'sharing' | 'viewing'>(initialSession?.mode ?? 'local');
  const [sessionCode, setSessionCode] = useState<string | null>(initialSession?.code ?? null);
  const [currentMatchNumber, setCurrentMatchNumber] = useState<number>(initialSession?.matchNumber ?? 1);
  const currentMatchNumberRef = useRef<number>(initialSession?.matchNumber ?? 1);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    currentMatchNumberRef.current = currentMatchNumber;
  }, [currentMatchNumber]);

  // Persist sharing session to localStorage
  useEffect(() => {
    if (shareMode === 'sharing' && sessionCode) {
      localStorage.setItem('cricket-sharing-session', JSON.stringify({
        mode: 'sharing',
        code: sessionCode,
        matchNumber: currentMatchNumber,
        lastActive: Date.now(),
      }));
    } else {
      localStorage.removeItem('cricket-sharing-session');
    }
  }, [shareMode, sessionCode, currentMatchNumber]);

  // Check URL for session code on load
  useEffect(() => {
    const sessionCodeParam = searchParams.get('session');
    if (sessionCodeParam && sessionCodeParam.length === 6) {
      handleJoinSession(sessionCodeParam);
    }
  }, []);

  // Disable localStorage when in viewing mode
  useEffect(() => {
    if (shareMode === 'viewing') {
      storage.disabled = true;
      storage.clear();
    } else {
      storage.disabled = false;
    }
  }, [shareMode]);

  // Sync state to Supabase when sharing
  useEffect(() => {
    if (shareMode === 'sharing' && sessionCode) {
      saveMatchToSession(sessionCode, state, currentMatchNumber).catch(console.error);
    }
  }, [state, shareMode, sessionCode, currentMatchNumber]);

  // Subscribe to real-time updates when viewing
  useEffect(() => {
    if (shareMode === 'viewing' && sessionCode) {
      const unsubscribe = subscribeToSession(sessionCode, (newState, matchNumber) => {
        currentMatchNumberRef.current = matchNumber;
        setCurrentMatchNumber(matchNumber);
        setState(newState);
      });
      return () => unsubscribe();
    }
  }, [shareMode, sessionCode, setState]);

  const handleShareMatch = async () => {
    if (shareMode === 'sharing') {
      setShowShareDialog(true);
      return;
    }
    if (isSharing) return;

    setIsSharing(true);
    try {
      await getUserId();
      const code = await createSharedSession();
      if (code) {
        const matchNum = await saveMatchToSession(code, state, 1);
        if (matchNum) {
          setSessionCode(code);
          setCurrentMatchNumber(matchNum);
          setShareMode('sharing');
          setShowShareDialog(true);
        }
      }
    } catch (error) {
      console.error('Error sharing session:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleStopSharing = async () => {
    if (sessionCode) {
      await deleteSharedSession(sessionCode);
      localStorage.removeItem('cricket-sharing-session');
      setSessionCode(null);
      setShareMode('local');
      setShowShareDialog(false);
    }
  };

  const handleJoinSession = async (code: string) => {
    setIsJoining(true);
    setJoinError(null);

    try {
      localStorage.clear();
      storage.disabled = true;
      setSessionCode(null);
      setCurrentMatchNumber(1);
      currentMatchNumberRef.current = 1;
      setShareMode('local');

      const matchData = await getLatestMatchFromSession(code);
      if (matchData) {
        setState(matchData.matchState);
        setSessionCode(code);
        setCurrentMatchNumber(matchData.matchNumber);
        currentMatchNumberRef.current = matchData.matchNumber;
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
    if (shareMode === 'viewing') {
      setShareMode('local');
      setSessionCode(null);
      setCurrentMatchNumber(1);
      setSearchParams({});
    } else if (shareMode === 'sharing') {
      setCurrentMatchNumber(prev => prev + 1);
    }
    newMatch(totalOvers);
  };

  return (
    <div className="min-h-screen h-screen max-h-[100dvh] flex flex-col bg-cricket-bg dark:bg-cricket-dark-bg overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-cricket-primary dark:bg-cricket-secondary border-b border-cricket-primary/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
          <div className="w-10"></div>
          <h1 className="text-base font-semibold text-center text-white tracking-tight">
            Cricket Scorer
          </h1>
          <button
            onClick={() => navigate('/tournaments')}
            className="w-10 h-8 flex items-center justify-center text-white/80 hover:text-white text-lg"
            title="Tournaments"
          >
            🏆
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-3 py-2 space-y-2">
        {shareMode === 'viewing' ? (
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
            <BallHistory balls={state.ballHistory} currentInning={state.currentInning} />
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
            <BallHistory balls={state.ballHistory} currentInning={state.currentInning} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-cricket-target/30 dark:border-white/10 py-1">
        <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 text-center">
          {shareMode === 'viewing' ? `Viewing: ${sessionCode}` : shareMode === 'sharing' ? `Sharing: ${sessionCode}` : 'Offline • Saved locally'}
        </p>
      </footer>

      {/* Dialogs */}
      <ShareMatchDialog
        isOpen={showShareDialog}
        matchCode={sessionCode}
        isSharing={shareMode === 'sharing'}
        onClose={() => setShowShareDialog(false)}
        onShare={handleShareMatch}
        onStopSharing={handleStopSharing}
      />

      <JoinMatchDialog
        isOpen={showJoinDialog}
        onClose={() => {
          setShowJoinDialog(false);
          setJoinError(null);
          setSearchParams({});
        }}
        onJoin={handleJoinSession}
        isLoading={isJoining}
        error={joinError}
      />
    </div>
  );
}

// =============================================================================
// TOURNAMENT LIST VIEW (/tournaments)
// =============================================================================
function TournamentListView() {
  const navigate = useNavigate();

  return (
    <TournamentList
      onSelectTournament={(code) => navigate(`/tournaments/${code}`)}
      onJoinByCode={() => {/* TODO: Show join dialog */}}
    />
  );
}

// =============================================================================
// TOURNAMENT DASHBOARD VIEW (/tournaments/:code)
// =============================================================================
function TournamentDashboardView() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  if (!code) {
    return <div>Invalid tournament</div>;
  }

  return (
    <TournamentDashboard
      tournamentCode={code}
      onBack={() => navigate('/tournaments')}
      onStartMatch={(matchId) => navigate(`/tournaments/${code}/match/${matchId}`)}
    />
  );
}

// =============================================================================
// TOURNAMENT MATCH SCORING VIEW (/tournaments/:code/match/:matchId)
// =============================================================================
function TournamentMatchView() {
  const navigate = useNavigate();
  const { code, matchId } = useParams<{ code: string; matchId: string }>();
  const tournament = useTournament(code);

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
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
  } = useMatch();

  if (!code || !matchId) {
    return <div>Invalid match</div>;
  }

  const matchIdNum = parseInt(matchId, 10);
  const activeMatch = tournament.getMatchById(matchIdNum);
  const teamA = activeMatch ? tournament.getTeamById(activeMatch.teamAId) : null;
  const teamB = activeMatch ? tournament.getTeamById(activeMatch.teamBId) : null;

  const handleBack = () => {
    newMatch();
    navigate(`/tournaments/${code}`);
  };

  return (
    <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg">
      {/* Header */}
      <header className="bg-cricket-primary dark:bg-cricket-secondary border-b border-cricket-primary/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center">
          <button
            onClick={handleBack}
            className="text-white/80 hover:text-white text-sm"
          >
            ← Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-sm font-semibold text-white">
              {teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}
            </h1>
            <p className="text-[10px] text-white/60">{tournament.tournament?.name}</p>
          </div>
          <div className="w-12"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-3 py-2 space-y-2">
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
          isSharing={false}
          isViewing={false}
          isSharingLoading={false}
          onAddRun={addRun}
          onAddWicket={addWicket}
          onAddWide={addWide}
          onAddWideWicket={addWideWicket}
          onAddNoBall={addNoBall}
          onUndo={undo}
          onEndInnings={endInnings}
          onNewMatch={newMatch}
          onSetTotalOvers={setTotalOvers}
          onShareMatch={() => {}}
        />
        <BallHistory balls={state.ballHistory} currentInning={state.currentInning} />
      </main>
    </div>
  );
}

// =============================================================================
// APP WITH ROUTER
// =============================================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScoringView />} />
        <Route path="/tournaments" element={<TournamentListView />} />
        <Route path="/tournaments/:code" element={<TournamentDashboardView />} />
        <Route path="/tournaments/:code/match/:matchId" element={<TournamentMatchView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
