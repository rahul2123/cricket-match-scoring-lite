import { useMatch } from './hooks/useMatch';
import { ScoreBoard } from './components/ScoreBoard';
import { ScoringButtons } from './components/ScoringButtons';
import { BallHistory } from './components/BallHistory';

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
    addBye,
    addLegBye,
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
  } = useMatch();

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
          onAddRun={addRun}
          onAddWicket={addWicket}
          onAddWide={addWide}
          onAddWideWicket={addWideWicket}
          onAddNoBall={addNoBall}
          onAddBye={addBye}
          onAddLegBye={addLegBye}
          onUndo={undo}
          onEndInnings={endInnings}
          onNewMatch={newMatch}
          onSetTotalOvers={setTotalOvers}
        />
        <BallHistory
          balls={state.ballHistory}
          currentInning={state.currentInning}
        />
      </main>

      {/* Footer - minimal */}
      <footer className="shrink-0 border-t border-cricket-target/30 dark:border-white/10 py-1">
        <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 text-center">
          Offline • Saved locally
        </p>
      </footer>
    </div>
  );
}

export default App;
