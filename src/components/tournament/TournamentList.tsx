import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserTournaments } from '../../hooks/useTournament';
import { Tournament, TournamentFormat } from '../../types/tournament';
import { CreateTournamentDialog } from './CreateTournamentDialog';
import * as tournamentApi from '../../utils/tournamentApi';

interface TournamentListProps {
  onSelectTournament: (code: string) => void;
  onJoinByCode: () => void;
}

export function TournamentList({ onSelectTournament, onJoinByCode }: TournamentListProps) {
  const navigate = useNavigate();
  const { tournaments, isLoading, error, refresh } = useUserTournaments();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTournament = async (input: {
    name: string;
    format: TournamentFormat;
    oversPerMatch: number;
    pointsWin: number;
    pointsTie: number;
  }) => {
    setIsCreating(true);
    try {
      const tournament = await tournamentApi.createTournament(input);
      if (tournament) {
        setShowCreateDialog(false);
        refresh();
        onSelectTournament(tournament.code);
      }
    } catch (err) {
      console.error('Error creating tournament:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: Tournament['status']) => {
    const styles = {
      upcoming: 'bg-cricket-target/20 text-cricket-target',
      ongoing: 'bg-cricket-success/20 text-cricket-success',
      completed: 'bg-cricket-secondary/20 text-white',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-cricket-bg dark:bg-cricket-dark-bg">
      {/* Header */}
      <header className="bg-cricket-primary dark:bg-cricket-secondary border-b border-cricket-primary/20 dark:border-white/10">
        <div className="max-w-lg mx-auto px-3 py-3 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white text-sm"
          >
            ← Scorer
          </button>
          <h1 className="flex-1 text-lg font-semibold text-center text-white tracking-tight">
            Tournaments
          </h1>
          <div className="w-14"></div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-3 py-4">
        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex-1 py-3 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90"
          >
            + Create Tournament
          </button>
          <button
            onClick={onJoinByCode}
            className="flex-1 py-3 rounded-lg bg-cricket-secondary dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
          >
            Join with Code
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-cricket-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">Loading tournaments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-cricket-wicket/10 border border-cricket-wicket/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-cricket-wicket">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm text-cricket-primary dark:text-cricket-dark-accent font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tournament List */}
        {!isLoading && !error && tournaments.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60 text-sm mb-1">
              No tournaments yet
            </p>
            <p className="text-cricket-target/60 dark:text-cricket-dark-text/40 text-xs">
              Create a tournament to get started
            </p>
          </div>
        )}

        {!isLoading && !error && tournaments.length > 0 && (
          <div className="space-y-2">
            {tournaments.map((tournament) => (
              <button
                key={tournament.id}
                onClick={() => onSelectTournament(tournament.code)}
                className="w-full bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-xl p-4 text-left hover:border-cricket-primary/50 dark:hover:border-cricket-dark-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-cricket-score dark:text-cricket-dark-text">
                    {tournament.name}
                  </h3>
                  {getStatusBadge(tournament.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-cricket-target dark:text-cricket-dark-text/60">
                  <span>{tournament.oversPerMatch} overs/match</span>
                  <span>•</span>
                  <span>{tournament.pointsWin}pt win / {tournament.pointsTie}pt tie</span>
                </div>
                <div className="mt-2 text-xs text-cricket-target/60 dark:text-cricket-dark-text/40">
                  Code: <span className="font-mono font-semibold text-cricket-primary dark:text-cricket-dark-accent">{tournament.code}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create Tournament Dialog */}
      <CreateTournamentDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateTournament}
        isLoading={isCreating}
      />
    </div>
  );
}
