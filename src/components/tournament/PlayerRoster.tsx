import { useState } from 'react';
import type { TeamPlayer, PlayerProfile, PlayerRole } from '../../types/tournament';
import * as playerApi from '../../utils/playerApi';

interface PlayerRosterProps {
  teamId: number;
  players: TeamPlayer[];
  onRefresh: () => void;
  canEdit: boolean;
}

export function PlayerRoster({ teamId, players, onRefresh, canEdit }: PlayerRosterProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerProfile[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('batsman');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await playerApi.searchProfiles(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newPlayerName.trim()) return;

    setIsCreating(true);
    try {
      const profile = await playerApi.createProfile({ name: newPlayerName.trim() });
      if (profile) {
        // Add to team
        await playerApi.addPlayerToTeam({
          teamId,
          profileId: profile.id,
          role: selectedRole,
        });
        setNewPlayerName('');
        setShowAddPlayer(false);
        onRefresh();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddExisting = async (profileId: number) => {
    setIsAdding(true);
    try {
      await playerApi.addPlayerToTeam({
        teamId,
        profileId,
        role: selectedRole,
      });
      setSearchQuery('');
      setSearchResults([]);
      setShowAddPlayer(false);
      onRefresh();
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (teamPlayerId: number) => {
    if (!confirm('Remove this player from the team?')) return;

    await playerApi.removePlayerFromTeam(teamPlayerId);
    onRefresh();
  };

  const getRoleColor = (role: PlayerRole) => {
    switch (role) {
      case 'batsman':
        return 'bg-cricket-primary/20 text-cricket-primary dark:text-cricket-dark-accent';
      case 'bowler':
        return 'bg-cricket-success/20 text-cricket-success';
      case 'all-rounder':
        return 'bg-cricket-extras/20 text-cricket-extras';
    }
  };

  return (
    <div className="space-y-3">
      {/* Player List */}
      {players.length > 0 ? (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-cricket-bg dark:bg-white/5 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-cricket-score dark:text-cricket-dark-text">
                  {player.profile?.name || 'Unknown'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleColor(player.role)}`}>
                  {player.role}
                </span>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleRemove(player.id)}
                  className="text-cricket-wicket text-xs hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60 text-center py-4">
          No players added yet
        </p>
      )}

      {/* Add Player Button */}
      {canEdit && !showAddPlayer && (
        <button
          onClick={() => setShowAddPlayer(true)}
          className="w-full py-2 rounded-lg border border-dashed border-cricket-target/50 dark:border-white/20 text-cricket-target dark:text-cricket-dark-text/60 text-sm hover:border-cricket-primary dark:hover:border-cricket-dark-accent hover:text-cricket-primary dark:hover:text-cricket-dark-accent"
        >
          + Add Player
        </button>
      )}

      {/* Add Player Form */}
      {showAddPlayer && (
        <div className="bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-lg p-4">
          <h4 className="text-sm font-medium text-cricket-score dark:text-cricket-dark-text mb-3">
            Add Player
          </h4>

          {/* Role Selection */}
          <div className="mb-3">
            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as PlayerRole)}
              className="w-full px-3 py-2 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm"
            >
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="all-rounder">All-Rounder</option>
            </select>
          </div>

          {/* Search Existing */}
          <div className="mb-3">
            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">
              Search Existing Players
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="flex-1 px-3 py-2 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-2 rounded-lg bg-cricket-secondary dark:bg-white/10 text-white dark:text-cricket-dark-text text-sm font-medium disabled:opacity-50"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleAddExisting(profile.id)}
                    disabled={isAdding}
                    className="w-full text-left px-3 py-2 rounded bg-cricket-bg dark:bg-white/5 text-sm text-cricket-score dark:text-cricket-dark-text hover:bg-cricket-primary/10"
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-xs text-cricket-target dark:text-cricket-dark-text/40 my-3">
            — or —
          </div>

          {/* Create New */}
          <div className="mb-3">
            <label className="block text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">
              Create New Player
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name..."
                className="flex-1 px-3 py-2 rounded-lg bg-cricket-bg dark:bg-white/10 border border-cricket-target/30 dark:border-white/20 text-cricket-score dark:text-cricket-dark-text text-sm"
              />
              <button
                onClick={handleCreateNew}
                disabled={isCreating || !newPlayerName.trim()}
                className="px-3 py-2 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium disabled:opacity-50"
              >
                {isCreating ? '...' : 'Create'}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddPlayer(false);
              setSearchQuery('');
              setSearchResults([]);
              setNewPlayerName('');
            }}
            className="w-full py-2 text-xs text-cricket-target dark:text-cricket-dark-text/60 hover:text-cricket-score dark:hover:text-cricket-dark-text"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
