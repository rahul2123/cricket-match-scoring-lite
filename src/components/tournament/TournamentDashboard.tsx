import { useState } from 'react';
import { useTournament } from '../../hooks/useTournament';
import { TeamManager } from './TeamManager';
import { MatchScheduler } from './MatchScheduler';
import { StandingsTable } from './StandingsTable';

interface TournamentDashboardProps {
  tournamentCode: string;
  onBack: () => void;
  onStartMatch: (matchId: number) => void;
}

type Tab = 'standings' | 'matches' | 'teams';

export function TournamentDashboard({
  tournamentCode,
  onBack,
  onStartMatch,
}: TournamentDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('standings');
  const tournament = useTournament(tournamentCode);

  const {
    tournament: tournamentData,
    teams,
    matches,
    standings,
    isLoading,
    error,
    isAdmin,
    canEdit,
    addTeam,
    removeTeam,
    loadPlayersForTeam,
    addPlayer,
    removePlayer,
    playersByTeam,
    addMatch,
    updateMatch,
    startMatch,
  } = tournament;

  if (isLoading && !tournamentData) {
    return (
      <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cricket-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error && !tournamentData) {
    return (
      <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-cricket-wicket mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-cricket-primary text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!tournamentData) {
    return null;
  }

  const getStatusBadge = () => {
    const styles = {
      upcoming: 'bg-cricket-target/20 text-cricket-target',
      ongoing: 'bg-cricket-success/20 text-cricket-success',
      completed: 'bg-cricket-secondary/20 text-white',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[tournamentData.status]}`}>
        {tournamentData.status.charAt(0).toUpperCase() + tournamentData.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg">
      {/* Header */}
      <header className="bg-cricket-primary dark:bg-cricket-secondary border-b border-cricket-primary/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-3 py-3">
          <div className="flex items-center mb-1">
            <button
              onClick={onBack}
              className="text-white/80 hover:text-white text-sm mr-2"
            >
              ← Back
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  {tournamentData.name}
                </h1>
                {getStatusBadge()}
              </div>
            </div>
            <div className="w-12 text-right">
              <span className="text-[10px] text-white/60 font-mono">{tournamentData.code}</span>
            </div>
          </div>
          <p className="text-[10px] text-white/60 text-center">
            {tournamentData.oversPerMatch} overs • {tournamentData.pointsWin}pt win / {tournamentData.pointsTie}pt tie
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-cricket-card dark:bg-cricket-dark-card border-b border-cricket-target/20 dark:border-white/10">
        <div className="max-w-lg mx-auto flex">
          {(['standings', 'matches', 'teams'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-cricket-primary dark:text-cricket-dark-accent border-b-2 border-cricket-primary dark:border-cricket-dark-accent'
                  : 'text-cricket-target dark:text-cricket-dark-text/60 hover:text-cricket-score dark:hover:text-cricket-dark-text'
              }`}
            >
              {tab}
              {tab === 'teams' && ` (${teams.length})`}
              {tab === 'matches' && ` (${matches.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-lg mx-auto px-3 py-4">
        {activeTab === 'standings' && (
          <StandingsTable standings={standings} isLoading={isLoading} />
        )}

        {activeTab === 'matches' && (
          <MatchScheduler
            matches={matches}
            teams={teams}
            canEdit={canEdit}
            tournamentId={tournamentData.id}
            onAddMatch={addMatch}
            onStartMatch={(matchId) => {
              startMatch(matchId);
              onStartMatch(matchId);
            }}
            onEditMatch={updateMatch}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManager
            teams={teams}
            canEdit={canEdit}
            onAddTeam={async (name, shortName) => {
              return addTeam({
                tournamentId: tournamentData.id,
                name,
                shortName,
              });
            }}
            onDeleteTeam={removeTeam}
            onLoadPlayers={loadPlayersForTeam}
            onAddPlayer={async (teamId, name, role) => {
              return addPlayer({
                teamId,
                name,
                role,
              });
            }}
            onDeletePlayer={removePlayer}
            playersByTeam={playersByTeam}
          />
        )}
      </main>

      {/* Admin Footer */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-cricket-card dark:bg-cricket-dark-card border-t border-cricket-target/20 dark:border-white/10 p-3">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">
              You are the tournament admin • Share code: <span className="font-mono font-semibold">{tournamentData.code}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
