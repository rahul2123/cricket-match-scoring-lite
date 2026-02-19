/**
 * TournamentMatchScoringView - Example Integration
 *
 * This component shows how to integrate the player tracking system
 * with tournament match scoring.
 *
 * Integration Steps:
 * 1. Load team players from API
 * 2. Pass players to MatchPlayerManager
 * 3. Use CurrentPlayers during scoring
 * 4. Show scorecard in completed view
 */

import { useState, useEffect } from 'react';
import { useMatch } from '../../hooks/useMatch';
import { MatchPlayerManager } from '../scoring/MatchPlayerManager';
import { CurrentPlayers } from '../scoring/CurrentPlayers';
import { BattingScorecard } from '../scoring/BattingScorecard';
import { BowlingFigures } from '../scoring/BowlingFigures';
import { ScoreBoard } from '../ScoreBoard';
import { ScoringButtons } from '../ScoringButtons';
import { BallHistory } from '../BallHistory';
import type { TournamentMatch, Team, TeamPlayer } from '../../types/tournament';
import * as playerApi from '../../utils/playerApi';

interface TournamentMatchScoringViewProps {
  match: TournamentMatch;
  teamA: Team;
  teamB: Team;
  battingFirstTeamId: number;
  onBack: () => void;
  onComplete: () => void;
}

export function TournamentMatchScoringView({
  match,
  teamA,
  teamB,
  battingFirstTeamId,
  onBack,
  onComplete,
}: TournamentMatchScoringViewProps) {
  const {
    state,
    currentInning,
    canEndInnings,
    canUndo,
    canScore,
    runsRequired,
    ballsRemaining,
    isFirstInningsComplete,
    isSecondInningsComplete,
    addRun,
    addWicket,
    addWide,
    addWideWicket,
    addNoBall,
    undo,
    endInnings,
    setTotalOvers,
    newMatch,
    setTeamPlayers,
    setOpeningBatsmen,
    setBowler,
    nextBatsman,
  } = useMatch();

  // Team players state
  const [teamAPlayers, setTeamAPlayers] = useState<TeamPlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<TeamPlayer[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Load team players
  useEffect(() => {
    loadTeamPlayers();
  }, [teamA.id, teamB.id]);

  const loadTeamPlayers = async () => {
    setIsLoadingPlayers(true);
    try {
      const [playersA, playersB] = await Promise.all([
        playerApi.getTeamPlayers(teamA.id),
        playerApi.getTeamPlayers(teamB.id),
      ]);
      setTeamAPlayers(playersA);
      setTeamBPlayers(playersB);
    } catch (error) {
      console.error('Error loading team players:', error);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  // Initialize match when players are loaded
  useEffect(() => {
    if (!isLoadingPlayers && teamAPlayers.length > 0 && teamBPlayers.length > 0) {
      // Initialize match with overs
      newMatch(match.overs);

      // Set team players
      const teamABatsmen = teamAPlayers.map(p => p.profileId);
      const teamBBatsmen = teamBPlayers.map(p => p.profileId);
      const teamABowlers = teamAPlayers.filter(p => p.role === 'bowler' || p.role === 'all-rounder').map(p => p.profileId);
      const teamBBowlers = teamBPlayers.filter(p => p.role === 'bowler' || p.role === 'all-rounder').map(p => p.profileId);

      setTeamPlayers(
        teamABatsmen,
        teamBBatsmen,
        teamABowlers.length > 0 ? teamABowlers : teamABatsmen,
        teamBBowlers.length > 0 ? teamBBowlers : teamBBatsmen,
        battingFirstTeamId === teamA.id ? 'A' : 'B'
      );
    }
  }, [isLoadingPlayers, teamAPlayers, teamBPlayers, match.overs, battingFirstTeamId]);

  // Determine batting/bowling teams
  const battingTeam = state.currentInning === 1
    ? state.battingTeam
    : (state.battingTeam === 'A' ? 'B' : 'A');
  const bowlingTeam = battingTeam === 'A' ? 'B' : 'A';

  const battingTeamData = battingTeam === 'A' ? teamA : teamB;
  const bowlingTeamData = bowlingTeam === 'A' ? teamA : teamB;
  const battingPlayers = battingTeam === 'A' ? teamAPlayers : teamBPlayers;
  const bowlingPlayers = bowlingTeam === 'A' ? teamAPlayers : teamBPlayers;

  // Handler for changing bowler mid-innings
  const handleChangeBowler = () => {
    // Trigger bowler selection dialog
    // This would be handled by MatchPlayerManager
  };

  if (isLoadingPlayers) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-cricket-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if we have enough players
  if (teamAPlayers.length < 2 || teamBPlayers.length < 2) {
    return (
      <div className="p-4 text-center">
        <p className="text-cricket-wicket">
          Need at least 2 players per team. Add players in the Teams tab.
        </p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-cricket-primary text-white rounded">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player Management - handles all player selection */}
      <MatchPlayerManager
        state={state}
        teamA={teamA}
        teamB={teamB}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        battingFirstTeamId={battingFirstTeamId}
        onSetTeamPlayers={setTeamPlayers}
        onSetOpeningBatsmen={setOpeningBatsmen}
        onSetBowler={setBowler}
        onNextBatsman={nextBatsman}
      />

      {/* Main scoring view */}
      {canScore && (
        <>
          {/* Current Players Display */}
          <CurrentPlayers
            state={state}
            battingTeam={battingTeamData}
            bowlingTeam={bowlingTeamData}
            battingPlayers={battingPlayers}
            bowlingPlayers={bowlingPlayers}
            onChangeBowler={handleChangeBowler}
          />

          {/* Score Board */}
          <ScoreBoard
            state={state}
            currentInning={currentInning}
            runsRequired={runsRequired}
            ballsRemaining={ballsRemaining}
            isFirstInningsComplete={isFirstInningsComplete}
            isSecondInningsComplete={isSecondInningsComplete}
            onEndInnings={endInnings}
          />

          {/* Scoring Buttons */}
          <ScoringButtons
            canScore={canScore}
            canUndo={canUndo}
            canEndInnings={canEndInnings}
            currentInning={state.currentInning}
            totalOvers={state.totalOvers}
            isSharing={false}
            isViewing={false}
            isSharingLoading={false}
            onAddRun={addRun}
            onAddWicket={addWicket}
            onAddWide={addWide}
            onAddWideWicket={addWideWicket}
            onAddNoBall={addNoBall}
            onUndo={undo}
            onEndInnings={endInnings}
            onNewMatch={() => {}}
            onSetTotalOvers={setTotalOvers}
            onShareMatch={() => {}}
          />

          {/* Ball History */}
          <BallHistory
            balls={state.ballHistory}
            currentInning={state.currentInning}
          />
        </>
      )}

      {/* Completed Match View */}
      {state.isMatchOver && (
        <>
          {/* First Innings Scorecard */}
          <BattingScorecard
            inning={state.innings.first}
            players={state.battingTeam === 'A' ? teamAPlayers : teamBPlayers}
            battingTeamName={state.battingTeam === 'A' ? teamA.name : teamB.name}
          />
          <BowlingFigures
            inning={state.innings.first}
            players={state.battingTeam === 'A' ? teamBPlayers : teamAPlayers}
            bowlingTeamName={state.battingTeam === 'A' ? teamB.name : teamA.name}
          />

          {/* Second Innings Scorecard */}
          <BattingScorecard
            inning={state.innings.second}
            players={state.battingTeam === 'A' ? teamBPlayers : teamAPlayers}
            battingTeamName={state.battingTeam === 'A' ? teamB.name : teamA.name}
          />
          <BowlingFigures
            inning={state.innings.second}
            players={state.battingTeam === 'A' ? teamAPlayers : teamBPlayers}
            bowlingTeamName={state.battingTeam === 'A' ? teamA.name : teamB.name}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 py-2.5 rounded-lg bg-cricket-secondary text-white text-sm font-medium"
            >
              Back to Tournament
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-2.5 rounded-lg bg-cricket-primary text-white text-sm font-medium"
            >
              Complete Match
            </button>
          </div>
        </>
      )}
    </div>
  );
}
