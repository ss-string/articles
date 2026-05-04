import { formatPercent, formatWon, type ConsensusCheckpoint } from '../consensus/model';

type ConsensusTrendLineProps = {
  checkpoints: ConsensusCheckpoint[];
};

function buildPoints(checkpoints: ConsensusCheckpoint[]) {
  const validPrices = checkpoints
    .map((checkpoint) => checkpoint.price)
    .filter((price): price is number => price !== null);
  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  const range = max - min || 1;

  return checkpoints.flatMap((checkpoint, index) => {
    if (checkpoint.price === null) {
      return [];
    }

    const x = 36 + index * 168;
    const y = 154 - ((checkpoint.price - min) / range) * 106;
    return [{ ...checkpoint, x, y }];
  });
}

export function ConsensusTrendLine({ checkpoints }: ConsensusTrendLineProps) {
  const points = buildPoints(checkpoints);
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="trend-card">
      <div className="line-chart" role="img" aria-label="컨센서스 가격 선 그래프">
        <svg viewBox="0 0 560 190" aria-hidden="true">
          <path d="M0 154 L560 154" className="chart-grid" />
          <path d="M0 104 L560 104" className="chart-grid" />
          <path d="M0 54 L560 54" className="chart-grid" />
          {points.length >= 2 ? <path d={path} className="chart-line" /> : null}
          {points.map((point) => (
            <g key={point.label}>
              <line x1={point.x} x2={point.x} y1={point.y} y2="174" className="chart-guide" />
              <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            </g>
          ))}
        </svg>
        {points.map((point) => (
          <span
            className="point-label"
            key={point.label}
            style={{ left: `${(point.x / 560) * 100}%`, top: `${point.y}px` }}
          >
            <small>{point.label}</small>
            {formatWon(point.price)}
          </span>
        ))}
      </div>
      <div className="checkpoint-row">
        {checkpoints.map((checkpoint) => (
          <div className="checkpoint" key={checkpoint.label}>
            <span>{checkpoint.label}</span>
            <strong>{formatWon(checkpoint.price)}</strong>
            <em>{checkpoint.label === '현재 컨센서스' ? '기준값' : formatPercent(checkpoint.changePercent)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
