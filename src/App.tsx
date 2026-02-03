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
    runsRequired,
    ballsRemaining,
    addRun,
    addWicket,
    addWide,
    addNoBall,
    addBye,
    addLegBye,
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
  } = useMatch();

  return (
    <div className="min-h-screen h-screen max-h-[100dvh] flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/80">
        <div className="max-w-lg mx-auto px-3 py-2">
          <h1 className="text-base font-semibold text-center text-slate-200 tracking-tight">
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
      <footer className="shrink-0 border-t border-slate-800 py-1">
        <p className="text-[10px] text-slate-600 text-center">
          Offline • Saved locally
        </p>
      </footer>
    </div>
  );
}

export default App;
