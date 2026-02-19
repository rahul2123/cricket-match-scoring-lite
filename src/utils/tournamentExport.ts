import type { TeamStandings, TournamentMatch, Team } from '../types/tournament';
import { formatNRR } from './helpers';

/**
 * Export tournament standings to CSV
 */
export function exportStandingsToCSV(
  standings: TeamStandings[],
  _tournamentName: string
): string {
  const headers = [
    'Position',
    'Team',
    'Played',
    'Won',
    'Lost',
    'Tied',
    'N/R',
    'Points',
    'NRR',
  ];

  const rows = standings.map((team, index) => [
    (index + 1).toString(),
    team.teamName,
    team.matchesPlayed.toString(),
    team.wins.toString(),
    team.losses.toString(),
    team.ties.toString(),
    team.noResults.toString(),
    team.points.toString(),
    formatNRR(team.nrr),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export match results to CSV
 */
export function exportMatchesToCSV(
  matches: TournamentMatch[],
  teams: Team[]
): string {
  const headers = [
    'Match #',
    'Team A',
    'Team B',
    'Status',
    'Result',
    'Winner',
  ];

  const getTeamName = (teamId: number): string => {
    return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
  };

  const getResultText = (match: TournamentMatch): string => {
    if (match.status !== 'completed') return '-';
    if (match.resultType === 'tie') return 'Tie';
    if (match.resultType === 'no_result') return 'No Result';
    return 'Win';
  };

  const getWinnerText = (match: TournamentMatch): string => {
    if (match.status !== 'completed') return '-';
    if (match.resultType === 'tie') return '-';
    if (!match.winnerTeamId) return '-';
    return getTeamName(match.winnerTeamId);
  };

  const rows = matches.map((match) => [
    `Match ${match.matchNumber}`,
    getTeamName(match.teamAId),
    getTeamName(match.teamBId),
    match.status.charAt(0).toUpperCase() + match.status.slice(1),
    getResultText(match),
    getWinnerText(match),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download standings as CSV
 */
export function downloadStandingsCSV(
  standings: TeamStandings[],
  tournamentName: string
): void {
  const csv = exportStandingsToCSV(standings, tournamentName);
  const filename = `${tournamentName.replace(/[^a-z0-9]/gi, '_')}_standings.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Download match results as CSV
 */
export function downloadMatchesCSV(
  matches: TournamentMatch[],
  teams: Team[],
  tournamentName: string
): void {
  const csv = exportMatchesToCSV(matches, teams);
  const filename = `${tournamentName.replace(/[^a-z0-9]/gi, '_')}_matches.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export full tournament report as CSV (combined)
 */
export function exportFullReportCSV(
  standings: TeamStandings[],
  matches: TournamentMatch[],
  teams: Team[],
  tournamentName: string
): string {
  const standingsCSV = exportStandingsToCSV(standings, tournamentName);
  const matchesCSV = exportMatchesToCSV(matches, teams);

  return `POINTER TABLE\n${standingsCSV}\n\nMATCH RESULTS\n${matchesCSV}`;
}

/**
 * Download full tournament report
 */
export function downloadFullReportCSV(
  standings: TeamStandings[],
  matches: TournamentMatch[],
  teams: Team[],
  tournamentName: string
): void {
  const csv = exportFullReportCSV(standings, matches, teams, tournamentName);
  const filename = `${tournamentName.replace(/[^a-z0-9]/gi, '_')}_report.csv`;
  downloadFile(csv, filename, 'text/csv');
}
