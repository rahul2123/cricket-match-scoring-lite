import { TeamStandings } from '../../types/tournament';
import { formatNRR } from '../../utils/helpers';

interface StandingsTableProps {
  standings: TeamStandings[];
  isLoading: boolean;
}

export function StandingsTable({ standings, isLoading }: StandingsTableProps) {
  if (isLoading && standings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-cricket-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">Loading standings...</p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-cricket-target dark:text-cricket-dark-text/60 text-sm mb-1">
          No standings yet
        </p>
        <p className="text-cricket-target/60 dark:text-cricket-dark-text/40 text-xs">
          Complete matches to see the leaderboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text">
        Points Table
      </h2>

      {/* Table */}
      <div className="bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-8 gap-1 px-3 py-2 bg-cricket-secondary/20 dark:bg-white/5 text-xs font-medium text-cricket-target dark:text-cricket-dark-text/60">
          <div className="col-span-2">Team</div>
          <div className="text-center">P</div>
          <div className="text-center">W</div>
          <div className="text-center">L</div>
          <div className="text-center">Pts</div>
          <div className="text-center">NRR</div>
          <div className="text-center">Form</div>
        </div>

        {/* Table Body */}
        {standings.map((team, index) => (
          <div
            key={team.teamId}
            className={`grid grid-cols-8 gap-1 px-3 py-3 text-sm ${
              index !== standings.length - 1
                ? 'border-b border-cricket-target/10 dark:border-white/5'
                : ''
            } ${index < 4 ? 'bg-cricket-success/5' : ''}`}
          >
            {/* Position & Team Name */}
            <div className="col-span-2 flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-cricket-primary/20 text-cricket-primary dark:text-cricket-dark-accent text-xs font-bold">
                {index + 1}
              </span>
              <span className="font-medium text-cricket-score dark:text-cricket-dark-text truncate">
                {team.teamName}
              </span>
            </div>

            {/* Played */}
            <div className="text-center text-cricket-score dark:text-cricket-dark-text tabular-nums">
              {team.matchesPlayed}
            </div>

            {/* Won */}
            <div className="text-center text-cricket-success tabular-nums">
              {team.wins}
            </div>

            {/* Lost */}
            <div className="text-center text-cricket-wicket tabular-nums">
              {team.losses}
            </div>

            {/* Points */}
            <div className="text-center font-semibold text-cricket-primary dark:text-cricket-dark-accent tabular-nums">
              {team.points}
            </div>

            {/* NRR */}
            <div className="text-center tabular-nums">
              <span className={team.nrr > 0 ? 'text-cricket-success' : team.nrr < 0 ? 'text-cricket-wicket' : 'text-cricket-target dark:text-cricket-dark-text/60'}>
                {formatNRR(team.nrr)}
              </span>
            </div>

            {/* Form (last 5) */}
            <div className="text-center text-[10px]">
              {team.matchesPlayed > 0 ? (
                <span className="text-cricket-target dark:text-cricket-dark-text/60">
                  {team.wins}W-{team.losses}L
                  {team.ties > 0 && `-${team.ties}T`}
                </span>
              ) : (
                '-'
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="text-xs text-cricket-target dark:text-cricket-dark-text/60 px-1">
        <p className="mb-1">
          <strong>NRR</strong> = Net Run Rate = (Runs/Overs) - (Runs Conceded/Overs Bowled)
        </p>
        <p>
          Top 4 teams highlighted • Sorted by Points, then NRR
        </p>
      </div>
    </div>
  );
}
