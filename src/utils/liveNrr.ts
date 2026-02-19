import type { TeamStandings } from '../types/tournament';

interface CurrentMatchStats {
  runsScored: number;
  ballsFaced: number;
  runsConceded: number;
  ballsBowled: number;
}

/**
 * Calculate live tournament NRR by combining current match stats with existing standings
 */
export function calculateLiveNRR(
  existingStandings: TeamStandings | undefined,
  currentMatchStats: CurrentMatchStats
): number {
  // If no existing standings, calculate from current match only
  if (!existingStandings) {
    if (currentMatchStats.ballsFaced === 0 || currentMatchStats.ballsBowled === 0) {
      return 0;
    }
    const oversFaced = currentMatchStats.ballsFaced / 6;
    const oversBowled = currentMatchStats.ballsBowled / 6;
    return (currentMatchStats.runsScored / oversFaced) - (currentMatchStats.runsConceded / oversBowled);
  }

  // Combine existing stats with current match
  const totalRunsScored = existingStandings.runsScored + currentMatchStats.runsScored;
  const totalBallsFaced = existingStandings.ballsFaced + currentMatchStats.ballsFaced;
  const totalRunsConceded = existingStandings.runsConceded + currentMatchStats.runsConceded;
  const totalBallsBowled = existingStandings.ballsBowled + currentMatchStats.ballsBowled;

  if (totalBallsFaced === 0 || totalBallsBowled === 0) {
    return existingStandings.nrr;
  }

  const oversFaced = totalBallsFaced / 6;
  const oversBowled = totalBallsBowled / 6;

  return (totalRunsScored / oversFaced) - (totalRunsConceded / oversBowled);
}

/**
 * Format NRR for display with +/- sign
 */
export function formatLiveNRR(nrr: number): string {
  const formatted = Math.abs(nrr).toFixed(3);
  if (nrr > 0) return `+${formatted}`;
  if (nrr < 0) return `-${formatted}`;
  return formatted;
}
