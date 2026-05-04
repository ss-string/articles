import { formatPercent, formatWon, type ConsensusCheckpoint, type TargetPriceRange } from '../consensus/model';

type ConsensusTrendLineProps = {
  checkpoints: ConsensusCheckpoint[];
  targetPriceRange?: TargetPriceRange | null;
};

function getRangePrices(targetPriceRange: TargetPriceRange | null | undefined) {
  if (!targetPriceRange) {
    return [];
  }

  return [targetPriceRange.min, targetPriceRange.median, targetPriceRange.max].filter(
    (price): price is number => price !== null,
  );
}

function buildChartScale(checkpoints: ConsensusCheckpoint[], targetPriceRange: TargetPriceRange | null | undefined) {
  const validPrices = [
    ...checkpoints.map((checkpoint) => checkpoint.price),
    ...getRangePrices(targetPriceRange),
  ].filter((price): price is number => price !== null);

  if (validPrices.length === 0) {
    return {
      toY() {
        return 174;
      },
    };
  }

  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  const range = max - min || 1;

  return {
    toY(price: number) {
      return 174 - ((price - min) / range) * 126;
    },
  };
}

function buildPoints(checkpoints: ConsensusCheckpoint[], targetPriceRange: TargetPriceRange | null | undefined) {
  const scale = buildChartScale(checkpoints, targetPriceRange);
  const xByLabel: Record<ConsensusCheckpoint['label'], number> = {
    '현재 가격': 36,
    '지난 6개월': 158,
    '지난 3개월': 280,
    '지난 1개월': 402,
    '현재 컨센서스': 486,
  };

  return checkpoints.flatMap((checkpoint) => {
    if (checkpoint.price === null) {
      return [];
    }

    return [{ ...checkpoint, x: xByLabel[checkpoint.label], y: scale.toY(checkpoint.price) }];
  });
}

export function ConsensusTrendLine({ checkpoints, targetPriceRange = null }: ConsensusTrendLineProps) {
  const points = buildPoints(checkpoints, targetPriceRange);
  const currentPoint = points.find((point) => point.label === '현재 가격') ?? null;
  const consensusPoints = points.filter((point) => point.label !== '현재 가격');
  const path = consensusPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const scale = buildChartScale(checkpoints, targetPriceRange);
  const rangeDots = targetPriceRange
    ? [
        { label: '최저', price: targetPriceRange.min },
        { label: '중앙', price: targetPriceRange.median },
        { label: '최고', price: targetPriceRange.max },
      ].filter((item): item is { label: string; price: number } => item.price !== null)
    : [];
  const pointLabels = currentPoint ? [currentPoint, ...consensusPoints] : consensusPoints;

  return (
    <div className="trend-card">
      <div className="line-chart" role="img" aria-label="컨센서스 가격 선 그래프">
        <svg viewBox="0 0 560 232" aria-hidden="true">
          <path d="M0 174 L560 174" className="chart-grid" />
          <path d="M0 124 L560 124" className="chart-grid" />
          <path d="M0 74 L560 74" className="chart-grid" />
          {currentPoint ? <path d={`M0 ${currentPoint.y} L560 ${currentPoint.y}`} className="current-line" /> : null}
          {consensusPoints.length >= 2 ? <path d={path} className="chart-line" /> : null}
          {currentPoint ? <circle cx={currentPoint.x} cy={currentPoint.y} r="5" className="current-point" /> : null}
          {consensusPoints.map((point) => (
            <g key={point.label}>
              <line x1={point.x} x2={point.x} y1={point.y} y2="204" className="chart-guide" />
              <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            </g>
          ))}
          {rangeDots.length > 0 ? (
            <g>
              <line
                x1="530"
                x2="530"
                y1={Math.min(...rangeDots.map((dot) => scale.toY(dot.price)))}
                y2={Math.max(...rangeDots.map((dot) => scale.toY(dot.price)))}
                className="range-stem"
              />
              {rangeDots.map((dot) => (
                <circle className="range-dot" cx="530" cy={scale.toY(dot.price)} key={dot.label} r="5" />
              ))}
            </g>
          ) : null}
          {rangeDots.length > 0 ? (
            <text className="chart-label" x="530" y="222" textAnchor="middle">
              목표 범위
            </text>
          ) : null}
        </svg>
        {pointLabels.map((point) => (
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
          <div
            className={`checkpoint${checkpoint.label === '현재 가격' ? ' current-price-checkpoint' : ''}`}
            key={checkpoint.label}
          >
            <span>{checkpoint.label}</span>
            <strong>{formatWon(checkpoint.price)}</strong>
            <em>{checkpoint.label === '현재 컨센서스' ? '기준값' : formatPercent(checkpoint.changePercent)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
