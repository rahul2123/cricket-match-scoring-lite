import type { MatchState } from '../../types';
import type { Team, TournamentMatch } from '../../types/tournament';

interface MatchScorecardProps {
  match: TournamentMatch;
  teamA: Team;
  teamB: Team;
  matchState: MatchState;
  battingFirstTeamId: number;
  onBack: () => void;
}

export function MatchScorecard({
  match,
  teamA,
  teamB,
  matchState,
  battingFirstTeamId,
  onBack,
}: MatchScorecardProps) {
  const firstInnings = matchState.innings.first;
  const secondInnings = matchState.innings.second;

  // Determine which team batted first
  const battingFirstTeam = battingFirstTeamId === teamA.id ? teamA : teamB;
  const bowlingFirstTeam = battingFirstTeamId === teamA.id ? teamB : teamA;

  // Get result info
  const getResultInfo = () => {
    if (match.resultType === 'tie') {
      return { text: 'Match Tied', color: 'text-cricket-target' };
    }

    if (!match.winnerTeamId) {
      return { text: 'No Result', color: 'text-cricket-target' };
    }

    const winnerTeam = match.winnerTeamId === teamA.id ? teamA : teamB;
    const winnerName = winnerTeam.name;

    if (match.winnerTeamId === battingFirstTeamId) {
      // Team batting first won - won by runs
      const runsMargin = firstInnings.runs - secondInnings.runs;
      return {
        text: `${winnerName} won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`,
        color: 'text-cricket-success',
      };
    } else {
      // Team batting second won - won by wickets
      const wicketsRemaining = 10 - secondInnings.wickets;
      return {
        text: `${winnerName} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`,
        color: 'text-cricket-success',
      };
    }
  };

  const result = getResultInfo();

  // Calculate overs
  const firstInningsOvers = firstInnings.wickets >= 10
    ? match.overs
    : Math.floor(firstInnings.balls / 6);
  const firstInningsBalls = firstInnings.wickets >= 10
    ? match.overs * 6
    : firstInnings.balls % 6;

  const secondInningsOvers = secondInnings.wickets >= 10
    ? match.overs
    : Math.floor(secondInnings.balls / 6);
  const secondInningsBalls = secondInnings.wickets >= 10
    ? match.overs * 6
    : secondInnings.balls % 6;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center pb-3 border-b border-cricket-target/20 dark:border-white/10">
        <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60 mb-1">
          Match #{match.matchNumber} • {match.overs} overs
        </p>
        <h2 className={`text-lg font-semibold ${result.color}`}>
          {result.text}
        </h2>
      </div>

      {/* First Innings */}
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg p-4 border border-cricket-target/20 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-cricket-score dark:text-cricket-dark-text">
            {battingFirstTeam.name}
          </h3>
          <span className="text-xs bg-cricket-primary/20 text-cricket-primary dark:text-cricket-dark-accent px-2 py-0.5 rounded">
            1st Innings
          </span>
        </div>

        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-cricket-score dark:text-cricket-dark-text">
            {firstInnings.runs}
          </span>
          <span className="text-xl text-cricket-target dark:text-cricket-dark-text/60">
            /{firstInnings.wickets}
          </span>
          <span className="text-sm text-cricket-target dark:text-cricket-dark-text/60 ml-2">
            ({firstInningsOvers}.{firstInningsBalls})
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">Runs</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">{firstInnings.runs}</p>
          </div>
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">Wickets</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">{firstInnings.wickets}</p>
          </div>
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">Extras</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {firstInnings.extras.wides + firstInnings.extras.noballs + firstInnings.extras.byes + firstInnings.extras.legbyes}
            </p>
          </div>
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">CRR</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {firstInnings.balls > 0
                ? (firstInnings.runs / (firstInnings.balls / 6)).toFixed(2)
                : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Second Innings */}
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg p-4 border border-cricket-target/20 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-cricket-score dark:text-cricket-dark-text">
            {bowlingFirstTeam.name}
          </h3>
          <span className="text-xs bg-cricket-secondary/20 text-white/80 px-2 py-0.5 rounded">
            2nd Innings
          </span>
        </div>

        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-cricket-score dark:text-cricket-dark-text">
            {secondInnings.runs}
          </span>
          <span className="text-xl text-cricket-target dark:text-cricket-dark-text/60">
            /{secondInnings.wickets}
          </span>
          <span className="text-sm text-cricket-target dark:text-cricket-dark-text/60 ml-2">
            ({secondInningsOvers}.{secondInningsBalls})
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">Target</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {firstInnings.runs + 1}
            </p>
          </div>
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">Need</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {Math.max(0, firstInnings.runs + 1 - secondInnings.runs)}
            </p>
          </div>
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">Extras</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {secondInnings.extras.wides + secondInnings.extras.noballs + secondInnings.extras.byes + secondInnings.extras.legbyes}
            </p>
          </div>
          <div>
            <p className="text-cricket-target dark:text-cricket-dark-text/60">RRR</p>
            <p className="font-medium text-cricket-score dark:text-cricket-dark-text">
              {matchState.target && secondInnings.balls < match.overs * 6
                ? ((matchState.target - secondInnings.runs) / ((match.overs * 6 - secondInnings.balls) / 6)).toFixed(2)
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Extras Breakdown */}
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg p-4 border border-cricket-target/20 dark:border-white/10">
        <h3 className="font-semibold text-cricket-score dark:text-cricket-dark-text mb-3">
          Extras
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-cricket-target dark:text-cricket-dark-text/60">
              {battingFirstTeam.name} (1st):
            </span>
            <span className="text-cricket-score dark:text-cricket-dark-text">
              {firstInnings.extras.wides} WD, {firstInnings.extras.noballs} NB, {firstInnings.extras.byes} B, {firstInnings.extras.legbyes} LB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-cricket-target dark:text-cricket-dark-text/60">
              {bowlingFirstTeam.name} (2nd):
            </span>
            <span className="text-cricket-score dark:text-cricket-dark-text">
              {secondInnings.extras.wides} WD, {secondInnings.extras.noballs} NB, {secondInnings.extras.byes} B, {secondInnings.extras.legbyes} LB
            </span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-full py-2.5 rounded-lg bg-cricket-primary dark:bg-cricket-dark-accent text-white text-sm font-medium hover:opacity-90"
      >
        ← Back to Tournament
      </button>
    </div>
  );
}
