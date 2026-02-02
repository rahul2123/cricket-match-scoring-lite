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
    addRun,
    addWide,
    addNoBall,
    addBye,
    addLegBye,
    undo,
    endInnings,
    newMatch,
  } = useMatch();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-center text-primary-200">
            🏏 Cricket Scorer
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Scoreboard */}
        <ScoreBoard
          state={state}
          currentInning={currentInning}
          runsRequired={runsRequired}
        />

        {/* Scoring Buttons */}
        <ScoringButtons
          canScore={canScore}
          canUndo={canUndo}
          canEndInnings={canEndInnings}
          onAddRun={addRun}
          onAddWide={addWide}
          onAddNoBall={addNoBall}
          onAddBye={addBye}
          onAddLegBye={addLegBye}
          onUndo={undo}
          onEndInnings={endInnings}
          onNewMatch={newMatch}
        />

        {/* Ball History */}
        <BallHistory
          balls={state.ballHistory}
          currentInning={state.currentInning}
        />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 py-2">
        <p className="text-xs text-slate-500 text-center">
          Offline-ready PWA • Data saved locally
        </p>
      </footer>
    </div>
  );
}

export default App;
