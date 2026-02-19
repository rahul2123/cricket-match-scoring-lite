import type { TeamPlayer, Team } from '../../types/tournament';
import type { MatchState } from '../../types';

interface CurrentPlayersProps {
  state: MatchState;
  battingTeam: Team;
  bowlingTeam: Team;
  battingPlayers: TeamPlayer[];
  bowlingPlayers: TeamPlayer[];
  onChangeBowler?: () => void;
}

export function CurrentPlayers({
  state,
  battingTeam,
  bowlingTeam,
  battingPlayers,
  bowlingPlayers,
  onChangeBowler,
}: CurrentPlayersProps) {
  const inning = state.currentInning === 1 ? state.innings.first : state.innings.second;

  // Get player by profile ID
  const getPlayer = (profileId: number | undefined): TeamPlayer | undefined => {
    if (!profileId) return undefined;
    return battingPlayers.find(p => p.profileId === profileId) ||
           bowlingPlayers.find(p => p.profileId === profileId);
  };

  // Get batsman stats
  const getBatsmanStats = (profileId: number | undefined): { runs: number; balls: number } => {
    if (!profileId) return { runs: 0, balls: 0 };
    const batsman = inning.batsmen[profileId];
    return batsman ? { runs: batsman.runs, balls: batsman.balls } : { runs: 0, balls: 0 };
  };

  // Get bowler stats
  const getBowlerStats = (profileId: number | undefined): { overs: number; balls: number; runs: number; wickets: number; maidens: number } => {
    if (!profileId) return { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
    const bowler = inning.bowlers[profileId];
    if (!bowler) return { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
    return {
      overs: Math.floor(bowler.balls / 6),
      balls: bowler.balls % 6,
      runs: bowler.runs,
      wickets: bowler.wickets,
      maidens: bowler.maidens,
    };
  };

  const striker = getPlayer(inning.strikerId);
  const nonStriker = getPlayer(inning.nonStrikerId);
  const bowler = getPlayer(inning.bowlerId);

  const strikerStats = getBatsmanStats(inning.strikerId);
  const nonStrikerStats = getBatsmanStats(inning.nonStrikerId);
  const bowlerStats = getBowlerStats(inning.bowlerId);

  // Current over progress
  const ballsInOver = inning.balls % 6;
  const overProgress = ballsInOver === 0 && inning.balls > 0 ? 6 : ballsInOver;

  return (
    <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg border border-cricket-target/20 dark:border-white/10 overflow-hidden">
      {/* Batting Team Header */}
      <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 px-3 py-2 border-b border-cricket-target/20 dark:border-white/10">
        <h3 className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
          {battingTeam?.name} - {inning.runs}/{inning.wickets}
          <span className="font-normal text-cricket-target dark:text-cricket-dark-text/60 ml-2">
            ({Math.floor(inning.balls / 6)}.{inning.balls % 6})
          </span>
        </h3>
      </div>

      {/* Current Batsmen */}
      <div className="p-3 border-b border-cricket-target/10 dark:border-white/5">
        <div className="flex gap-4">
          {/* Striker */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-cricket-success font-medium">● STRIKER</span>
            </div>
            {striker ? (
              <div>
                <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
                  {striker.profile?.name}
                </p>
                <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">
                  {strikerStats.runs}
                  <span className="text-xs">({strikerStats.balls})</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-cricket-target dark:text-cricket-dark-text/40">
                Select batsman
              </p>
            )}
          </div>

          {/* Non-striker */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-cricket-target dark:text-cricket-dark-text/40">NON-STRIKER</span>
            </div>
            {nonStriker ? (
              <div>
                <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
                  {nonStriker.profile?.name}
                </p>
                <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">
                  {nonStrikerStats.runs}
                  <span className="text-xs">({nonStrikerStats.balls})</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-cricket-target dark:text-cricket-dark-text/40">
                -
              </p>
            )}
          </div>
        </div>

        {/* This Over */}
        <div className="mt-2 pt-2 border-t border-cricket-target/10 dark:border-white/5">
          <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/40 mb-1">This Over</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((ball) => (
              <div
                key={ball}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  ball <= overProgress
                    ? 'bg-cricket-primary dark:bg-cricket-dark-accent text-white'
                    : 'bg-cricket-target/20 dark:bg-white/10 text-cricket-target/40'
                }`}
              >
                {ball}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bowler */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/40 mb-1">
              {bowlingTeam?.name} BOWLING
            </p>
            {bowler ? (
              <>
                <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
                  {bowler.profile?.name}
                </p>
                <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">
                  {bowlerStats.wickets}/{bowlerStats.runs} ({bowlerStats.overs}.{bowlerStats.balls})
                  {bowlerStats.maidens > 0 && <span className="ml-1 text-[10px]">{bowlerStats.maidens}M</span>}
                </p>
              </>
            ) : (
              <p className="text-sm text-cricket-target dark:text-cricket-dark-text/40">
                Select bowler
              </p>
            )}
          </div>
          {onChangeBowler && bowler && (
            <button
              onClick={onChangeBowler}
              className="px-2 py-1 text-xs bg-cricket-secondary/50 dark:bg-white/10 text-white dark:text-cricket-dark-text rounded hover:opacity-80"
            >
              Change
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
