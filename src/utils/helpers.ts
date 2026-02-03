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
export function getBallLabel(type: string, runs: number, isRunOut?: boolean): string {
  switch (type) {
    case 'wicket':
      // Wicket with runs (e.g., caught attempting second run)
      return runs > 0 ? `W${runs}` : 'W';
    case 'wide':
      return 'WD';
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
export function getBallClass(type: string, runs: number): string {
  const baseClass = 'inline-flex items-center justify-center min-w-7 h-7 px-1 rounded-full text-xs font-semibold';
  switch (type) {
    case 'wicket':
      return `${baseClass} bg-amber-500/25 text-amber-400 border border-amber-500/40`;
    case 'wide':
      return `${baseClass} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    case 'noball':
      return `${baseClass} bg-red-500/20 text-red-400 border border-red-500/30`;
    case 'bye':
    case 'legbye':
      return `${baseClass} bg-violet-500/20 text-violet-400 border border-violet-500/30`;
    case 'run':
    default:
      if (runs === 4) return `${baseClass} bg-sky-500/20 text-sky-400 border border-sky-500/30`;
      if (runs === 6) return `${baseClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`;
      return `${baseClass} bg-slate-700/50 text-slate-300 border border-slate-600/30`;
  }
}
