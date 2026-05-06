import { formatPercent, formatWon, type ConsensusRankingRow } from '../consensus/model';

type ConsensusTableProps = {
  rows: ConsensusRankingRow[];
  onSelect: (row: ConsensusRankingRow) => void;
};

function getGapClassName(gapPercent: number) {
  if (gapPercent > 0) {
    return 'gap-positive';
  }

  if (gapPercent < 0) {
    return 'gap-negative';
  }

  return 'gap-neutral';
}

function getPricePositionPercent(row: ConsensusRankingRow) {
  return (row.currentPrice / row.fairPrice) * 100;
}

function formatPricePositionPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatGapAmount(value: number) {
  return `${value >= 0 ? '+' : '-'}${formatWon(Math.abs(value))}`;
}

export function ConsensusTable({ rows, onSelect }: ConsensusTableProps) {
  return (
    <section className="table-shell" role="table" aria-label="컨센서스 랭킹 테이블">
      <div className="table-head" role="row">
        <div role="columnheader">종목</div>
        <div role="columnheader">현재가</div>
        <div role="columnheader">적정가</div>
        <div role="columnheader">갭</div>
        <div role="columnheader">적정가 대비 현재가</div>
      </div>
      {rows.map((row, index) => {
        const rowKey = `${row.id}-${index}`;
        const pricePositionPercent = getPricePositionPercent(row);
        const cappedPricePositionPercent = Number(Math.min(Math.max(pricePositionPercent, 0), 100).toFixed(1));
        const isPricePositionOverflow = pricePositionPercent > 100;

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
              </div>
              <div className={getGapClassName(row.gapPercent)} role="cell">
                <div>{formatGapAmount(row.gapAmount)}</div>
                <div>{formatPercent(row.gapPercent)}</div>
              </div>
              <div role="cell">
                <div className="price-position">
                  <div
                    className={`price-position-bar${isPricePositionOverflow ? ' is-overflow' : ''}`}
                    aria-label={`현재가가 적정주가의 ${formatPricePositionPercent(pricePositionPercent)} 수준${
                      isPricePositionOverflow ? '으로 초과했습니다.' : '입니다.'
                    }`}
                  >
                    <span style={{ width: `${cappedPricePositionPercent}%` }} />
                  </div>
                  {isPricePositionOverflow ? (
                    <span className="price-position-overflow">
                      초과 {formatPricePositionPercent(pricePositionPercent)}
                    </span>
                  ) : (
                    <span className="price-position-value">{formatPricePositionPercent(pricePositionPercent)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
