import type { TeamPlayer } from '../../types/tournament';
import type { InningState } from '../../types';

interface BowlingFiguresProps {
  inning: InningState;
  players: TeamPlayer[];
  bowlingTeamName: string;
}

export function BowlingFigures({
  inning,
  players,
  bowlingTeamName,
}: BowlingFiguresProps) {
  // Get player name by profile ID
  const getPlayerName = (profileId: number): string => {
    const player = players.find(p => p.profileId === profileId);
    return player?.profile?.name || 'Unknown';
  };

  // Sort bowlers by balls bowled (most first)
  const sortedBowlers = Object.values(inning.bowlers).sort((a, b) => b.balls - a.balls);

  if (sortedBowlers.length === 0) {
    return null;
  }

  return (
    <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg border border-cricket-target/20 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-cricket-secondary/10 px-3 py-2 border-b border-cricket-target/20 dark:border-white/10">
        <h3 className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
          {bowlingTeamName} Bowling
        </h3>
      </div>

      {/* Bowling Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cricket-bg/50 dark:bg-white/5 text-cricket-target dark:text-cricket-dark-text/60">
              <th className="text-left px-3 py-2 font-medium">Bowler</th>
              <th className="text-center px-2 py-2 font-medium w-14">O</th>
              <th className="text-center px-2 py-2 font-medium w-10">M</th>
              <th className="text-center px-2 py-2 font-medium w-12">R</th>
              <th className="text-center px-2 py-2 font-medium w-10">W</th>
              <th className="text-center px-2 py-2 font-medium w-12">Econ</th>
              <th className="text-center px-2 py-2 font-medium w-10">WD</th>
              <th className="text-center px-2 py-2 font-medium w-10">NB</th>
            </tr>
          </thead>
          <tbody>
            {sortedBowlers.map((bowler) => {
              const overs = Math.floor(bowler.balls / 6);
              const balls = bowler.balls % 6;
              const economy = bowler.balls > 0
                ? ((bowler.runs / (bowler.balls / 6))).toFixed(2)
                : '0.00';
              const isCurrentBowler = bowler.profileId === inning.bowlerId;

              return (
                <tr
                  key={bowler.profileId}
                  className={`border-b border-cricket-target/10 dark:border-white/5 ${
                    isCurrentBowler ? 'bg-cricket-secondary/5' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className="text-cricket-score dark:text-cricket-dark-text">
                      {getPlayerName(bowler.profileId)}
                    </span>
                    {isCurrentBowler && (
                      <span className="ml-1 text-[10px] text-cricket-success">*</span>
                    )}
                  </td>
                  <td className="text-center px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {overs}.{balls}
                  </td>
                  <td className="text-center px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {bowler.maidens}
                  </td>
                  <td className="text-center px-2 py-2 text-cricket-score dark:text-cricket-dark-text font-medium">
                    {bowler.runs}
                  </td>
                  <td className="text-center px-2 py-2">
                    <span className={bowler.wickets > 0 ? 'text-cricket-success font-semibold' : 'text-cricket-target dark:text-cricket-dark-text/60'}>
                      {bowler.wickets}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {economy}
                  </td>
                  <td className="text-center px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {bowler.wides}
                  </td>
                  <td className="text-center px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {bowler.noBalls}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
