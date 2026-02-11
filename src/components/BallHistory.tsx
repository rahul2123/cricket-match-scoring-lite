import { Ball } from '../types';
import {
  getBallLabel
} from '../utils/helpers';

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
      <div className="bg-cricket-card dark:bg-white/5 rounded-lg px-3 py-2 text-center border border-cricket-target/20 dark:border-white/10 shrink-0">
        <p className="text-cricket-target dark:text-cricket-dark-text/60 text-xs">No balls yet</p>
      </div>
    );
  }

  // Group balls by overs (6 balls each, excluding wides and no-balls without runout)
  // const ballsWithOverInfo = currentInningBalls.map((ball, index) => {
  //   // Count legal balls before this one (in reversed array, so we need to look at items after this index)
  //   const allBallsBeforeThisInOrder = balls
  //     .filter((b) => b.inning === currentInning)
  //     .slice(0, balls.filter(b => b.inning === currentInning).length - index);

  //   const legalBallsCount = allBallsBeforeThisInOrder.filter(isLegalBall).length;

  //   const overNumber = Math.floor((legalBallsCount - 1) / 6);
  //   const ballInOver = ((legalBallsCount - 1) % 6) + 1;

  //   return {
  //     ball,
  //     overNumber,
  //     ballInOver,
  //     isLegal: isLegalBall(ball),
  //   };
  // });

  return (
    <div className="bg-cricket-card dark:bg-white/5 rounded-lg p-2.5 border border-cricket-target/20 dark:border-white/10 shrink-0">
      {/* <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-semibold text-cricket-target dark:text-cricket-dark-text/60 uppercase tracking-wider">
          Ball history
        </h3>
        <span className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 tabular-nums">{currentInningBalls.length} balls</span>
      </div> */}
      {/* <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
        {ballsWithOverInfo.map(({ ball }) => (
          <div
            key={ball.id}
            className={getBallClass(ball.type, ball.runs)}
            title={`${ball.type}: ${ball.runs} run${ball.runs !== 1 ? 's' : ''}${ball.isRunOut ? ' (run-out)' : ''}${ball.isWicket ? ' (wicket)' : ''}`}
          >
            {getBallLabel(ball.type, ball.runs, ball.isRunOut, ball.isWicket)}
          </div>
        ))}
      </div> */}
      {currentInningBalls.length > 0 && (
        <div className="mt-2 pt-2 border-t border-cricket-target/20 dark:border-white/10">
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

  // Show all overs; container fits at least 5 overs without scroll, then scrollable
  const startOverNumber = 0;

  return (
    <div className="space-y-1">
      <h4 className="text-[9px] font-medium text-cricket-target dark:text-cricket-dark-text/60 uppercase tracking-wider">Recent overs</h4>
      <div className="min-h-[7.5rem] max-h-48 overflow-y-auto pr-0.5 space-y-1">
        {overs.map((over, idx) => {
          const overNum = startOverNumber + idx + 1;
          const runsInOver = over.reduce((sum, b) => sum + b.runs, 0);
          const wicketsInOver = over.filter(b => b.type === 'wicket' || b.isRunOut || b.isWicket).length;
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="text-[10px] text-cricket-target dark:text-cricket-dark-text/60 w-6 tabular-nums">O{overNum}</span>
              <div className="flex gap-0.5 flex-1 flex-wrap min-w-0">
                {over.map((ball) => (
                  <span
                    key={ball.id}
                    className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] px-0.5 rounded text-[10px] font-medium tabular-nums
                    ${ball.type === 'wicket' ? 'bg-cricket-wicket/15 text-cricket-wicket font-bold' : ''}
                    ${ball.type === 'wide' || ball.type === 'noball' || ball.type === 'bye' || ball.type === 'legbye' ? 'bg-cricket-extras/15 text-cricket-extras' : ''}
                    ${ball.type === 'run' ? 'bg-cricket-target/15 dark:bg-white/10 text-cricket-score dark:text-cricket-dark-text' : ''}
                  `}
                  >
                    {getBallLabel(ball.type, ball.runs, ball.isRunOut, ball.isWicket)}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-cricket-score dark:text-cricket-dark-text font-mono tabular-nums shrink-0">
                {wicketsInOver > 0 && <span className="text-cricket-wicket mr-0.5">{wicketsInOver}W</span>}={runsInOver}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
