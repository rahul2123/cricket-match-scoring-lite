import { Ball } from '../types';
import { getBallLabel, getBallClass } from '../utils/helpers';

interface BallHistoryProps {
  balls: Ball[];
  currentInning: 1 | 2;
}

export function BallHistory({ balls, currentInning }: BallHistoryProps) {
  // Filter balls for current innings and reverse for newest first
  const currentInningBalls = balls
    .filter((ball) => ball.inning === currentInning)
    .slice()
    .reverse();

  if (currentInningBalls.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-sm">No balls bowled yet</p>
      </div>
    );
  }

  // Group balls by overs (6 balls each, excluding wides and no-balls)
  const ballsWithOverInfo = currentInningBalls.map((ball, index) => {
    // Count legal balls before this one (in reversed array, so we need to look at items after this index)
    const allBallsBeforeThisInOrder = balls
      .filter((b) => b.inning === currentInning)
      .slice(0, balls.filter(b => b.inning === currentInning).length - index);
    
    const legalBallsCount = allBallsBeforeThisInOrder.filter(
      (b) => b.type !== 'wide' && b.type !== 'noball'
    ).length;
    
    const overNumber = Math.floor((legalBallsCount - 1) / 6);
    const ballInOver = ((legalBallsCount - 1) % 6) + 1;
    
    return {
      ball,
      overNumber,
      ballInOver,
      isLegalBall: ball.type !== 'wide' && ball.type !== 'noball',
    };
  });

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Ball History
        </h3>
        <span className="text-xs text-slate-500">
          {currentInningBalls.length} balls
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {ballsWithOverInfo.map(({ ball }) => (
          <div
            key={ball.id}
            className={getBallClass(ball.type, ball.runs)}
            title={`${ball.type}: ${ball.runs} run${ball.runs !== 1 ? 's' : ''}`}
          >
            {getBallLabel(ball.type, ball.runs)}
          </div>
        ))}
      </div>

      {/* Over Breakdown */}
      {currentInningBalls.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <OverBreakdown balls={balls.filter((b) => b.inning === currentInning)} />
        </div>
      )}
    </div>
  );
}

interface OverBreakdownProps {
  balls: Ball[];
}

function OverBreakdown({ balls }: OverBreakdownProps) {
  // Group balls into overs
  const overs: Ball[][] = [];
  let currentOver: Ball[] = [];
  let legalBallCount = 0;

  for (const ball of balls) {
    currentOver.push(ball);
    
    // Wide and no-ball don't count as legal deliveries
    if (ball.type !== 'wide' && ball.type !== 'noball') {
      legalBallCount++;
      
      if (legalBallCount % 6 === 0) {
        overs.push(currentOver);
        currentOver = [];
      }
    }
  }

  // Add remaining balls as incomplete over
  if (currentOver.length > 0) {
    overs.push(currentOver);
  }

  // Show only last 3 overs
  const recentOvers = overs.slice(-3);
  const startOverNumber = Math.max(0, overs.length - 3);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        Recent Overs
      </h4>
      {recentOvers.map((over, idx) => {
        const overNum = startOverNumber + idx + 1;
        const runsInOver = over.reduce((sum, b) => sum + b.runs, 0);
        
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-8">
              O{overNum}
            </span>
            <div className="flex gap-1 flex-1">
              {over.map((ball) => (
                <span
                  key={ball.id}
                  className={`
                    inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium
                    ${ball.type === 'wide' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${ball.type === 'noball' ? 'bg-red-500/20 text-red-400' : ''}
                    ${ball.type === 'bye' || ball.type === 'legbye' ? 'bg-purple-500/20 text-purple-400' : ''}
                    ${ball.type === 'run' ? 'bg-slate-700/50 text-slate-300' : ''}
                  `}
                >
                  {getBallLabel(ball.type, ball.runs)}
                </span>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              = {runsInOver}
            </span>
          </div>
        );
      })}
    </div>
  );
}
