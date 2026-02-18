import { useState } from 'react';
import { Team, TournamentMatch } from '../../types/tournament';

interface MatchSchedulerProps {
  matches: TournamentMatch[];
  teams: Team[];
  canEdit: boolean;
  tournamentId: number;
  onAddMatch: (input: { tournamentId: number; teamAId: number; teamBId: number }) => Promise<TournamentMatch | null>;
  onStartMatch: (matchId: number) => void;
  onEditMatch: (id: number, updates: Partial<TournamentMatch>) => Promise<TournamentMatch | null>;
}

export function MatchScheduler({
  matches,
  teams,
  canEdit,
  tournamentId,
  onAddMatch,
  onStartMatch,
}: MatchSchedulerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [teamAId, setTeamAId] = useState<number | null>(null);
  const [teamBId, setTeamBId] = useState<number | null>(null);
  const [addingMatch, setAddingMatch] = useState(false);

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId || !teamBId || teamAId === teamBId || addingMatch) return;

    setAddingMatch(true);
    try {
      const match = await onAddMatch({
        tournamentId,
        teamAId,
        teamBId,
      });
      if (match) {
        setTeamAId(null);
        setTeamBId(null);
        setShowAddForm(false);
      }
    } finally {
      setAddingMatch(false);
    }
  };

  const getStatusColor = (status: TournamentMatch['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-cricket-target/20 text-cricket-target';
      case 'live':
        return 'bg-cricket-success/20 text-cricket-success animate-pulse';
      case 'completed':
        return 'bg-cricket-secondary/30 text-white/80';
      case 'abandoned':
        return 'bg-cricket-wicket/20 text-cricket-wicket';
    }
  };

  const getTeamName = (teamId: number): string => {
    return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
  };

  const availableTeamsForB = teams.filter((t) => t.id !== teamAId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text">
          Matches ({matches.length})
        </h2>
        {canEdit && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            disabled={teams.length < 2}
            className="px-3 py-1.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            + Add Match
          </button>
        )}
      </div>

      {/* Add Match Form */}
      {showAddForm && (
        <form onSubmit={handleAddMatch} className="bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-medium text-cricket-score dark:text-cricket-dark-text mb-3">
            Create New Match
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">
                Team A
              </label>
              <select
                value={teamAId ?? ''}
                onChange={(e) => setTeamAId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm"
              >
                <option value="">Select team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center text-cricket-target dark:text-cricket-dark-text/60 text-sm">
              vs
            </div>

            <div>
              <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">
                Team B
              </label>
              <select
                value={teamBId ?? ''}
                onChange={(e) => setTeamBId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm"
              >
                <option value="">Select team...</option>
                {availableTeamsForB.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setTeamAId(null);
                setTeamBId(null);
              }}
              className="flex-1 py-2 rounded-lg bg-cricket-secondary/80 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!teamAId || !teamBId || teamAId === teamBId || addingMatch}
              className="flex-1 py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium disabled:opacity-50"
            >
              {addingMatch ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </form>
      )}

      {/* Match List */}
      {matches.length === 0 ? (
        <div className="text-center py-8 text-cricket-target dark:text-cricket-dark-text/60 text-sm">
          No matches scheduled yet.
          {canEdit && ' Create a match to get started.'}
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
                  Match #{match.matchNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                  {match.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
                    {getTeamName(match.teamAId)} vs {getTeamName(match.teamBId)}
                  </p>
                  {match.status === 'completed' && match.matchState && (
                    <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 mt-1">
                      Result: {match.resultType === 'tie' ? 'Tie' : match.winnerTeamId ? `${getTeamName(match.winnerTeamId)} won` : '-'}
                    </p>
                  )}
                </div>

                {match.status === 'scheduled' && canEdit && (
                  <button
                    onClick={() => onStartMatch(match.id)}
                    className="px-3 py-1.5 rounded-lg bg-cricket-success text-white text-sm font-medium hover:opacity-90"
                  >
                    Start
                  </button>
                )}

                {match.status === 'live' && (
                  <button
                    onClick={() => onStartMatch(match.id)}
                    className="px-3 py-1.5 rounded-lg bg-cricket-primary text-white text-sm font-medium hover:opacity-90"
                  >
                    Score →
                  </button>
                )}

                {match.status === 'completed' && (
                  <button
                    onClick={() => {/* Show scorecard */}}
                    className="px-3 py-1.5 rounded-lg bg-cricket-secondary/50 dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium hover:opacity-90"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
