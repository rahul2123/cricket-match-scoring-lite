import { supabase, getUserId } from './supabase';
import type { MatchState } from '../types';
import type {
  Tournament,
  Team,
  Player,
  TournamentMatch,
  InningsStats,
  TeamStandings,
  CreateTournamentInput,
  CreateTeamInput,
  CreatePlayerInput,
  CreateMatchInput,
  SaveInningsStatsInput,
} from '../types/tournament';
import { convertBallsToDecimalOvers } from './helpers';

// =============================================================================
// CODE GENERATION
// =============================================================================

const TOURNAMENT_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTournamentCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += TOURNAMENT_CODE_CHARS.charAt(Math.floor(Math.random() * TOURNAMENT_CODE_CHARS.length));
  }
  return code;
}

async function tournamentCodeExists(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('code')
    .eq('code', code)
    .single();

  return !error && data !== null;
}

async function generateUniqueTournamentCode(): Promise<string> {
  let code = generateTournamentCode();
  let attempts = 0;

  while (await tournamentCodeExists(code) && attempts < 10) {
    code = generateTournamentCode();
    attempts++;
  }

  if (attempts >= 10) {
    throw new Error('Failed to generate unique tournament code');
  }

  return code;
}

// =============================================================================
// TOURNAMENT CRUD
// =============================================================================

export async function createTournament(input: CreateTournamentInput): Promise<Tournament | null> {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const code = await generateUniqueTournamentCode();

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        code,
        name: input.name,
        overs_per_match: input.oversPerMatch ?? 20,
        points_win: input.pointsWin ?? 2,
        points_tie: input.pointsTie ?? 1,
        points_loss: input.pointsLoss ?? 0,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tournament:', error);
      return null;
    }

    // Add creator as admin
    await supabase
      .from('tournament_members')
      .insert({
        tournament_id: data.id,
        user_id: userId,
        role: 'admin',
      });

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      oversPerMatch: data.overs_per_match,
      pointsWin: data.points_win,
      pointsTie: data.points_tie,
      pointsLoss: data.points_loss,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in createTournament:', error);
    return null;
  }
}

export async function getTournament(code: string): Promise<Tournament | null> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      console.error('Error fetching tournament:', error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      oversPerMatch: data.overs_per_match,
      pointsWin: data.points_win,
      pointsTie: data.points_tie,
      pointsLoss: data.points_loss,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in getTournament:', error);
    return null;
  }
}

export async function getTournamentById(id: number): Promise<Tournament | null> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching tournament:', error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      oversPerMatch: data.overs_per_match,
      pointsWin: data.points_win,
      pointsTie: data.points_tie,
      pointsLoss: data.points_loss,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in getTournamentById:', error);
    return null;
  }
}

export async function getTournamentsByUser(userId: string): Promise<Tournament[]> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return [];
    }

    return (data || []).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      oversPerMatch: t.overs_per_match,
      pointsWin: t.points_win,
      pointsTie: t.points_tie,
      pointsLoss: t.points_loss,
      status: t.status,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  } catch (error) {
    console.error('Error in getTournamentsByUser:', error);
    return [];
  }
}

export async function updateTournamentStatus(id: number, status: Tournament['status']): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating tournament status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTournamentStatus:', error);
    return false;
  }
}

export async function deleteTournament(id: number): Promise<boolean> {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      console.error('Error deleting tournament:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTournament:', error);
    return false;
  }
}

// =============================================================================
// TEAM CRUD
// =============================================================================

export async function createTeam(input: CreateTeamInput): Promise<Team | null> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        tournament_id: input.tournamentId,
        name: input.name,
        short_name: input.shortName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentId: data.tournament_id,
      name: data.name,
      shortName: data.short_name,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in createTeam:', error);
    return null;
  }
}

export async function getTeamsByTournament(tournamentId: number): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('name');

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return (data || []).map((t) => ({
      id: t.id,
      tournamentId: t.tournament_id,
      name: t.name,
      shortName: t.short_name,
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error('Error in getTeamsByTournament:', error);
    return [];
  }
}

export async function updateTeam(id: number, name: string, shortName?: string): Promise<Team | null> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update({ name, short_name: shortName })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentId: data.tournament_id,
      name: data.name,
      shortName: data.short_name,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in updateTeam:', error);
    return null;
  }
}

export async function deleteTeam(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTeam:', error);
    return false;
  }
}

// =============================================================================
// PLAYER CRUD
// =============================================================================

export async function createPlayer(input: CreatePlayerInput): Promise<Player | null> {
  try {
    const { data, error } = await supabase
      .from('players')
      .insert({
        team_id: input.teamId,
        name: input.name,
        role: input.role ?? 'batsman',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating player:', error);
      return null;
    }

    return {
      id: data.id,
      teamId: data.team_id,
      name: data.name,
      role: data.role,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in createPlayer:', error);
    return null;
  }
}

export async function getPlayersByTeam(teamId: number): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name');

    if (error) {
      console.error('Error fetching players:', error);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      teamId: p.team_id,
      name: p.name,
      role: p.role,
      createdAt: p.created_at,
    }));
  } catch (error) {
    console.error('Error in getPlayersByTeam:', error);
    return [];
  }
}

export async function deletePlayer(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting player:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePlayer:', error);
    return false;
  }
}

// =============================================================================
// MATCH CRUD
// =============================================================================

async function getNextMatchNumber(tournamentId: number): Promise<number> {
  const { data, error } = await supabase
    .from('tournament_matches')
    .select('match_number')
    .eq('tournament_id', tournamentId)
    .order('match_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return 1;
  }

  return data.match_number + 1;
}

export async function createTournamentMatch(input: CreateMatchInput): Promise<TournamentMatch | null> {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get tournament for default overs
    const tournament = await getTournamentById(input.tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const matchNumber = await getNextMatchNumber(input.tournamentId);

    const { data, error } = await supabase
      .from('tournament_matches')
      .insert({
        tournament_id: input.tournamentId,
        team_a_id: input.teamAId,
        team_b_id: input.teamBId,
        match_number: matchNumber,
        scheduled_date: input.scheduledDate,
        overs: input.overs ?? tournament.oversPerMatch,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentId: data.tournament_id,
      teamAId: data.team_a_id,
      teamBId: data.team_b_id,
      matchNumber: data.match_number,
      scheduledDate: data.scheduled_date,
      overs: data.overs,
      status: data.status,
      winnerTeamId: data.winner_team_id,
      resultType: data.result_type,
      matchState: data.match_state,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in createTournamentMatch:', error);
    return null;
  }
}

export async function getMatchesByTournament(tournamentId: number): Promise<TournamentMatch[]> {
  try {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        team_a:teams!tournament_matches_team_a_id_fkey (*),
        team_b:teams!tournament_matches_team_b_id_fkey (*)
      `)
      .eq('tournament_id', tournamentId)
      .order('match_number');

    if (error) {
      console.error('Error fetching matches:', error);
      return [];
    }

    return (data || []).map((m) => ({
      id: m.id,
      tournamentId: m.tournament_id,
      teamAId: m.team_a_id,
      teamBId: m.team_b_id,
      teamA: m.team_a ? {
        id: m.team_a.id,
        tournamentId: m.team_a.tournament_id,
        name: m.team_a.name,
        shortName: m.team_a.short_name,
        createdAt: m.team_a.created_at,
      } : undefined,
      teamB: m.team_b ? {
        id: m.team_b.id,
        tournamentId: m.team_b.tournament_id,
        name: m.team_b.name,
        shortName: m.team_b.short_name,
        createdAt: m.team_b.created_at,
      } : undefined,
      matchNumber: m.match_number,
      scheduledDate: m.scheduled_date,
      overs: m.overs,
      status: m.status,
      winnerTeamId: m.winner_team_id,
      resultType: m.result_type,
      matchState: m.match_state,
      createdBy: m.created_by,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  } catch (error) {
    console.error('Error in getMatchesByTournament:', error);
    return [];
  }
}

export async function getMatchById(id: number): Promise<TournamentMatch | null> {
  try {
    const { data, error } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        team_a:teams!tournament_matches_team_a_id_fkey (*),
        team_b:teams!tournament_matches_team_b_id_fkey (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching match:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentId: data.tournament_id,
      teamAId: data.team_a_id,
      teamBId: data.team_b_id,
      teamA: data.team_a ? {
        id: data.team_a.id,
        tournamentId: data.team_a.tournament_id,
        name: data.team_a.name,
        shortName: data.team_a.short_name,
        createdAt: data.team_a.created_at,
      } : undefined,
      teamB: data.team_b ? {
        id: data.team_b.id,
        tournamentId: data.team_b.tournament_id,
        name: data.team_b.name,
        shortName: data.team_b.short_name,
        createdAt: data.team_b.created_at,
      } : undefined,
      matchNumber: data.match_number,
      scheduledDate: data.scheduled_date,
      overs: data.overs,
      status: data.status,
      winnerTeamId: data.winner_team_id,
      resultType: data.result_type,
      matchState: data.match_state,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in getMatchById:', error);
    return null;
  }
}

export async function updateTournamentMatch(
  id: number,
  updates: {
    status?: TournamentMatch['status'];
    winnerTeamId?: number | null;
    resultType?: TournamentMatch['resultType'];
    matchState?: MatchState;
  }
): Promise<TournamentMatch | null> {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.winnerTeamId !== undefined) updateData.winner_team_id = updates.winnerTeamId;
    if (updates.resultType !== undefined) updateData.result_type = updates.resultType;
    if (updates.matchState !== undefined) updateData.match_state = updates.matchState;

    const { data, error } = await supabase
      .from('tournament_matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating match:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentId: data.tournament_id,
      teamAId: data.team_a_id,
      teamBId: data.team_b_id,
      matchNumber: data.match_number,
      scheduledDate: data.scheduled_date,
      overs: data.overs,
      status: data.status,
      winnerTeamId: data.winner_team_id,
      resultType: data.result_type,
      matchState: data.match_state,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in updateTournamentMatch:', error);
    return null;
  }
}

// =============================================================================
// INNINGS STATS
// =============================================================================

export async function saveInningsStats(input: SaveInningsStatsInput): Promise<InningsStats | null> {
  try {
    const { data, error } = await supabase
      .from('innings_stats')
      .upsert({
        tournament_match_id: input.tournamentMatchId,
        team_id: input.teamId,
        inning_number: input.inningNumber,
        runs_scored: input.runsScored,
        overs_faced: input.oversFaced,
        wickets_lost: input.wicketsLost,
        is_all_out: input.isAllOut,
      }, {
        onConflict: 'tournament_match_id,team_id,inning_number',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving innings stats:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentMatchId: data.tournament_match_id,
      teamId: data.team_id,
      inningNumber: data.inning_number,
      runsScored: data.runs_scored,
      oversFaced: data.overs_faced,
      wicketsLost: data.wickets_lost,
      isAllOut: data.is_all_out,
    };
  } catch (error) {
    console.error('Error in saveInningsStats:', error);
    return null;
  }
}

export async function getInningsStatsByMatch(matchId: number): Promise<InningsStats[]> {
  try {
    const { data, error } = await supabase
      .from('innings_stats')
      .select('*')
      .eq('tournament_match_id', matchId);

    if (error) {
      console.error('Error fetching innings stats:', error);
      return [];
    }

    return (data || []).map((s) => ({
      id: s.id,
      tournamentMatchId: s.tournament_match_id,
      teamId: s.team_id,
      inningNumber: s.inning_number,
      runsScored: s.runs_scored,
      oversFaced: s.overs_faced,
      wicketsLost: s.wickets_lost,
      isAllOut: s.is_all_out,
    }));
  } catch (error) {
    console.error('Error in getInningsStatsByMatch:', error);
    return [];
  }
}

// =============================================================================
// STANDINGS
// =============================================================================

export async function getTournamentStandings(tournamentId: number): Promise<TeamStandings[]> {
  try {
    // Calculate standings client-side
    return calculateStandingsClientSide(tournamentId);
  } catch (error) {
    console.error('Error in getTournamentStandings:', error);
    return [];
  }
}

// Fallback client-side standings calculation
async function calculateStandingsClientSide(tournamentId: number): Promise<TeamStandings[]> {
  const [teams, matches] = await Promise.all([
    getTeamsByTournament(tournamentId),
    getMatchesByTournament(tournamentId),
  ]);

  const standingsMap = new Map<number, TeamStandings>();

  // Initialize standings for all teams
  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      nrr: 0,
    });
  }

  // Get tournament for points configuration
  const tournament = await getTournamentById(tournamentId);
  const pointsWin = tournament?.pointsWin ?? 2;
  const pointsTie = tournament?.pointsTie ?? 1;

  // Get all innings stats
  for (const match of matches) {
    if (match.status !== 'completed') continue;

    const inningsStats = await getInningsStatsByMatch(match.id);

    for (const stats of inningsStats) {
      const standing = standingsMap.get(stats.teamId);
      if (!standing) continue;

      // This team's batting stats
      standing.runsScored += stats.runsScored;
      standing.oversFaced += stats.oversFaced;

      // Find opponent's stats for bowling stats
      const opponentStats = inningsStats.find(
        (s) => s.tournamentMatchId === stats.tournamentMatchId && s.teamId !== stats.teamId
      );
      if (opponentStats) {
        standing.runsConceded += opponentStats.runsScored;
        standing.oversBowled += opponentStats.oversFaced;
      }
    }

    // Update win/loss/tie counts
    const teamAStanding = standingsMap.get(match.teamAId);
    const teamBStanding = standingsMap.get(match.teamBId);

    if (teamAStanding) teamAStanding.matchesPlayed++;
    if (teamBStanding) teamBStanding.matchesPlayed++;

    if (match.resultType === 'tie') {
      if (teamAStanding) {
        teamAStanding.ties++;
        teamAStanding.points += pointsTie;
      }
      if (teamBStanding) {
        teamBStanding.ties++;
        teamBStanding.points += pointsTie;
      }
    } else if (match.winnerTeamId) {
      const winnerStanding = standingsMap.get(match.winnerTeamId);
      const loserStanding = standingsMap.get(
        match.winnerTeamId === match.teamAId ? match.teamBId : match.teamAId
      );

      if (winnerStanding) {
        winnerStanding.wins++;
        winnerStanding.points += pointsWin;
      }
      if (loserStanding) {
        loserStanding.losses++;
      }
    } else if (match.resultType === 'no_result') {
      if (teamAStanding) teamAStanding.noResults++;
      if (teamBStanding) teamBStanding.noResults++;
    }
  }

  // Calculate NRR for each team
  for (const standing of standingsMap.values()) {
    if (standing.oversFaced > 0 && standing.oversBowled > 0) {
      standing.nrr = (standing.runsScored / standing.oversFaced) -
                     (standing.runsConceded / standing.oversBowled);
    }
  }

  // Sort by points, then NRR, then runs scored
  return Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    return b.runsScored - a.runsScored;
  });
}

// =============================================================================
// REAL-TIME SUBSCRIPTIONS
// =============================================================================

export function subscribeToTournament(
  tournamentId: number,
  onUpdate: () => void
): () => void {
  const channel = supabase
    .channel(`tournament:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'innings_stats',
      },
      (payload) => {
        // Only update if the match belongs to this tournament
        if (payload.new && 'tournament_match_id' in payload.new) {
          onUpdate();
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Subscription error for tournament:', tournamentId);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// =============================================================================
// MATCH COMPLETION HELPER
// =============================================================================

export async function completeTournamentMatch(
  matchId: number,
  matchState: MatchState,
  teamAId: number,
  teamBId: number,
  oversPerMatch: number
): Promise<boolean> {
  try {
    // Calculate innings stats
    const firstInnings = matchState.innings.first;
    const secondInnings = matchState.innings.second;

    // Determine winner
    let winnerTeamId: number | null = null;
    let resultType: 'win' | 'tie' | 'no_result' = 'win';

    if (matchState.winner === 'batting') {
      // Second batting team won (team batting second chased the target)
      winnerTeamId = teamBId; // Assuming team B bats second
    } else if (matchState.winner === 'bowling') {
      // First batting team won (defended their score)
      winnerTeamId = teamAId;
    } else if (matchState.isMatchOver && firstInnings.runs === secondInnings.runs) {
      resultType = 'tie';
    }

    // Calculate overs faced (convert balls to decimal)
    const firstInningsOvers = firstInnings.wickets >= 10
      ? oversPerMatch // All out = full quota
      : convertBallsToDecimalOvers(firstInnings.balls);

    const secondInningsOvers = secondInnings.wickets >= 10
      ? oversPerMatch
      : convertBallsToDecimalOvers(secondInnings.balls);

    // Save innings stats
    await saveInningsStats({
      tournamentMatchId: matchId,
      teamId: teamAId,
      inningNumber: 1,
      runsScored: firstInnings.runs,
      oversFaced: firstInningsOvers,
      wicketsLost: firstInnings.wickets,
      isAllOut: firstInnings.wickets >= 10,
    });

    await saveInningsStats({
      tournamentMatchId: matchId,
      teamId: teamBId,
      inningNumber: 2,
      runsScored: secondInnings.runs,
      oversFaced: secondInningsOvers,
      wicketsLost: secondInnings.wickets,
      isAllOut: secondInnings.wickets >= 10,
    });

    // Update match status
    await updateTournamentMatch(matchId, {
      status: 'completed',
      winnerTeamId,
      resultType,
      matchState,
    });

    return true;
  } catch (error) {
    console.error('Error completing match:', error);
    return false;
  }
}
