import { Ball } from '../types';
import { getBallLabel, getBallClass } from '../utils/helpers';

interface BallHistoryProps {
  balls: Ball[];
  currentInning: 1 | 2;
}

// Check if ball counts (legal delivery)
function isLegalBall(ball: Ball): boolean {
  if (ball.type === 'wide') return false;
  // No-ball counts only if there's a run-out
  if (ball.type === 'noball') return ball.isRunOut === true;
  // Wicket, run, bye, legbye all count as legal deliveries
  return true;
}

export function BallHistory({ balls, currentInning }: BallHistoryProps) {
  // Filter balls for current innings and reverse for newest first
  const currentInningBalls = balls
    .filter((ball) => ball.inning === currentInning)
    .slice()
    .reverse();

  if (currentInningBalls.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-center border border-slate-700/50 shrink-0">
        <p className="text-slate-500 text-xs">No balls yet</p>
      </div>
    );
  }

  // Group balls by overs (6 balls each, excluding wides and no-balls without runout)
  const ballsWithOverInfo = currentInningBalls.map((ball, index) => {
    // Count legal balls before this one (in reversed array, so we need to look at items after this index)
    const allBallsBeforeThisInOrder = balls
      .filter((b) => b.inning === currentInning)
      .slice(0, balls.filter(b => b.inning === currentInning).length - index);
    
    const legalBallsCount = allBallsBeforeThisInOrder.filter(isLegalBall).length;
    
    const overNumber = Math.floor((legalBallsCount - 1) / 6);
    const ballInOver = ((legalBallsCount - 1) % 6) + 1;
    
    return {
      ball,
      overNumber,
      ballInOver,
      isLegal: isLegalBall(ball),
    };
  });

  return (
    <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Ball history
        </h3>
        <span className="text-[10px] text-slate-500">{currentInningBalls.length} balls</span>
      </div>
      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
        {ballsWithOverInfo.map(({ ball }) => (
          <div
            key={ball.id}
            className={getBallClass(ball.type, ball.runs)}
            title={`${ball.type}: ${ball.runs} run${ball.runs !== 1 ? 's' : ''}${ball.isRunOut ? ' (run-out)' : ''}${ball.isWicket ? ' (wicket)' : ''}`}
          >
            {getBallLabel(ball.type, ball.runs, ball.isRunOut)}
          </div>
        ))}
      </div>
      {currentInningBalls.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
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
    
    // Check if this is a legal delivery
    if (isLegalBall(ball)) {
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
    <div className="space-y-1">
      <h4 className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Recent overs</h4>
      {recentOvers.map((over, idx) => {
        const overNum = startOverNumber + idx + 1;
        const runsInOver = over.reduce((sum, b) => sum + b.runs, 0);
        const wicketsInOver = over.filter(b => b.type === 'wicket' || b.isRunOut).length;
        return (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 w-6">O{overNum}</span>
            <div className="flex gap-0.5 flex-1 flex-wrap min-w-0">
              {over.map((ball) => (
                <span
                  key={ball.id}
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] px-0.5 rounded text-[10px] font-medium
                    ${ball.type === 'wicket' ? 'bg-amber-500/25 text-amber-400 font-bold' : ''}
                    ${ball.type === 'wide' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${ball.type === 'noball' ? 'bg-red-500/20 text-red-400' : ''}
                    ${ball.type === 'bye' || ball.type === 'legbye' ? 'bg-violet-500/20 text-violet-400' : ''}
                    ${ball.type === 'run' ? 'bg-slate-700/50 text-slate-300' : ''}
                  `}
                >
                  {getBallLabel(ball.type, ball.runs, ball.isRunOut)}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
              {wicketsInOver > 0 && <span className="text-amber-400 mr-0.5">{wicketsInOver}W</span>}={runsInOver}
            </span>
          </div>
        );
      })}
    </div>
  );
}
