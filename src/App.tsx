import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useMatch } from './hooks/useMatch';
import { useTournament } from './hooks/useTournament';
import { ScoreBoard } from './components/ScoreBoard';
import { ScoringButtons } from './components/ScoringButtons';
import { BallHistory } from './components/BallHistory';
import { ShareMatchDialog } from './components/ShareMatchDialog';
import { JoinMatchDialog } from './components/JoinMatchDialog';
import { TournamentList } from './components/tournament/TournamentList';
import { TournamentDashboard } from './components/tournament/TournamentDashboard';
import { TossDialog } from './components/tournament/TossDialog';
import { MatchPlayerManager } from './components/scoring/MatchPlayerManager';
import { CurrentPlayers } from './components/scoring/CurrentPlayers';
import { BattingScorecard } from './components/scoring/BattingScorecard';
import { BowlingFigures } from './components/scoring/BowlingFigures';
import { createSharedSession, saveMatchToSession, getLatestMatchFromSession, subscribeToSession, deleteSharedSession } from './utils/shareMatch';
import { getUserId } from './utils/supabase';
import { storage } from './utils/storage';
import * as tournamentApi from './utils/tournamentApi';
import * as playerApi from './utils/playerApi';
import { calculateLiveNRR, formatLiveNRR } from './utils/liveNrr';
import type { TeamPlayer } from './types/tournament';

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
      onViewMatch={(matchId) => navigate(`/tournaments/${code}/match/${matchId}`)}
    />
  );
}

// =============================================================================
// TOURNAMENT MATCH SCORING VIEW (/tournaments/:code/match/:matchId)
// =============================================================================
type MatchViewMode = 'loading' | 'toss' | 'scoring' | 'completed';

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
    setState,
    setTeamPlayers,
    setOpeningBatsmen,
    setBowler,
    nextBatsman,
  } = useMatch();

  const [viewMode, setViewMode] = useState<MatchViewMode>('loading');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const matchCompletedRef = useRef(false);

  // Team players state
  const [teamAPlayers, setTeamAPlayers] = useState<TeamPlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<TeamPlayer[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [playersInitialized, setPlayersInitialized] = useState(false);

  const matchIdNum = matchId ? parseInt(matchId, 10) : null;
  const activeMatch = matchIdNum ? tournament.getMatchById(matchIdNum) : null;
  const teamA = activeMatch ? tournament.getTeamById(activeMatch.teamAId) : null;
  const teamB = activeMatch ? tournament.getTeamById(activeMatch.teamBId) : null;

  // Initialize state on mount based on match status
  useEffect(() => {
    if (!activeMatch || tournament.isLoading) return;

    if (activeMatch.status === 'scheduled') {
      // For scheduled matches, start fresh - clear any old localStorage state
      newMatch(activeMatch.overs);
      setViewMode('toss');
    } else if (activeMatch.status === 'live') {
      // Load existing state if available
      if (activeMatch.matchState) {
        setTotalOvers(activeMatch.overs);
        setState(activeMatch.matchState);
        setViewMode('scoring');
      } else {
        // No state saved - show toss (start fresh)
        newMatch(activeMatch.overs);
        setViewMode('toss');
      }
    } else if (activeMatch.status === 'completed') {
      // View completed match (read-only)
      if (activeMatch.matchState) {
        setTotalOvers(activeMatch.overs);
        setState(activeMatch.matchState);
      }
      setViewMode('completed');
    }
  }, [matchIdNum, activeMatch, tournament.isLoading, setTotalOvers, setState, newMatch]);

  // Load team players
  useEffect(() => {
    if (!teamA || !teamB) return;

    const loadPlayers = async () => {
      setIsLoadingPlayers(true);
      try {
        const [playersA, playersB] = await Promise.all([
          playerApi.getTeamPlayers(teamA.id),
          playerApi.getTeamPlayers(teamB.id),
        ]);
        setTeamAPlayers(playersA);
        setTeamBPlayers(playersB);
      } catch (error) {
        console.error('Error loading team players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, [teamA, teamB]);

  // Initialize team players in match state after players are loaded
  useEffect(() => {
    if (isLoadingPlayers || playersInitialized) return;
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) return;
    if (!activeMatch || viewMode === 'loading') return;

    // Only initialize if not already done
    if (state.teamABatsmen.length > 0) return;

    const teamABatsmen = teamAPlayers.map(p => p.profileId);
    const teamBBatsmen = teamBPlayers.map(p => p.profileId);
    const teamABowlers = teamAPlayers.filter(p => p.role === 'bowler' || p.role === 'all-rounder').map(p => p.profileId);
    const teamBBowlers = teamBPlayers.filter(p => p.role === 'bowler' || p.role === 'all-rounder').map(p => p.profileId);

    // Set batting team based on toss result
    const battingTeam = activeMatch.battingFirstTeamId === teamA?.id ? 'A' : 'B';

    setTeamPlayers(
      teamABatsmen,
      teamBBatsmen,
      teamABowlers.length > 0 ? teamABowlers : teamABatsmen,
      teamBBowlers.length > 0 ? teamBBowlers : teamBBatsmen,
      battingTeam
    );
    setPlayersInitialized(true);
  }, [isLoadingPlayers, teamAPlayers, teamBPlayers, playersInitialized, activeMatch, viewMode, state.teamABatsmen.length, teamA, setTeamPlayers]);

  // Debounced state persistence
  useEffect(() => {
    if (viewMode !== 'scoring' || !activeMatch) return;

    const timeoutId = setTimeout(() => {
      tournament.updateMatch(activeMatch.id, { matchState: state });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [state, viewMode, activeMatch, tournament]);

  // Handle toss confirmation
  const handleTossConfirm = useCallback(async (battingFirstTeamId: number) => {
    if (!activeMatch || !teamA || !teamB) return;

    // Update match with batting first team and set status to live
    await tournament.updateMatch(activeMatch.id, {
      status: 'live',
      battingFirstTeamId,
      matchState: state,
    });

    // Update tournament status if first match
    if (tournament.tournament?.status === 'upcoming') {
      await tournamentApi.updateTournamentStatus(tournament.tournament.id, 'ongoing');
    }

    setViewMode('scoring');
  }, [activeMatch, teamA, teamB, tournament, state]);

  // Handle toss cancel
  const handleTossCancel = useCallback(() => {
    navigate(`/tournaments/${code}`);
  }, [navigate, code]);

  // Detect match completion
  useEffect(() => {
    if (viewMode !== 'scoring' || !state.isMatchOver || !activeMatch?.battingFirstTeamId) return;

    // Prevent multiple completion calls
    if (matchCompletedRef.current) return;
    matchCompletedRef.current = true;

    const completeMatchFn = async () => {
      try {
        const success = await tournamentApi.completeTournamentMatch(
          activeMatch.id,
          state,
          activeMatch.teamAId,
          activeMatch.teamBId,
          activeMatch.battingFirstTeamId!,
          activeMatch.overs
        );

        if (success) {
          // Refresh tournament data to update standings
          await tournament.refreshData();
          setShowCompleteDialog(true);
        }
      } catch (error) {
        console.error('Failed to complete match:', error);
        matchCompletedRef.current = false;
      }
    };

    completeMatchFn();
  }, [state.isMatchOver, viewMode, activeMatch, state, tournament]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    // Don't call newMatch() - preserve state
    navigate(`/tournaments/${code}`);
  }, [navigate, code]);

  // Determine winner info for completion dialog
  const getWinnerInfo = () => {
    if (!activeMatch || !state.isMatchOver || !activeMatch.battingFirstTeamId) return null;

    const battingFirstTeam = activeMatch.battingFirstTeamId;
    const bowlingFirstTeam = battingFirstTeam === activeMatch.teamAId
      ? activeMatch.teamBId
      : activeMatch.teamAId;

    let winnerTeamId: number | null = null;
    if (state.winner === 'batting') {
      winnerTeamId = bowlingFirstTeam;
    } else if (state.winner === 'bowling') {
      winnerTeamId = battingFirstTeam;
    }

    const winnerTeam = winnerTeamId ? tournament.getTeamById(winnerTeamId) : null;

    // Calculate win margin
    let margin = '';
    if (state.winner === 'batting') {
      // Won by wickets
      const wicketsRemaining = 10 - state.innings.second.wickets;
      margin = `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    } else if (state.winner === 'bowling') {
      // Won by runs
      const runsMargin = state.innings.first.runs - state.innings.second.runs;
      margin = `${runsMargin} run${runsMargin !== 1 ? 's' : ''}`;
    }

    return { winnerTeam, margin };
  };

  // Calculate live NRR for both teams
  const getLiveNRRInfo = () => {
    if (!activeMatch?.battingFirstTeamId || viewMode !== 'scoring' || state.isMatchOver) {
      return null;
    }

    const battingFirstTeam = activeMatch.battingFirstTeamId;
    const bowlingFirstTeam = activeMatch.battingFirstTeamId === teamA?.id ? teamB?.id : teamA?.id;

    if (!bowlingFirstTeam) return null;

    // Get existing standings
    const battingFirstStanding = tournament.standings.find(s => s.teamId === battingFirstTeam);
    const bowlingFirstStanding = tournament.standings.find(s => s.teamId === bowlingFirstTeam);

    // Calculate current match stats based on innings
    const isFirstInnings = state.currentInning === 1;
    const firstInnings = state.innings.first;
    const secondInnings = state.innings.second;

    // For batting first team: they have scored runs in 1st innings
    // For bowling first team: they have conceded runs in 1st innings
    let battingFirstNRR: number | null = null;
    let bowlingFirstNRR: number | null = null;

    if (isFirstInnings) {
      // Only first innings data available
      const battingFirstMatchStats = {
        runsScored: firstInnings.runs,
        ballsFaced: firstInnings.balls,
        runsConceded: 0,
        ballsBowled: 0,
      };
      battingFirstNRR = calculateLiveNRR(battingFirstStanding, battingFirstMatchStats);

      // Bowling first team has only conceded so far
      const bowlingFirstMatchStats = {
        runsScored: 0,
        ballsFaced: 0,
        runsConceded: firstInnings.runs,
        ballsBowled: firstInnings.balls,
      };
      bowlingFirstNRR = calculateLiveNRR(bowlingFirstStanding, bowlingFirstMatchStats);
    } else {
      // Second innings - both teams have stats
      const battingFirstMatchStats = {
        runsScored: firstInnings.runs,
        ballsFaced: firstInnings.balls,
        runsConceded: secondInnings.runs,
        ballsBowled: secondInnings.balls,
      };
      battingFirstNRR = calculateLiveNRR(battingFirstStanding, battingFirstMatchStats);

      const bowlingFirstMatchStats = {
        runsScored: secondInnings.runs,
        ballsFaced: secondInnings.balls,
        runsConceded: firstInnings.runs,
        ballsBowled: firstInnings.balls,
      };
      bowlingFirstNRR = calculateLiveNRR(bowlingFirstStanding, bowlingFirstMatchStats);
    }

    return {
      battingFirstTeamId: battingFirstTeam,
      bowlingFirstTeamId: bowlingFirstTeam,
      battingFirstNRR,
      bowlingFirstNRR,
    };
  };

  if (!code || !matchId) {
    return <div>Invalid match</div>;
  }

  if (tournament.isLoading || viewMode === 'loading') {
    return (
      <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cricket-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!activeMatch || !teamA || !teamB) {
    return (
      <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-cricket-wicket mb-4">Match not found</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-cricket-primary text-white rounded-lg"
          >
            Back to Tournament
          </button>
        </div>
      </div>
    );
  }

  const winnerInfo = getWinnerInfo();
  const liveNRRInfo = getLiveNRRInfo();

  return (
    <div className="min-h-screen h-screen max-h-[100dvh] flex flex-col bg-cricket-bg dark:bg-cricket-dark-bg overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-cricket-primary dark:bg-cricket-secondary border-b border-cricket-primary/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center">
          <button
            onClick={handleBack}
            className="text-white/80 hover:text-white text-sm"
          >
            ← Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-sm font-semibold text-white">
              {teamA.name} vs {teamB.name}
            </h1>
            <p className="text-[10px] text-white/60">
              {tournament.tournament?.name} • Match #{activeMatch.matchNumber}
            </p>
          </div>
          <div className="w-12 text-right">
            {viewMode === 'scoring' && (
              <span className="text-[10px] text-cricket-success font-medium">LIVE</span>
            )}
            {viewMode === 'completed' && (
              <span className="text-[10px] text-white/60">Completed</span>
            )}
          </div>
        </div>

        {/* Live NRR Display */}
        {liveNRRInfo && (
          <div className="max-w-lg mx-auto px-3 pb-2">
            <div className="flex justify-center gap-4 text-[10px]">
              <div className="text-center">
                <span className="text-white/60">
                  {tournament.getTeamById(liveNRRInfo.battingFirstTeamId)?.name} NRR:
                </span>
                <span className={`ml-1 font-medium ${
                  (liveNRRInfo.battingFirstNRR ?? 0) >= 0 ? 'text-cricket-success' : 'text-cricket-wicket'
                }`}>
                  {formatLiveNRR(liveNRRInfo.battingFirstNRR ?? 0)}
                </span>
              </div>
              <div className="text-center">
                <span className="text-white/60">
                  {tournament.getTeamById(liveNRRInfo.bowlingFirstTeamId)?.name} NRR:
                </span>
                <span className={`ml-1 font-medium ${
                  (liveNRRInfo.bowlingFirstNRR ?? 0) >= 0 ? 'text-cricket-success' : 'text-cricket-wicket'
                }`}>
                  {formatLiveNRR(liveNRRInfo.bowlingFirstNRR ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-3 py-2 space-y-2">
        {/* Player Management - handles all player selection dialogs */}
        {!isLoadingPlayers && teamAPlayers.length > 0 && teamBPlayers.length > 0 && activeMatch?.battingFirstTeamId && (
          <MatchPlayerManager
            state={state}
            teamA={teamA!}
            teamB={teamB!}
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
            battingFirstTeamId={activeMatch.battingFirstTeamId}
            onSetTeamPlayers={setTeamPlayers}
            onSetOpeningBatsmen={setOpeningBatsmen}
            onSetBowler={setBowler}
            onNextBatsman={nextBatsman}
          />
        )}

        {/* Show warning if not enough players */}
        {!isLoadingPlayers && (teamAPlayers.length < 2 || teamBPlayers.length < 2) && (
          <div className="bg-cricket-wicket/10 border border-cricket-wicket/30 rounded-lg p-4 text-center">
            <p className="text-sm text-cricket-wicket">
              Need at least 2 players per team to start scoring.
            </p>
            <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 mt-1">
              Add players in the Teams tab.
            </p>
          </div>
        )}

        {viewMode === 'scoring' && !state.isMatchOver && canScore && (
          <>
            {/* Current Players Display */}
            <CurrentPlayers
              state={state}
              battingTeam={state.battingTeam === 'A' ? teamA! : teamB!}
              bowlingTeam={state.battingTeam === 'A' ? teamB! : teamA!}
              battingPlayers={state.battingTeam === 'A' ? teamAPlayers : teamBPlayers}
              bowlingPlayers={state.battingTeam === 'A' ? teamBPlayers : teamAPlayers}
            />

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
          </>
        )}

        {/* Completed match view with detailed scorecards */}
        {(viewMode === 'completed' || (viewMode === 'scoring' && state.isMatchOver)) && activeMatch.battingFirstTeamId && (
          <>
            {/* First Innings */}
            <BattingScorecard
              inning={state.innings.first}
              players={state.battingTeam === 'A' ? teamAPlayers : teamBPlayers}
              battingTeamName={state.battingTeam === 'A' ? teamA!.name : teamB!.name}
            />
            <BowlingFigures
              inning={state.innings.first}
              players={state.battingTeam === 'A' ? teamBPlayers : teamAPlayers}
              bowlingTeamName={state.battingTeam === 'A' ? teamB!.name : teamA!.name}
            />

            {/* Second Innings */}
            <BattingScorecard
              inning={state.innings.second}
              players={state.battingTeam === 'A' ? teamBPlayers : teamAPlayers}
              battingTeamName={state.battingTeam === 'A' ? teamB!.name : teamA!.name}
            />
            <BowlingFigures
              inning={state.innings.second}
              players={state.battingTeam === 'A' ? teamAPlayers : teamBPlayers}
              bowlingTeamName={state.battingTeam === 'A' ? teamA!.name : teamB!.name}
            />

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="w-full py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90"
            >
              ← Back to Tournament
            </button>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-cricket-target/30 dark:border-white/10 py-1">
        <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 text-center">
          {activeMatch.overs} overs per side • {teamA.name} vs {teamB.name}
        </p>
      </footer>

      {/* Toss Dialog */}
      <TossDialog
        isOpen={viewMode === 'toss'}
        teamA={teamA}
        teamB={teamB}
        onConfirm={handleTossConfirm}
        onCancel={handleTossCancel}
      />

      {/* Match Complete Dialog */}
      {showCompleteDialog && winnerInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-xl p-5 max-w-sm w-full shadow-xl border border-cricket-target/20 dark:border-white/10">
            <h3 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text mb-2 text-center">
              Match Complete!
            </h3>

            {state.winner ? (
              <div className="text-center mb-4">
                <p className="text-cricket-success font-semibold text-lg">
                  {winnerInfo.winnerTeam?.name} won
                </p>
                <p className="text-sm text-cricket-target dark:text-cricket-dark-text/70">
                  by {winnerInfo.margin}
                </p>
              </div>
            ) : (
              <p className="text-center text-cricket-target dark:text-cricket-dark-text/70 mb-4">
                Match ended in a tie
              </p>
            )}

            <div className="bg-cricket-bg dark:bg-white/5 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cricket-target dark:text-cricket-dark-text/70">
                  {activeMatch.battingFirstTeamId === teamA.id ? teamA.name : teamB.name}
                </span>
                <span className="font-semibold text-cricket-score dark:text-cricket-dark-text">
                  {state.innings.first.runs}/{state.innings.first.wickets}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cricket-target dark:text-cricket-dark-text/70">
                  {activeMatch.battingFirstTeamId === teamA.id ? teamB.name : teamA.name}
                </span>
                <span className="font-semibold text-cricket-score dark:text-cricket-dark-text">
                  {state.innings.second.runs}/{state.innings.second.wickets}
                </span>
              </div>
            </div>

            <button
              onClick={handleBack}
              className="w-full py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90"
            >
              Back to Tournament
            </button>
          </div>
        </div>
      )}
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
