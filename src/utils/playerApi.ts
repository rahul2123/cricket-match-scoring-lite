import { supabase, getUserId } from './supabase';
import type { PlayerProfile, TeamPlayer, PlayerCareerStats, PlayerBattingStats, PlayerBowlingStats } from '../types/tournament';

// =============================================================================
// PLAYER PROFILE CRUD
// =============================================================================

export interface CreateProfileInput {
  name: string;
}

export async function createProfile(input: CreateProfileInput): Promise<PlayerProfile | null> {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('player_profiles')
      .insert({
        name: input.name,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in createProfile:', error);
    return null;
  }
}

export async function searchProfiles(query: string, limit: number = 10): Promise<PlayerProfile[]> {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(limit);

    if (error) {
      console.error('Error searching profiles:', error);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      createdBy: p.created_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (error) {
    console.error('Error in searchProfiles:', error);
    return [];
  }
}

export async function getProfile(id: number): Promise<PlayerProfile | null> {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

// =============================================================================
// TEAM PLAYER CRUD
// =============================================================================

export interface AddPlayerToTeamInput {
  teamId: number;
  profileId: number;
  role?: 'batsman' | 'bowler' | 'all-rounder';
}

export async function addPlayerToTeam(input: AddPlayerToTeamInput): Promise<TeamPlayer | null> {
  try {
    const { data, error } = await supabase
      .from('team_players')
      .insert({
        team_id: input.teamId,
        profile_id: input.profileId,
        role: input.role ?? 'batsman',
      })
      .select('*, profile:player_profiles(*)')
      .single();

    if (error) {
      console.error('Error adding player to team:', error);
      return null;
    }

    return {
      id: data.id,
      teamId: data.team_id,
      profileId: data.profile_id,
      role: data.role,
      profile: data.profile ? {
        id: data.profile.id,
        name: data.profile.name,
        createdBy: data.profile.created_by,
        createdAt: data.profile.created_at,
        updatedAt: data.profile.updated_at,
      } : undefined,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in addPlayerToTeam:', error);
    return null;
  }
}

export async function getTeamPlayers(teamId: number): Promise<TeamPlayer[]> {
  try {
    const { data, error } = await supabase
      .from('team_players')
      .select('*, profile:player_profiles(*)')
      .eq('team_id', teamId)
      .order('role')
      .order('created_at');

    if (error) {
      console.error('Error fetching team players:', error);
      return [];
    }

    return (data || []).map((tp) => ({
      id: tp.id,
      teamId: tp.team_id,
      profileId: tp.profile_id,
      role: tp.role,
      profile: tp.profile ? {
        id: tp.profile.id,
        name: tp.profile.name,
        createdBy: tp.profile.created_by,
        createdAt: tp.profile.created_at,
        updatedAt: tp.profile.updated_at,
      } : undefined,
      createdAt: tp.created_at,
    }));
  } catch (error) {
    console.error('Error in getTeamPlayers:', error);
    return [];
  }
}

export async function removePlayerFromTeam(teamPlayerId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('team_players')
      .delete()
      .eq('id', teamPlayerId);

    if (error) {
      console.error('Error removing player from team:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removePlayerFromTeam:', error);
    return false;
  }
}

// =============================================================================
// PLAYER STATS
// =============================================================================

export interface SaveBattingStatsInput {
  tournamentMatchId: number;
  profileId: number;
  teamId: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  bowlerProfileId?: number;
  fielderProfileId?: number;
}

export async function saveBattingStats(input: SaveBattingStatsInput): Promise<PlayerBattingStats | null> {
  try {
    const { data, error } = await supabase
      .from('player_batting_stats')
      .upsert({
        tournament_match_id: input.tournamentMatchId,
        profile_id: input.profileId,
        team_id: input.teamId,
        runs: input.runs,
        balls: input.balls,
        fours: input.fours,
        sixes: input.sixes,
        is_out: input.isOut,
        dismissal_type: input.dismissalType,
        bowler_profile_id: input.bowlerProfileId,
        fielder_profile_id: input.fielderProfileId,
      }, {
        onConflict: 'tournament_match_id,profile_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving batting stats:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentMatchId: data.tournament_match_id,
      profileId: data.profile_id,
      teamId: data.team_id,
      runs: data.runs,
      balls: data.balls,
      fours: data.fours,
      sixes: data.sixes,
      isOut: data.is_out,
      dismissalType: data.dismissal_type,
      bowlerProfileId: data.bowler_profile_id,
      fielderProfileId: data.fielder_profile_id,
    };
  } catch (error) {
    console.error('Error in saveBattingStats:', error);
    return null;
  }
}

export interface SaveBowlingStatsInput {
  tournamentMatchId: number;
  profileId: number;
  teamId: number;
  balls: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
}

export async function saveBowlingStats(input: SaveBowlingStatsInput): Promise<PlayerBowlingStats | null> {
  try {
    const { data, error } = await supabase
      .from('player_bowling_stats')
      .upsert({
        tournament_match_id: input.tournamentMatchId,
        profile_id: input.profileId,
        team_id: input.teamId,
        overs: input.balls, // Store as balls in overs column
        runs_conceded: input.runsConceded,
        wickets: input.wickets,
        maidens: input.maidens,
        wides: input.wides,
        no_balls: input.noBalls,
      }, {
        onConflict: 'tournament_match_id,profile_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving bowling stats:', error);
      return null;
    }

    return {
      id: data.id,
      tournamentMatchId: data.tournament_match_id,
      profileId: data.profile_id,
      teamId: data.team_id,
      overs: data.overs,
      runsConceded: data.runs_conceded,
      wickets: data.wickets,
      maidens: data.maidens,
      wides: data.wides,
      noBalls: data.no_balls,
    };
  } catch (error) {
    console.error('Error in saveBowlingStats:', error);
    return null;
  }
}

// =============================================================================
// CAREER STATS
// =============================================================================

export async function getPlayerCareerStats(profileId: number): Promise<PlayerCareerStats | null> {
  try {
    // Get batting stats
    const { data: battingData, error: battingError } = await supabase
      .from('player_batting_stats')
      .select('*')
      .eq('profile_id', profileId);

    if (battingError) {
      console.error('Error fetching batting stats:', battingError);
      return null;
    }

    // Get bowling stats
    const { data: bowlingData, error: bowlingError } = await supabase
      .from('player_bowling_stats')
      .select('*')
      .eq('profile_id', profileId);

    if (bowlingError) {
      console.error('Error fetching bowling stats:', bowlingError);
      return null;
    }

    // Get profile info
    const profile = await getProfile(profileId);
    if (!profile) return null;

    // Calculate batting stats
    const battingInnings = battingData?.length || 0;
    const totalRuns = battingData?.reduce((sum, b) => sum + (b.runs || 0), 0) || 0;
    const totalBalls = battingData?.reduce((sum, b) => sum + (b.balls || 0), 0) || 0;
    const fours = battingData?.reduce((sum, b) => sum + (b.fours || 0), 0) || 0;
    const sixes = battingData?.reduce((sum, b) => sum + (b.sixes || 0), 0) || 0;
    const outs = battingData?.filter((b) => b.is_out).length || 0;
    const notOuts = battingInnings - outs;
    const highestScore = Math.max(...(battingData?.map((b) => b.runs || 0) || [0]));
    const fifties = battingData?.filter((b) => (b.runs || 0) >= 50 && (b.runs || 0) < 100).length || 0;
    const hundreds = battingData?.filter((b) => (b.runs || 0) >= 100).length || 0;

    // Calculate bowling stats
    const bowlingInnings = bowlingData?.length || 0;
    const totalBallsBowled = bowlingData?.reduce((sum, b) => sum + (b.overs || 0), 0) || 0;
    const runsConceded = bowlingData?.reduce((sum, b) => sum + (b.runs_conceded || 0), 0) || 0;
    const wickets = bowlingData?.reduce((sum, b) => sum + (b.wickets || 0), 0) || 0;
    const maidens = bowlingData?.reduce((sum, b) => sum + (b.maidens || 0), 0) || 0;
    const bestFigures = bowlingData?.reduce(
      (best, b) => {
        if ((b.wickets || 0) > best.wickets || ((b.wickets || 0) === best.wickets && (b.runs_conceded || 0) < best.runs)) {
          return { wickets: b.wickets || 0, runs: b.runs_conceded || 0 };
        }
        return best;
      },
      { wickets: 0, runs: Infinity }
    ) || { wickets: 0, runs: 0 };
    const fiveWicketHauls = bowlingData?.filter((b) => (b.wickets || 0) >= 5).length || 0;

    // Get unique teams played for
    const teamIds = new Set([
      ...(battingData?.map((b) => b.team_id) || []),
      ...(bowlingData?.map((b) => b.team_id) || []),
    ]);

    // Get team names
    let teamsPlayedFor: string[] = [];
    if (teamIds.size > 0) {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('name')
        .in('id', Array.from(teamIds));
      teamsPlayedFor = teamsData?.map((t) => t.name) || [];
    }

    // Get unique tournaments
    const matchIds = new Set([
      ...(battingData?.map((b) => b.tournament_match_id) || []),
      ...(bowlingData?.map((b) => b.tournament_match_id) || []),
    ]);

    let tournamentsPlayed = 0;
    if (matchIds.size > 0) {
      const { data: matchesData } = await supabase
        .from('tournament_matches')
        .select('tournament_id')
        .in('id', Array.from(matchIds));
      const tournamentIds = new Set(matchesData?.map((m) => m.tournament_id) || []);
      tournamentsPlayed = tournamentIds.size;
    }

    // Calculate derived stats
    const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const average = outs > 0 ? totalRuns / outs : totalRuns;
    const economy = totalBallsBowled > 0 ? (runsConceded / (totalBallsBowled / 6)) : 0;
    const bowlingAverage = wickets > 0 ? runsConceded / wickets : 0;

    return {
      profileId,
      playerName: profile.name,
      battingInnings,
      totalRuns,
      battingBalls: totalBalls,
      fours,
      sixes,
      notOuts,
      highestScore,
      strikeRate: Math.round(strikeRate * 100) / 100,
      average: Math.round(average * 100) / 100,
      fifties,
      hundreds,
      bowlingInnings,
      bowlingBalls: totalBallsBowled,
      runsConceded,
      wickets,
      maidens,
      economy: Math.round(economy * 100) / 100,
      bowlingAverage: Math.round(bowlingAverage * 100) / 100,
      bestFiguresWickets: bestFigures.wickets,
      bestFiguresRuns: bestFigures.runs === Infinity ? 0 : bestFigures.runs,
      fiveWicketHauls,
      tournamentsPlayed,
      teamsPlayedFor,
    };
  } catch (error) {
    console.error('Error in getPlayerCareerStats:', error);
    return null;
  }
}

// Get top performers (leaderboard)
export async function getTopBattingLeaders(_limit: number = 10): Promise<PlayerCareerStats[]> {
  // This would need a more complex query - for now return empty
  // In production, you'd want a materialized view or stored procedure
  return [];
}

export async function getTopBowlingLeaders(_limit: number = 10): Promise<PlayerCareerStats[]> {
  return [];
}
