import type { TournamentMatch, Team } from '../../types/tournament';

interface KnockoutBracketProps {
  matches: TournamentMatch[];
  teams: Team[];
  getTeamName: (teamId: number) => string;
  onStartMatch: (matchId: number) => void;
  onViewMatch: (matchId: number) => void;
  canEdit: boolean;
}

export function KnockoutBracket({
  matches,
  getTeamName,
  onStartMatch,
  onViewMatch,
  canEdit,
}: KnockoutBracketProps) {
  // Group matches by round
  const roundsMap = new Map<number, TournamentMatch[]>();

  // Calculate round numbers based on match number patterns
  // For simplicity, we'll use match count to determine rounds
  const totalMatches = matches.length;
  const totalRounds = Math.ceil(Math.log2(totalMatches + 1));

  // Sort matches by match number
  const sortedMatches = [...matches].sort((a, b) => a.matchNumber - b.matchNumber);

  // Assign rounds based on match number
  // First round: matches 1 to N/2
  // Second round: matches N/2+1 to N/2+N/4
  // etc.
  let matchIndex = 0;
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    const roundMatches: TournamentMatch[] = [];

    for (let i = 0; i < matchesInRound && matchIndex < sortedMatches.length; i++) {
      roundMatches.push(sortedMatches[matchIndex++]);
    }

    if (roundMatches.length > 0) {
      roundsMap.set(round, roundMatches);
    }
  }

  const roundNames = ['Final', 'Semi-Finals', 'Quarter-Finals', 'Round of 16', 'Round of 32'];

  const getStatusColor = (status: TournamentMatch['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-cricket-target/20 text-cricket-target';
      case 'live':
        return 'bg-cricket-success/20 text-cricket-success';
      case 'completed':
        return 'bg-cricket-secondary/30 text-white/80';
      default:
        return 'bg-cricket-target/10 text-cricket-target/60';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-cricket-score dark:text-cricket-dark-text">
        Knockout Bracket
      </h2>

      {matches.length === 0 ? (
        <div className="text-center py-8 text-cricket-target dark:text-cricket-dark-text/60 text-sm">
          No matches scheduled yet.
        </div>
      ) : (
        <div className="space-y-6 overflow-x-auto pb-4">
          {Array.from(roundsMap.entries()).map(([round, roundMatches]) => (
            <div key={round}>
              <h3 className="text-sm font-medium text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                {roundNames[totalRounds - round] ?? `Round ${round}`}
              </h3>

              <div className="grid gap-3" style={{
                gridTemplateColumns: `repeat(${Math.min(roundMatches.length, 2)}, minmax(140px, 1fr))`
              }}>
                {roundMatches.map((match) => {
                  const teamAName = match.teamAId ? getTeamName(match.teamAId) : 'TBD';
                  const teamBName = match.teamBId ? getTeamName(match.teamBId) : 'TBD';
                  const isTBD = !match.teamAId || !match.teamBId;

                  return (
                    <div
                      key={match.id}
                      className={`bg-cricket-card dark:bg-cricket-dark-card border border-cricket-target/20 dark:border-white/10 rounded-lg p-3 ${
                        isTBD ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 mb-2">
                        Match #{match.matchNumber}
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`truncate ${match.winnerTeamId === match.teamAId ? 'font-semibold text-cricket-success' : 'text-cricket-score dark:text-cricket-dark-text'}`}>
                            {teamAName}
                          </span>
                          {match.status === 'completed' && (
                            <span className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
                              {match.matchState?.innings.first.runs ?? '-'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-cricket-target dark:text-cricket-dark-text/40">vs</div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`truncate ${match.winnerTeamId === match.teamBId ? 'font-semibold text-cricket-success' : 'text-cricket-score dark:text-cricket-dark-text'}`}>
                            {teamBName}
                          </span>
                          {match.status === 'completed' && (
                            <span className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
                              {match.matchState?.innings.second.runs ?? '-'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(match.status)}`}>
                          {match.status}
                        </span>

                        {!isTBD && (
                          <>
                            {match.status === 'scheduled' && canEdit && (
                              <button
                                onClick={() => onStartMatch(match.id)}
                                className="px-2 py-1 rounded bg-cricket-success text-white text-[10px] font-medium hover:opacity-90"
                              >
                                Start
                              </button>
                            )}
                            {match.status === 'live' && (
                              <button
                                onClick={() => onStartMatch(match.id)}
                                className="px-2 py-1 rounded bg-cricket-primary text-white text-[10px] font-medium hover:opacity-90"
                              >
                                Score
                              </button>
                            )}
                            {match.status === 'completed' && (
                              <button
                                onClick={() => onViewMatch(match.id)}
                                className="px-2 py-1 rounded bg-cricket-secondary/50 text-white text-[10px] font-medium hover:opacity-90"
                              >
                                View
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
