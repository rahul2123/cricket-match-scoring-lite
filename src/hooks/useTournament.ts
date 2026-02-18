import { useReducer, useEffect, useCallback, useState } from 'react';
import {
  TournamentState,
  TournamentAction,
  INITIAL_TOURNAMENT_STATE,
  Tournament,
  Team,
  Player,
  TournamentMatch,
  CreateTournamentInput,
  CreateTeamInput,
  CreatePlayerInput,
  CreateMatchInput,
} from '../types/tournament';
import * as tournamentApi from '../utils/tournamentApi';
import { getUserId } from '../utils/supabase';

// =============================================================================
// REDUCER
// =============================================================================

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_TOURNAMENT':
      return { ...state, tournament: action.tournament, error: null };

    case 'SET_TEAMS':
      return { ...state, teams: action.teams };

    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.team] };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map((t) => (t.id === action.team.id ? action.team : t)),
      };

    case 'REMOVE_TEAM':
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.teamId),
        playersByTeam: Object.fromEntries(
          Object.entries(state.playersByTeam).filter(([teamId]) => Number(teamId) !== action.teamId)
        ),
      };

    case 'SET_PLAYERS':
      // Sets all players, organizing by team
      const playersByTeam: Record<number, Player[]> = {};
      for (const player of action.players) {
        if (!playersByTeam[player.teamId]) {
          playersByTeam[player.teamId] = [];
        }
        playersByTeam[player.teamId].push(player);
      }
      return { ...state, playersByTeam };

    case 'SET_PLAYERS_FOR_TEAM':
      return {
        ...state,
        playersByTeam: {
          ...state.playersByTeam,
          [action.teamId]: action.players,
        },
      };

    case 'ADD_PLAYER':
      return {
        ...state,
        playersByTeam: {
          ...state.playersByTeam,
          [action.player.teamId]: [
            ...(state.playersByTeam[action.player.teamId] || []),
            action.player,
          ],
        },
      };

    case 'UPDATE_PLAYER':
      return {
        ...state,
        playersByTeam: {
          ...state.playersByTeam,
          [action.player.teamId]: (
            state.playersByTeam[action.player.teamId] || []
          ).map((p) => (p.id === action.player.id ? action.player : p)),
        },
      };

    case 'REMOVE_PLAYER':
      const teamPlayers = state.playersByTeam[action.playerId]
        ? Object.entries(state.playersByTeam).find(([, players]) =>
            players.some((p) => p.id === action.playerId)
          )?.[0]
        : null;

      if (!teamPlayers) return state;

      const teamId = Number(teamPlayers);
      return {
        ...state,
        playersByTeam: {
          ...state.playersByTeam,
          [teamId]: (state.playersByTeam[teamId] || []).filter(
            (p) => p.id !== action.playerId
          ),
        },
      };

    case 'SET_MATCHES':
      return { ...state, matches: action.matches };

    case 'ADD_MATCH':
      return { ...state, matches: [...state.matches, action.match] };

    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map((m) =>
          m.id === action.match.id ? action.match : m
        ),
      };

    case 'SET_USER_ROLE':
      return { ...state, userRole: action.role };

    case 'SET_STANDINGS':
      return { ...state, standings: action.standings };

    case 'CLEAR_TOURNAMENT':
      return INITIAL_TOURNAMENT_STATE;

    default:
      return state;
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useTournament(tournamentCode?: string) {
  const [state, dispatch] = useReducer(tournamentReducer, INITIAL_TOURNAMENT_STATE);

  // Load tournament data when code changes
  useEffect(() => {
    if (!tournamentCode) {
      dispatch({ type: 'CLEAR_TOURNAMENT' });
      return;
    }

    loadTournament(tournamentCode);
  }, [tournamentCode]);

  // Subscribe to real-time updates when tournament is loaded
  useEffect(() => {
    if (!state.tournament) return;

    const unsubscribe = tournamentApi.subscribeToTournament(
      state.tournament.id,
      () => {
        refreshData();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [state.tournament?.id]);

  const loadTournament = async (code: string) => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const tournament = await tournamentApi.getTournament(code);
      if (!tournament) {
        dispatch({ type: 'SET_ERROR', error: 'Tournament not found' });
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }

      dispatch({ type: 'SET_TOURNAMENT', tournament });

      // Load teams, matches, and standings in parallel
      const [teams, matches, standings] = await Promise.all([
        tournamentApi.getTeamsByTournament(tournament.id),
        tournamentApi.getMatchesByTournament(tournament.id),
        tournamentApi.getTournamentStandings(tournament.id),
      ]);

      dispatch({ type: 'SET_TEAMS', teams });
      dispatch({ type: 'SET_MATCHES', matches });
      dispatch({ type: 'SET_STANDINGS', standings });

      // Check user role
      const userId = await getUserId();
      if (userId && tournament.createdBy === userId) {
        dispatch({ type: 'SET_USER_ROLE', role: 'admin' });
      } else {
        dispatch({ type: 'SET_USER_ROLE', role: 'viewer' });
      }

      dispatch({ type: 'SET_LOADING', isLoading: false });
    } catch (error) {
      console.error('Error loading tournament:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to load tournament' });
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const refreshData = async () => {
    if (!state.tournament) return;

    try {
      const [teams, matches, standings] = await Promise.all([
        tournamentApi.getTeamsByTournament(state.tournament.id),
        tournamentApi.getMatchesByTournament(state.tournament.id),
        tournamentApi.getTournamentStandings(state.tournament.id),
      ]);

      dispatch({ type: 'SET_TEAMS', teams });
      dispatch({ type: 'SET_MATCHES', matches });
      dispatch({ type: 'SET_STANDINGS', standings });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // =========================================================================
  // TOURNAMENT ACTIONS
  // =========================================================================

  const createTournament = useCallback(async (input: CreateTournamentInput): Promise<Tournament | null> => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    const tournament = await tournamentApi.createTournament(input);
    dispatch({ type: 'SET_LOADING', isLoading: false });

    if (tournament) {
      dispatch({ type: 'SET_TOURNAMENT', tournament });
      dispatch({ type: 'SET_USER_ROLE', role: 'admin' });
    }

    return tournament;
  }, []);

  const clearTournament = useCallback(() => {
    dispatch({ type: 'CLEAR_TOURNAMENT' });
  }, []);

  // =========================================================================
  // TEAM ACTIONS
  // =========================================================================

  const addTeam = useCallback(async (input: CreateTeamInput): Promise<Team | null> => {
    const team = await tournamentApi.createTeam(input);
    if (team) {
      dispatch({ type: 'ADD_TEAM', team });
    }
    return team;
  }, []);

  const updateTeam = useCallback(async (id: number, name: string, shortName?: string): Promise<Team | null> => {
    const team = await tournamentApi.updateTeam(id, name, shortName);
    if (team) {
      dispatch({ type: 'UPDATE_TEAM', team });
    }
    return team;
  }, []);

  const removeTeam = useCallback(async (id: number): Promise<boolean> => {
    const success = await tournamentApi.deleteTeam(id);
    if (success) {
      dispatch({ type: 'REMOVE_TEAM', teamId: id });
    }
    return success;
  }, []);

  // =========================================================================
  // PLAYER ACTIONS
  // =========================================================================

  const loadPlayersForTeam = useCallback(async (teamId: number) => {
    const players = await tournamentApi.getPlayersByTeam(teamId);
    dispatch({ type: 'SET_PLAYERS_FOR_TEAM', teamId, players });
  }, []);

  const addPlayer = useCallback(async (input: CreatePlayerInput): Promise<Player | null> => {
    const player = await tournamentApi.createPlayer(input);
    if (player) {
      dispatch({ type: 'ADD_PLAYER', player });
    }
    return player;
  }, []);

  const removePlayer = useCallback(async (id: number): Promise<boolean> => {
    const success = await tournamentApi.deletePlayer(id);
    if (success) {
      dispatch({ type: 'REMOVE_PLAYER', playerId: id });
    }
    return success;
  }, []);

  // =========================================================================
  // MATCH ACTIONS
  // =========================================================================

  const addMatch = useCallback(async (input: CreateMatchInput): Promise<TournamentMatch | null> => {
    const match = await tournamentApi.createTournamentMatch(input);
    if (match) {
      dispatch({ type: 'ADD_MATCH', match });
    }
    return match;
  }, []);

  const updateMatch = useCallback(async (
    id: number,
    updates: Parameters<typeof tournamentApi.updateTournamentMatch>[1]
  ): Promise<TournamentMatch | null> => {
    const match = await tournamentApi.updateTournamentMatch(id, updates);
    if (match) {
      dispatch({ type: 'UPDATE_MATCH', match });
    }
    return match;
  }, []);

  const startMatch = useCallback(async (matchId: number): Promise<boolean> => {
    const match = await tournamentApi.updateTournamentMatch(matchId, { status: 'live' });
    if (match) {
      dispatch({ type: 'UPDATE_MATCH', match });

      // Update tournament status to ongoing if first match
      if (state.tournament?.status === 'upcoming') {
        await tournamentApi.updateTournamentStatus(state.tournament.id, 'ongoing');
      }
    }
    return match !== null;
  }, [state.tournament]);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  const isAdmin = state.userRole === 'admin';
  const isScorer = state.userRole === 'scorer' || state.userRole === 'admin';
  const canEdit = isAdmin;
  const canScore = isScorer;

  const scheduledMatches = state.matches.filter((m) => m.status === 'scheduled');
  const liveMatches = state.matches.filter((m) => m.status === 'live');
  const completedMatches = state.matches.filter((m) => m.status === 'completed');

  const getTeamById = useCallback(
    (id: number): Team | undefined => {
      return state.teams.find((t) => t.id === id);
    },
    [state.teams]
  );

  const getPlayersForTeam = useCallback(
    (teamId: number): Player[] => {
      return state.playersByTeam[teamId] || [];
    },
    [state.playersByTeam]
  );

  const getMatchById = useCallback(
    (id: number): TournamentMatch | undefined => {
      return state.matches.find((m) => m.id === id);
    },
    [state.matches]
  );

  return {
    // State
    ...state,

    // Computed
    isAdmin,
    isScorer,
    canEdit,
    canScore,
    scheduledMatches,
    liveMatches,
    completedMatches,

    // Tournament actions
    createTournament,
    loadTournament,
    clearTournament,
    refreshData,

    // Team actions
    addTeam,
    updateTeam,
    removeTeam,
    getTeamById,

    // Player actions
    loadPlayersForTeam,
    addPlayer,
    removePlayer,
    getPlayersForTeam,

    // Match actions
    addMatch,
    updateMatch,
    startMatch,
    getMatchById,
  };
}

// =============================================================================
// HOOK FOR USER'S TOURNAMENTS
// =============================================================================

export function useUserTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = await getUserId();
      if (!userId) {
        setTournaments([]);
        setIsLoading(false);
        return;
      }

      const userTournaments = await tournamentApi.getTournamentsByUser(userId);
      setTournaments(userTournaments);
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  return {
    tournaments,
    isLoading,
    error,
    refresh: loadTournaments,
  };
}
