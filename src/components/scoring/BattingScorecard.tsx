import type { TeamPlayer } from '../../types/tournament';
import type { InningState, DismissalType } from '../../types';

interface BattingScorecardProps {
  inning: InningState;
  players: TeamPlayer[];
  battingTeamName: string;
}

const dismissalLabels: Record<DismissalType, string> = {
  bowled: 'b',
  caught: 'c',
  lbw: 'lbw',
  run_out: 'run out',
  stumped: 'st',
  hit_wicket: 'hit wicket',
  handled_ball: 'handled ball',
  obstructing: 'obstructing',
  timed_out: 'timed out',
};

export function BattingScorecard({
  inning,
  players,
  battingTeamName,
}: BattingScorecardProps) {
  // Get player name by profile ID
  const getPlayerName = (profileId: number): string => {
    const player = players.find(p => p.profileId === profileId);
    return player?.profile?.name || 'Unknown';
  };

  // Sort batsmen by batting order
  const sortedBatsmen = Object.values(inning.batsmen).sort((a, b) => a.battingOrder - b.battingOrder);

  // Format dismissal text
  const formatDismissal = (batsman: InningState['batsmen'][number]): string => {
    if (!batsman.isOut) {
      return batsman.balls > 0 ? 'not out' : 'did not bat';
    }

    const dismissal = batsman.dismissalType || 'bowled';
    const label = dismissalLabels[dismissal] || dismissal;

    if (batsman.bowlerProfileId) {
      const bowlerName = getPlayerName(batsman.bowlerProfileId);
      if (dismissal === 'caught' && batsman.fielderProfileId) {
        const fielderName = getPlayerName(batsman.fielderProfileId);
        return `c ${fielderName} b ${bowlerName}`;
      }
      if (dismissal === 'run_out') {
        return `run out`;
      }
      if (dismissal === 'stumped' && batsman.fielderProfileId) {
        const fielderName = getPlayerName(batsman.fielderProfileId);
        return `st ${fielderName} b ${bowlerName}`;
      }
      return `${label} ${bowlerName}`;
    }

    return label;
  };

  // Calculate totals
  const totalRuns = inning.runs;
  const totalBalls = inning.balls;
  const totalWickets = inning.wickets;
  const extras = inning.extras.wides + inning.extras.noballs + inning.extras.byes + inning.extras.legbyes;

  if (sortedBatsmen.length === 0) {
    return null;
  }

  return (
    <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg border border-cricket-target/20 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 px-3 py-2 border-b border-cricket-target/20 dark:border-white/10">
        <h3 className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
          {battingTeamName} Innings
        </h3>
      </div>

      {/* Scorecard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cricket-bg/50 dark:bg-white/5 text-cricket-target dark:text-cricket-dark-text/60">
              <th className="text-left px-3 py-2 font-medium">Batsman</th>
              <th className="text-right px-2 py-2 font-medium w-12">R</th>
              <th className="text-right px-2 py-2 font-medium w-12">B</th>
              <th className="text-right px-2 py-2 font-medium w-10">4s</th>
              <th className="text-right px-2 py-2 font-medium w-10">6s</th>
              <th className="text-left px-3 py-2 font-medium">Dismissal</th>
            </tr>
          </thead>
          <tbody>
            {sortedBatsmen.map((batsman) => {
              const isOnStrike = batsman.profileId === inning.strikerId;

              return (
                <tr
                  key={batsman.profileId}
                  className={`border-b border-cricket-target/10 dark:border-white/5 ${
                    isOnStrike ? 'bg-cricket-primary/5' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <span className="text-cricket-score dark:text-cricket-dark-text">
                      {getPlayerName(batsman.profileId)}
                    </span>
                    {isOnStrike && (
                      <span className="ml-1 text-[10px] text-cricket-success">*</span>
                    )}
                  </td>
                  <td className="text-right px-2 py-2 font-medium text-cricket-score dark:text-cricket-dark-text">
                    {batsman.runs}
                  </td>
                  <td className="text-right px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {batsman.balls}
                  </td>
                  <td className="text-right px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {batsman.fours}
                  </td>
                  <td className="text-right px-2 py-2 text-cricket-target dark:text-cricket-dark-text/60">
                    {batsman.sixes}
                  </td>
                  <td className="px-3 py-2 text-cricket-target dark:text-cricket-dark-text/60 text-xs">
                    {formatDismissal(batsman)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Extras */}
      <div className="px-3 py-2 border-t border-cricket-target/10 dark:border-white/5 bg-cricket-bg/30 dark:bg-white/5">
        <div className="flex justify-between text-xs">
          <span className="text-cricket-target dark:text-cricket-dark-text/60">Extras</span>
          <span className="text-cricket-score dark:text-cricket-dark-text">
            {extras}
            <span className="text-cricket-target dark:text-cricket-dark-text/60 ml-1">
              (WD {inning.extras.wides}, NB {inning.extras.noballs}, B {inning.extras.byes}, LB {inning.extras.legbyes})
            </span>
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="px-3 py-2 border-t border-cricket-target/10 dark:border-white/5">
        <div className="flex justify-between">
          <span className="text-cricket-score dark:text-cricket-dark-text font-semibold">Total</span>
          <span className="text-cricket-score dark:text-cricket-dark-text font-semibold">
            {totalRuns}/{totalWickets}
            <span className="font-normal text-cricket-target dark:text-cricket-dark-text/60 ml-1">
              ({Math.floor(totalBalls / 6)}.{totalBalls % 6} overs)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
