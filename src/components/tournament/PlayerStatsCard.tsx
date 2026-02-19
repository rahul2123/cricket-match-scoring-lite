import { useState, useEffect } from 'react';
import type { PlayerCareerStats } from '../../types/tournament';
import { getPlayerCareerStats } from '../../utils/playerApi';
import { formatOvers } from '../../utils/helpers';

interface PlayerStatsCardProps {
  profileId: number;
  playerName: string;
  onClose?: () => void;
}

export function PlayerStatsCard({ profileId, playerName, onClose }: PlayerStatsCardProps) {
  const [stats, setStats] = useState<PlayerCareerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profileId]);

  const loadStats = async () => {
    setIsLoading(true);
    const careerStats = await getPlayerCareerStats(profileId);
    setStats(careerStats);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg p-4 border border-cricket-target/20 dark:border-white/10">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-cricket-target/20 rounded w-1/2"></div>
          <div className="h-4 bg-cricket-target/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg p-4 border border-cricket-target/20 dark:border-white/10">
        <p className="text-sm text-cricket-target dark:text-cricket-dark-text/60">
          No stats available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cricket-card dark:bg-cricket-dark-card rounded-lg border border-cricket-target/20 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-cricket-primary/10 dark:bg-cricket-dark-accent/10 px-4 py-3 border-b border-cricket-target/20 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-cricket-score dark:text-cricket-dark-text">
            {playerName}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-cricket-target dark:text-cricket-dark-text/60 hover:text-cricket-score dark:hover:text-cricket-dark-text"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-xs text-cricket-target dark:text-cricket-dark-text/60">
          {stats.tournamentsPlayed} tournament{stats.tournamentsPlayed !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Batting Stats */}
      <div className="p-4 border-b border-cricket-target/10 dark:border-white/5">
        <h4 className="text-xs font-semibold text-cricket-target dark:text-cricket-dark-text/60 uppercase mb-3">
          Batting
        </h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
              {stats.totalRuns}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Runs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
              {stats.battingInnings}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Innings</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
              {stats.highestScore}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Best</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
              {stats.average.toFixed(1)}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Avg</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="text-center">
            <p className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
              {stats.strikeRate.toFixed(1)}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">SR</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
              {stats.fours}/{stats.sixes}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">4s/6s</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-cricket-success">
              {stats.fifties}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">50s</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-cricket-success">
              {stats.hundreds}
            </p>
            <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">100s</p>
          </div>
        </div>
      </div>

      {/* Bowling Stats */}
      <div className="p-4">
        <h4 className="text-xs font-semibold text-cricket-target dark:text-cricket-dark-text/60 uppercase mb-3">
          Bowling
        </h4>
        {stats.bowlingInnings > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
                  {stats.wickets}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Wkts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
                  {formatOvers(stats.bowlingBalls)}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Overs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
                  {stats.economy.toFixed(2)}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Econ</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-cricket-score dark:text-cricket-dark-text">
                  {stats.bowlingAverage.toFixed(1)}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Avg</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <p className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
                  {stats.maidens}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Maidens</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-cricket-score dark:text-cricket-dark-text">
                  {stats.bestFiguresWickets}/{stats.bestFiguresRuns}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">Best</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-cricket-success">
                  {stats.fiveWicketHauls}
                </p>
                <p className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60">5-fers</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-cricket-target dark:text-cricket-dark-text/40 text-center py-4">
            No bowling stats yet
          </p>
        )}
      </div>
    </div>
  );
}
