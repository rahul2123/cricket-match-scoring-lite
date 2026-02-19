/**
 * Duckworth-Lewis-Stern (DLS) Method Calculator
 *
 * Simplified implementation using Standard Edition resources
 * Based on ICC DLS Standard Edition 2014
 */

/**
 * DLS resource table (simplified)
 * Resources remaining for each combination of overs and wickets
 * Format: resources[overs][wickets] = percentage
 *
 * Note: This is a simplified table. Full DLS uses more precise calculations.
 */
const DLS_RESOURCE_TABLE: Record<number, number[]> = {
  50: [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9, 4.7, 0],
  45: [97.1, 91.2, 83.8, 74.4, 62.5, 49.0, 34.9, 22.0, 11.9, 4.7, 0],
  40: [93.4, 88.3, 81.8, 73.2, 62.0, 48.9, 34.9, 22.0, 11.9, 4.7, 0],
  35: [88.5, 84.0, 78.6, 71.0, 60.8, 48.6, 34.8, 22.0, 11.9, 4.7, 0],
  30: [82.7, 78.9, 74.4, 68.1, 58.9, 47.6, 34.6, 22.0, 11.9, 4.7, 0],
  25: [75.8, 72.6, 68.9, 63.9, 56.0, 46.1, 34.2, 22.0, 11.9, 4.7, 0],
  20: [67.3, 64.9, 62.0, 58.2, 52.0, 44.0, 33.2, 21.8, 11.9, 4.7, 0],
  15: [56.1, 54.4, 52.4, 49.9, 45.9, 40.0, 31.4, 21.3, 11.8, 4.7, 0],
  10: [42.4, 41.3, 40.0, 38.6, 36.4, 33.0, 27.7, 20.0, 11.5, 4.7, 0],
  9: [39.1, 38.1, 37.0, 35.7, 33.8, 30.9, 26.2, 19.2, 11.3, 4.6, 0],
  8: [35.5, 34.6, 33.7, 32.6, 31.0, 28.5, 24.4, 18.2, 10.9, 4.5, 0],
  7: [31.5, 30.8, 30.0, 29.1, 27.8, 25.8, 22.4, 17.0, 10.4, 4.4, 0],
  6: [27.2, 26.6, 26.0, 25.3, 24.3, 22.8, 20.1, 15.5, 9.7, 4.2, 0],
  5: [22.6, 22.1, 21.7, 21.2, 20.4, 19.3, 17.3, 13.7, 8.8, 3.9, 0],
  4: [17.9, 17.5, 17.2, 16.8, 16.3, 15.5, 14.1, 11.4, 7.6, 3.5, 0],
  3: [13.1, 12.9, 12.6, 12.4, 12.0, 11.5, 10.6, 8.8, 6.1, 2.9, 0],
  2: [8.4, 8.2, 8.1, 7.9, 7.7, 7.4, 6.9, 5.9, 4.3, 2.2, 0],
  1: [3.9, 3.8, 3.8, 3.7, 3.6, 3.5, 3.3, 2.8, 2.1, 1.1, 0],
};

/**
 * Interpolate resource value for overs not in table
 */
function interpolateResource(overs: number, wickets: number): number {
  const oversFloor = Math.floor(overs);
  const oversCeil = Math.ceil(overs);

  if (oversFloor === oversCeil) {
    return DLS_RESOURCE_TABLE[oversFloor]?.[wickets] ?? 0;
  }

  const resourceFloor = DLS_RESOURCE_TABLE[oversFloor]?.[wickets] ?? 0;
  const resourceCeil = DLS_RESOURCE_TABLE[oversCeil]?.[wickets] ?? 0;

  const fraction = overs - oversFloor;
  return resourceFloor + (resourceCeil - resourceFloor) * fraction;
}

/**
 * Get resources remaining for a team
 * @param oversRemaining Number of overs remaining
 * @param wicketsLost Number of wickets lost (0-10)
 * @returns Resource percentage (0-100)
 */
export function getResourcesRemaining(oversRemaining: number, wicketsLost: number): number {
  if (oversRemaining <= 0) return 0;
  if (wicketsLost >= 10) return 0;
  if (oversRemaining > 50) oversRemaining = 50;

  return interpolateResource(Math.round(oversRemaining * 10) / 10, wicketsLost);
}

/**
 * Calculate DLS target for Team 2
 *
 * @param team1Runs Runs scored by Team 1
 * @param team1Overs Overs allocated to Team 1
 * @param team1AllOut Whether Team 1 was all out
 * @param team2AllocatedOvers Overs allocated to Team 2
 * @param team2OversLost Overs lost by Team 2 due to rain
 * @returns DLS par score and target for Team 2
 */
export function calculateDLSTarget(
  team1Runs: number,
  team1Overs: number,
  team1AllOut: boolean,
  team2AllocatedOvers: number,
  team2OversLost: number
): { parScore: number; target: number; resourcesTeam1: number; resourcesTeam2: number } {
  // Team 1's resources
  const team1Resources = team1AllOut
    ? 100 // All out = used 100% resources regardless of overs
    : getResourcesRemaining(team1Overs, 0);

  // Team 2's available overs after rain
  const team2AvailableOvers = Math.max(0, team2AllocatedOvers - team2OversLost);

  // Team 2's resources (assuming 0 wickets lost at interruption)
  const team2Resources = getResourcesRemaining(team2AvailableOvers, 0);

  // Resource ratio
  const resourceRatio = team2Resources / team1Resources;

  // Calculate par score
  // G50 is the average score in 50 overs (typically 245 for ODIs, lower for T20s)
  // Simplified: use straight ratio for amateur cricket
  const parScore = Math.floor(team1Runs * resourceRatio);

  // Target is par + 1
  const target = parScore + 1;

  return {
    parScore,
    target,
    resourcesTeam1: Math.round(team1Resources * 100) / 100,
    resourcesTeam2: Math.round(team2Resources * 100) / 100,
  };
}

/**
 * Calculate DLS target for mid-innings interruption
 * (When play resumes after Team 2 has started batting)
 *
 * @param team1Runs Runs scored by Team 1
 * @param team1Overs Total overs for Team 1
 * @param team2CurrentScore Current score of Team 2
 * @param team2Wickets Wickets lost by Team 2
 * @param team2BallsFaced Balls faced by Team 2 before interruption
 * @param team2TotalOvers Original overs for Team 2
 * @param team2ReducedOvers New reduced overs for Team 2
 */
export function calculateDLSMidInnings(
  team1Runs: number,
  _team1Overs: number,
  _team2CurrentScore: number,
  team2Wickets: number,
  team2BallsFaced: number,
  team2TotalOvers: number,
  team2ReducedOvers: number
): { revisedTarget: number; parScoreAtInterruption: number } {
  // Resources at start of innings
  const resourcesAtStart = getResourcesRemaining(team2TotalOvers, 0);

  // Resources remaining after interruption (with wickets lost)
  const remainingOvers = team2ReducedOvers - (team2BallsFaced / 6);
  // Note: In a full implementation, resourcesRemaining would be used to calculate
  // the par score based on current wickets lost
  void getResourcesRemaining(remainingOvers, team2Wickets);

  // Resources lost
  const resourcesLost = getResourcesRemaining(team2TotalOvers - team2ReducedOvers, 0);

  // Total resources available to Team 2
  const totalResourcesTeam2 = resourcesAtStart - resourcesLost;

  // Par score
  const parScore = Math.floor(team1Runs * (totalResourcesTeam2 / 100));

  // Revised target (accounting for runs already scored)
  const revisedTarget = parScore + 1;

  return {
    revisedTarget,
    parScoreAtInterruption: parScore,
  };
}

/**
 * Format overs for display (e.g., "20 overs" or "15 overs")
 */
export function formatOversForDisplay(overs: number): string {
  return `${overs} ${overs === 1 ? 'over' : 'overs'}`;
}

/**
 * Get minimum overs required for a valid match
 * Different formats have different minimums
 */
export function getMinimumOvers(format: 't20' | 'odi' | 'custom'): number {
  switch (format) {
    case 't20':
      return 5; // Minimum 5 overs per side for T20
    case 'odi':
      return 20; // Minimum 20 overs per side for ODI
    default:
      return 5; // Default minimum
  }
}
