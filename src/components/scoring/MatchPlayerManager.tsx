import { useState, useEffect } from 'react';
import type { TeamPlayer, Team } from '../../types/tournament';
import type { MatchState } from '../../types';
import { PlayerSelectionDialog } from './PlayerSelectionDialog';

interface MatchPlayerManagerProps {
  state: MatchState;
  teamA: Team;
  teamB: Team;
  teamAPlayers: TeamPlayer[];
  teamBPlayers: TeamPlayer[];
  battingFirstTeamId: number;
  onSetTeamPlayers: (
    teamABatsmen: number[],
    teamBBatsmen: number[],
    teamABowlers: number[],
    teamBBowlers: number[],
    battingTeam: 'A' | 'B'
  ) => void;
  onSetOpeningBatsmen: (strikerId: number, nonStrikerId: number) => void;
  onSetBowler: (bowlerId: number) => void;
  onNextBatsman: (batsmanId: number) => void;
}

export function MatchPlayerManager({
  state,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  battingFirstTeamId,
  onSetTeamPlayers,
  onSetOpeningBatsmen,
  onSetBowler,
  onNextBatsman,
}: MatchPlayerManagerProps) {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showBatsmenDialog, setShowBatsmenDialog] = useState(false);
  const [showBowlerDialog, setShowBowlerDialog] = useState(false);
  const [showNextBatsmanDialog, setShowNextBatsmanDialog] = useState(false);
  const [selectedBatsmen, setSelectedBatsmen] = useState<number[]>([]);
  const [selectedBowler, setSelectedBowler] = useState<number | null>(null);

  const inning = state.currentInning === 1 ? state.innings.first : state.innings.second;

  // Determine which team is batting and which is bowling
  const battingTeam = state.currentInning === 1
    ? state.battingTeam
    : (state.battingTeam === 'A' ? 'B' : 'A');
  const bowlingTeam = battingTeam === 'A' ? 'B' : 'A';

  const battingTeamData = battingTeam === 'A' ? teamA : teamB;
  const bowlingTeamData = bowlingTeam === 'A' ? teamA : teamB;
  const battingPlayers = battingTeam === 'A' ? teamAPlayers : teamBPlayers;
  const bowlingPlayers = bowlingTeam === 'A' ? teamAPlayers : teamBPlayers;

  // Check if we need to initialize team players
  const needsSetup = state.teamABatsmen.length === 0;

  // Check if we need opening batsmen
  const needsOpeningBatsmen = !needsSetup && !inning.strikerId && !inning.nonStrikerId;

  // Check if we need a bowler
  const needsBowler = !needsSetup && inning.strikerId && !inning.bowlerId;

  // Check if we need next batsman (after wicket, striker is undefined)
  const needsNextBatsman = !needsSetup && inning.wickets < 10 && !inning.strikerId && inning.balls < state.totalOvers * 6;

  // Auto-show dialogs when needed
  useEffect(() => {
    if (needsSetup) {
      setShowSetupDialog(true);
    } else if (needsOpeningBatsmen) {
      setShowBatsmenDialog(true);
    } else if (needsBowler) {
      setShowBowlerDialog(true);
    } else if (needsNextBatsman) {
      setShowNextBatsmanDialog(true);
    }
  }, [needsSetup, needsOpeningBatsmen, needsBowler, needsNextBatsman]);

  // Handle team setup
  const handleSetupConfirm = () => {
    // Get all player IDs as batsmen (can be refined later)
    const teamABatsmen = teamAPlayers.map(p => p.profileId);
    const teamBBatsmen = teamBPlayers.map(p => p.profileId);
    const teamABowlers = teamAPlayers.filter(p => p.role === 'bowler' || p.role === 'all-rounder').map(p => p.profileId);
    const teamBBowlers = teamBPlayers.filter(p => p.role === 'bowler' || p.role === 'all-rounder').map(p => p.profileId);

    onSetTeamPlayers(
      teamABatsmen,
      teamBBatsmen,
      teamABowlers.length > 0 ? teamABowlers : teamABatsmen, // Fall back to all players if no bowlers
      teamBBowlers.length > 0 ? teamBBowlers : teamBBatsmen,
      battingFirstTeamId === teamA.id ? 'A' : 'B'
    );
    setShowSetupDialog(false);
  };

  // Handle opening batsmen selection
  const handleBatsmenSelect = (profileId: number) => {
    if (selectedBatsmen.includes(profileId)) {
      setSelectedBatsmen(selectedBatsmen.filter(id => id !== profileId));
    } else if (selectedBatsmen.length < 2) {
      setSelectedBatsmen([...selectedBatsmen, profileId]);
    }
  };

  const handleBatsmenConfirm = () => {
    if (selectedBatsmen.length === 2) {
      onSetOpeningBatsmen(selectedBatsmen[0], selectedBatsmen[1]);
      setSelectedBatsmen([]);
      setShowBatsmenDialog(false);
    }
  };

  // Handle bowler selection
  const handleBowlerSelect = (profileId: number) => {
    setSelectedBowler(profileId);
  };

  const handleBowlerConfirm = () => {
    if (selectedBowler) {
      onSetBowler(selectedBowler);
      setSelectedBowler(null);
      setShowBowlerDialog(false);
    }
  };

  // Handle next batsman selection
  const handleNextBatsmanSelect = (profileId: number) => {
    setSelectedBatsmen([profileId]);
  };

  const handleNextBatsmanConfirm = () => {
    if (selectedBatsmen.length === 1) {
      onNextBatsman(selectedBatsmen[0]);
      setSelectedBatsmen([]);
      setShowNextBatsmanDialog(false);
    }
  };

  // Get available players for next batsman (not out, not already in)
  const getAvailableBatsmen = () => {
    return battingPlayers.filter(p => {
      const batsman = inning.batsmen[p.profileId];
      return !batsman || (!batsman.isOut && p.profileId !== inning.nonStrikerId);
    });
  };

  // Get available bowlers (can be the same as current bowler if they haven't bowled too many overs)
  const getAvailableBowlers = () => {
    const bowlersList = bowlingTeam === 'A' ? state.teamABowlers : state.teamBBowlers;
    return bowlingPlayers.filter(p => bowlersList.includes(p.profileId));
  };

  return (
    <>
      {/* Team Setup Dialog */}
      <PlayerSelectionDialog
        isOpen={showSetupDialog}
        title="Set Up Teams"
        players={[...teamAPlayers, ...teamBPlayers]}
        selectedIds={[]}
        onSelect={() => {}}
        onConfirm={handleSetupConfirm}
        onCancel={() => setShowSetupDialog(false)}
        multiSelect={false}
      />

      {/* Opening Batsmen Selection */}
      <PlayerSelectionDialog
        isOpen={showBatsmenDialog}
        title={`Select Opening Batsmen (${battingTeamData?.name})`}
        players={battingPlayers}
        selectedIds={selectedBatsmen}
        onSelect={handleBatsmenSelect}
        onConfirm={handleBatsmenConfirm}
        onCancel={() => setShowBatsmenDialog(false)}
        multiSelect={true}
      />

      {/* Bowler Selection */}
      <PlayerSelectionDialog
        isOpen={showBowlerDialog}
        title={`Select Bowler (${bowlingTeamData?.name})`}
        players={getAvailableBowlers()}
        selectedIds={selectedBowler ? [selectedBowler] : []}
        onSelect={handleBowlerSelect}
        onConfirm={handleBowlerConfirm}
        onCancel={() => setShowBowlerDialog(false)}
        multiSelect={false}
      />

      {/* Next Batsman Selection (after wicket) */}
      <PlayerSelectionDialog
        isOpen={showNextBatsmanDialog}
        title={`Next Batsman (${battingTeamData?.name})`}
        players={getAvailableBatsmen()}
        selectedIds={selectedBatsmen}
        onSelect={handleNextBatsmanSelect}
        onConfirm={handleNextBatsmanConfirm}
        onCancel={() => setShowNextBatsmanDialog(false)}
        multiSelect={false}
      />
    </>
  );
}
