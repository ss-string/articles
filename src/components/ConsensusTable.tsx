import { formatPercent, formatWon, type ConsensusRankingRow } from '../consensus/model';

type ConsensusTableProps = {
  rows: ConsensusRankingRow[];
  onSelect: (row: ConsensusRankingRow) => void;
};

function formatOneMonthBadge(value: number | null) {
  if (value === null) {
    return '-';
  }

  if (value > 0) {
    return `▲ ${formatPercent(value)}`;
  }

  if (value < 0) {
    return `▼ ${formatPercent(value)}`;
  }

  return '0.0%';
}

function getGapClassName(gapPercent: number) {
  if (gapPercent > 0) {
    return 'gap-positive';
  }

  if (gapPercent < 0) {
    return 'gap-negative';
  }

  return 'gap-neutral';
}

export function ConsensusTable({ rows, onSelect }: ConsensusTableProps) {
  return (
    <section className="table-shell" role="table" aria-label="컨센서스 랭킹 테이블">
      <div className="table-head" role="row">
        <div role="columnheader">종목</div>
        <div role="columnheader">현재가</div>
        <div role="columnheader">적정주가</div>
        <div role="columnheader">갭</div>
        <div role="columnheader">지난 1개월 대비 컨센서스 증가</div>
      </div>
      {rows.map((row, index) => {
        const rowKey = `${row.id}-${index}`;

        return (
          <div className="rank-detail" key={rowKey} role="rowgroup">
            <div
              className="summary-row"
              role="row"
              tabIndex={0}
              onClick={() => onSelect(row)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(row);
                }
              }}
            >
              <div role="cell">
                <div className="stock-name">{row.name}</div>
                {row.code ? <div className="stock-code">{row.code}</div> : null}
              </div>
              <div className="price" role="cell">
                {formatWon(row.currentPrice)}
              </div>
              <div role="cell">
                <div className="price">{formatWon(row.fairPrice)}</div>
                <div className="muted">갭 {formatWon(row.gapAmount)}</div>
              </div>
              <div className={getGapClassName(row.gapPercent)} role="cell">
                {formatPercent(row.gapPercent)}
              </div>
              <div role="cell">
                <div className="gap-bar">
                  <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
                </div>
                <span className="consensus-badge">{formatOneMonthBadge(row.oneMonthConsensusChangePercent)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
