/**
 * Generate a unique ID for ball entries
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format balls into overs string (e.g., "4.3" for 27 balls)
 */
export function formatOvers(balls: number): string {
  const overs = Math.floor(balls / 6);
  const ballsInOver = balls % 6;
  return `${overs}.${ballsInOver}`;
}

/**
 * Calculate current run rate
 * CRR = runs / (balls / 6)
 */
export function calculateCRR(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return runs / (balls / 6);
}

/**
 * Calculate required run rate
 * RRR = runs_required / (balls_remaining / 6)
 */
export function calculateRRR(runsRequired: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return Infinity;
  return runsRequired / (ballsRemaining / 6);
}

/**
 * Format rate to 2 decimal places
 */
export function formatRate(rate: number): string {
  if (!isFinite(rate)) return '∞';
  return rate.toFixed(2);
}

/**
 * Get display label for ball type
 */
export function getBallLabel(type: string, runs: number, isRunOut?: boolean, isWicket?: boolean): string {
  switch (type) {
    case 'wicket':
      // Wicket with runs (e.g., caught attempting second run)
      return runs > 0 ? `W${runs}` : 'W';
    case 'wide':
      return isWicket ? 'WD+W' : 'WD';
    case 'noball':
      // No-ball: runs includes 1 penalty + scored runs
      // Show as NB+X where X is the runs scored (total - 1 penalty)
      const scoredRuns = runs - 1;
      if (isRunOut) {
        return scoredRuns > 0 ? `NB${scoredRuns}†` : 'NB†';
      }
      return scoredRuns > 0 ? `NB${scoredRuns}` : 'NB';
    case 'bye':
      return `B${runs}`;
    case 'legbye':
      return `LB${runs}`;
    case 'run':
    default:
      return runs.toString();
  }
}

/**
 * Get CSS class for ball type styling
 */
/* Scoring logic colors: runs = black, wicket = muted red, extras = mustard. No neon, no colored bg for every number. */
export function getBallClass(type: string, _runs: number): string {
  const baseClass = 'inline-flex items-center justify-center min-w-7 h-7 px-1 rounded-full text-xs font-semibold tabular-nums';
  switch (type) {
    case 'wicket':
      return `${baseClass} bg-cricket-wicket/15 text-cricket-wicket border border-cricket-wicket/40`;
    case 'wide':
    case 'noball':
    case 'bye':
    case 'legbye':
      return `${baseClass} bg-cricket-extras/15 text-cricket-extras border border-cricket-extras/30`;
    case 'run':
    default:
      return `${baseClass} bg-cricket-target/15 dark:bg-white/10 text-cricket-score dark:text-cricket-dark-text border border-cricket-target/25 dark:border-white/15`;
  }
}

// =============================================================================
// TOURNAMENT/NRR HELPERS
// =============================================================================

/**
 * Convert balls to decimal overs for NRR calculation
 * This returns actual decimal overs (balls / 6), not cricket notation
 * e.g., 27 balls -> 4.5 overs, 117 balls -> 19.5 overs
 *
 * Note: For display purposes, use formatOvers() which shows cricket notation (e.g., "4.3")
 */
export function convertBallsToDecimalOvers(balls: number): number {
  return balls / 6;
}

/**
 * Convert decimal overs back to balls
 * e.g., 4.5 -> 27 balls, 19.5 -> 117 balls
 */
export function convertDecimalOversToBalls(decimalOvers: number): number {
  return Math.round(decimalOvers * 6);
}

/**
 * Format decimal overs to cricket notation for display
 * e.g., 4.5 -> "4.3" (4 overs, 3 balls), 19.5 -> "19.3" (19 overs, 3 balls)
 */
export function formatDecimalOversToCricket(decimalOvers: number): string {
  const totalBalls = Math.round(decimalOvers * 6);
  return formatOvers(totalBalls);
}

/**
 * Calculate Net Run Rate (NRR)
 * NRR = (Average runs scored per over) - (Average runs conceded per over)
 */
export function calculateNRR(
  runsScored: number,
  oversFaced: number,
  runsConceded: number,
  oversBowled: number
): number {
  if (oversFaced === 0 || oversBowled === 0) return 0;

  const runRateScored = runsScored / oversFaced;
  const runRateConceded = runsConceded / oversBowled;

  return runRateScored - runRateConceded;
}

/**
 * Calculate batting strike rate
 * Strike Rate = (runs / balls) * 100
 */
export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return (runs / balls) * 100;
}

/**
 * Calculate bowling economy rate
 * Economy = runs / overs
 */
export function calculateEconomy(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return runs / overs;
}

/**
 * Calculate batting average
 * Average = runs / (innings - notOuts)
 */
export function calculateBattingAverage(runs: number, innings: number, notOuts: number): number {
  const outs = innings - notOuts;
  if (outs === 0) return runs; // Not out always
  return runs / outs;
}

/**
 * Calculate bowling average
 * Average = runs / wickets
 */
export function calculateBowlingAverage(runs: number, wickets: number): number {
  if (wickets === 0) return 0;
  return runs / wickets;
}

/**
 * Format NRR to 3 decimal places with + or - sign
 */
export function formatNRR(nrr: number): string {
  const formatted = Math.abs(nrr).toFixed(3);
  if (nrr > 0) return `+${formatted}`;
  if (nrr < 0) return `-${formatted}`;
  return formatted;
}
