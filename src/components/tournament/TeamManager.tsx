import { useState } from 'react';
import { Team, Player, PlayerRole } from '../../types/tournament';

interface TeamManagerProps {
  teams: Team[];
  canEdit: boolean;
  onAddTeam: (name: string, shortName?: string) => Promise<Team | null>;
  onDeleteTeam: (id: number) => Promise<boolean>;
  onLoadPlayers: (teamId: number) => void;
  onAddPlayer: (teamId: number, name: string, role: PlayerRole) => Promise<Player | null>;
  onDeletePlayer: (playerId: number) => Promise<boolean>;
  playersByTeam: Record<number, Player[]>;
}

export function TeamManager({
  teams,
  canEdit,
  onAddTeam,
  onDeleteTeam,
  onLoadPlayers,
  onAddPlayer,
  onDeletePlayer,
  playersByTeam,
}: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShortName, setNewTeamShortName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);

  // Player form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('batsman');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState<number | null>(null);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || addingTeam) return;

    setAddingTeam(true);
    try {
      const team = await onAddTeam(newTeamName.trim(), newTeamShortName.trim() || undefined);
      if (team) {
        setNewTeamName('');
        setNewTeamShortName('');
      }
    } finally {
      setAddingTeam(false);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (deletingTeamId === id) {
      setDeletingTeamId(null);
      await onDeleteTeam(id);
    } else {
      setDeletingTeamId(id);
      setTimeout(() => setDeletingTeamId(null), 3000);
    }
  };

  const toggleTeamExpansion = (teamId: number) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
    } else {
      setExpandedTeam(teamId);
      onLoadPlayers(teamId);
    }
    // Reset player form when switching teams
    setNewPlayerName('');
    setNewPlayerRole('batsman');
    setDeletingPlayerId(null);
  };

  const handleAddPlayer = async (e: React.FormEvent, teamId: number) => {
    e.preventDefault();
    if (!newPlayerName.trim() || addingPlayer) return;

    setAddingPlayer(true);
    try {
      const player = await onAddPlayer(teamId, newPlayerName.trim(), newPlayerRole);
      if (player) {
        setNewPlayerName('');
        setNewPlayerRole('batsman');
      }
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (deletingPlayerId === playerId) {
      setDeletingPlayerId(null);
      await onDeletePlayer(playerId);
    } else {
      setDeletingPlayerId(playerId);
      setTimeout(() => setDeletingPlayerId(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text">
          Teams ({teams.length})
        </h2>
      </div>

      {/* Add Team Form */}
      {canEdit && (
        <form onSubmit={handleAddTeam} className="bg-cricket-bg dark:bg-white/5 rounded-lg p-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              className="flex-1 px-3 py-2 rounded-lg bg-cricket-card dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-cricket-primary"
            />
            <input
              type="text"
              value={newTeamShortName}
              onChange={(e) => setNewTeamShortName(e.target.value.slice(0, 3).toUpperCase())}
              placeholder="ABC"
              maxLength={3}
              className="w-16 px-2 py-2 rounded-lg bg-cricket-card dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-cricket-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!newTeamName.trim() || addingTeam}
            className="w-full py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {addingTeam ? 'Adding...' : 'Add Team'}
          </button>
        </form>
      )}

      {/* Team List */}
      {teams.length === 0 ? (
        <div className="text-center py-6 text-cricket-target dark:text-cricket-dark-text/60 text-sm">
          No teams yet. {canEdit && 'Add teams to get started.'}
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-lg overflow-hidden"
            >
              {/* Team Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-cricket-bg/50 dark:hover:bg-white/5"
                onClick={() => toggleTeamExpansion(team.id)}
              >
                <div className="flex items-center gap-3">
                  {team.shortName && (
                    <span className="w-10 h-10 flex items-center justify-center bg-cricket-primary/20 text-cricket-primary dark:text-cricket-dark-accent font-bold rounded-lg text-sm">
                      {team.shortName}
                    </span>
                  )}
                  <div>
                    <h3 className="font-medium text-cricket-score dark:text-cricket-dark-text">
                      {team.name}
                    </h3>
                    <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
                      {playersByTeam[team.id]?.length ?? '...'} players
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team.id);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        deletingTeamId === team.id
                          ? 'bg-cricket-wicket text-white'
                          : 'bg-cricket-wicket/20 text-cricket-wicket hover:bg-cricket-wicket/30'
                      }`}
                    >
                      {deletingTeamId === team.id ? 'Confirm?' : 'Delete'}
                    </button>
                  )}
                  <span className="text-cricket-target dark:text-cricket-dark-text/60">
                    {expandedTeam === team.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded Team Details (Players) */}
              {expandedTeam === team.id && (
                <div className="border-t border-cricket-target/20 dark:border-white/10 p-3 bg-cricket-bg/50 dark:bg-white/5">
                  {/* Add Player Form */}
                  {canEdit && (
                    <form onSubmit={(e) => handleAddPlayer(e, team.id)} className="mb-3 pb-3 border-b border-cricket-target/10 dark:border-white/10">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Player name"
                          className="flex-1 px-3 py-2 rounded-lg bg-cricket-card dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-cricket-primary"
                        />
                        <select
                          value={newPlayerRole}
                          onChange={(e) => setNewPlayerRole(e.target.value as PlayerRole)}
                          className="w-28 px-2 py-2 rounded-lg bg-cricket-card dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-cricket-primary"
                        >
                          <option value="batsman">Batsman</option>
                          <option value="bowler">Bowler</option>
                          <option value="all-rounder">All-rounder</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={!newPlayerName.trim() || addingPlayer}
                        className="w-full py-2 rounded-lg bg-cricket-success text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {addingPlayer ? 'Adding...' : 'Add Player'}
                      </button>
                    </form>
                  )}

                  {/* Player List */}
                  {playersByTeam[team.id] === undefined ? (
                    <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 text-center py-2">
                      Loading players...
                    </p>
                  ) : playersByTeam[team.id].length === 0 ? (
                    <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 text-center py-2">
                      No players yet. {canEdit && 'Add players above.'}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {playersByTeam[team.id].map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between py-2 px-3 bg-cricket-card dark:bg-cricket-dark-card rounded-lg"
                        >
                          <div>
                            <span className="text-sm text-cricket-score dark:text-cricket-dark-text">
                              {player.name}
                            </span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-cricket-primary/20 text-cricket-primary dark:text-cricket-dark-accent capitalize">
                              {player.role.replace('-', ' ')}
                            </span>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                deletingPlayerId === player.id
                                  ? 'bg-cricket-wicket text-white'
                                  : 'bg-cricket-wicket/20 text-cricket-wicket hover:bg-cricket-wicket/30'
                              }`}
                            >
                              {deletingPlayerId === player.id ? 'Confirm?' : 'Delete'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
