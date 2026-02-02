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
export function getBallLabel(type: string, runs: number): string {
  switch (type) {
    case 'wide':
      return 'WD';
    case 'noball':
      return 'NB';
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
  const baseClass = 'inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold';
  
  switch (type) {
    case 'wide':
      return `${baseClass} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    case 'noball':
      return `${baseClass} bg-red-500/20 text-red-400 border border-red-500/30`;
    case 'bye':
    case 'legbye':
      return `${baseClass} bg-purple-500/20 text-purple-400 border border-purple-500/30`;
    case 'run':
    default:
      if (runs === 4) {
        return `${baseClass} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      }
      if (runs === 6) {
        return `${baseClass} bg-green-500/20 text-green-400 border border-green-500/30`;
      }
      return `${baseClass} bg-slate-700/50 text-slate-300 border border-slate-600/30`;
  }
}
