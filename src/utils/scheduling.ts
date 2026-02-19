import type { Team } from '../types/tournament';

export interface MatchPair {
  teamAId: number;
  teamBId: number;
  matchNumber: number;
  round?: number;
  position?: number;
}

/**
 * Generate round robin matches using the circle method
 * Each team plays every other team exactly once
 *
 * For N teams: N * (N-1) / 2 total matches
 */
export function generateRoundRobinMatches(teams: Team[]): MatchPair[] {
  const matches: MatchPair[] = [];

  if (teams.length < 2) {
    return matches;
  }

  // For each unique pair of teams, create a match
  let matchNumber = 1;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        teamAId: teams[i].id,
        teamBId: teams[j].id,
        matchNumber: matchNumber++,
      });
    }
  }

  return matches;
}

/**
 * Calculate total number of matches for round robin
 */
export function calculateRoundRobinMatchCount(teamCount: number): number {
  return (teamCount * (teamCount - 1)) / 2;
}

/**
 * Generate knockout bracket matches
 * Supports power-of-2 team counts (2, 4, 8, 16)
 * For other counts, creates a bracket with byes
 */
export function generateKnockoutMatches(teams: Team[]): MatchPair[] {
  const matches: MatchPair[] = [];

  if (teams.length < 2) {
    return matches;
  }

  // Find next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const byeCount = nextPowerOf2 - teams.length;

  // Calculate number of rounds
  const rounds = Math.log2(nextPowerOf2);
  let matchNumber = 1;

  // First round: seed teams with byes
  // Top seeds get byes
  const seededTeams = [...teams];
  const teamsPlaying = seededTeams.slice(byeCount);

  // First round matches (only teams that need to play)
  const firstRoundMatchCount = (nextPowerOf2 - byeCount) / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    matches.push({
      teamAId: teamsPlaying[i * 2]?.id ?? 0,
      teamBId: teamsPlaying[i * 2 + 1]?.id ?? 0,
      matchNumber: matchNumber++,
      round: 1,
      position: i,
    });
  }

  // Subsequent rounds (placeholder matches - actual teams determined after results)
  for (let round = 2; round <= rounds; round++) {
    const roundMatchCount = Math.pow(2, rounds - round);
    for (let i = 0; i < roundMatchCount; i++) {
      matches.push({
        teamAId: 0, // TBD
        teamBId: 0, // TBD
        matchNumber: matchNumber++,
        round,
        position: i,
      });
    }
  }

  return matches;
}

/**
 * Calculate total number of matches for knockout
 */
export function calculateKnockoutMatchCount(teamCount: number): number {
  return teamCount - 1; // N-1 matches for single elimination
}

/**
 * Calculate number of rounds for knockout
 */
export function calculateKnockoutRounds(teamCount: number): number {
  return Math.ceil(Math.log2(teamCount));
}

/**
 * Format match count description
 */
export function formatMatchCount(teamCount: number, format: 'round_robin' | 'knockout' = 'round_robin'): string {
  const matchCount = format === 'knockout'
    ? calculateKnockoutMatchCount(teamCount)
    : calculateRoundRobinMatchCount(teamCount);
  return `${matchCount} match${matchCount !== 1 ? 'es' : ''}`;
}

/**
 * Check if team count is valid for knockout (power of 2)
 */
export function isValidKnockoutTeamCount(teamCount: number): boolean {
  return teamCount >= 2 && (teamCount & (teamCount - 1)) === 0;
}

/**
 * Get suggested team counts for knockout
 */
export function getValidKnockoutTeamCounts(): number[] {
  return [2, 4, 8, 16];
}
