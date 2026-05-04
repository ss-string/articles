import { useState } from 'react';
import { formatPercent, formatWon, type ConsensusRankingRow } from '../consensus/model';
import { ConsensusTrendLine } from './ConsensusTrendLine';

type ConsensusTableProps = {
  rows: ConsensusRankingRow[];
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

export function ConsensusTable({ rows }: ConsensusTableProps) {
  const [openRowKeys, setOpenRowKeys] = useState<Set<string>>(() => new Set());

  return (
    <section className="table-shell" role="table" aria-label="컨센서스 랭킹 테이블">
      <div className="table-head" role="row">
        <div role="columnheader">종목</div>
        <div role="columnheader">현재가</div>
        <div role="columnheader">적정주가</div>
        <div role="columnheader">갭</div>
        <div role="columnheader">지난 1개월 대비 컨센서스 증가</div>
        <div role="columnheader">상세</div>
      </div>
      {rows.map((row, index) => {
        const rowKey = `${row.id}-${index}`;
        const isOpen = openRowKeys.has(rowKey);
        const detailId = `consensus-detail-${index}`;

        return (
          <div className="rank-detail" key={rowKey}>
            <div className="summary-row" role="row">
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
              <div className="gap-positive" role="cell">
                {formatPercent(row.gapPercent)}
              </div>
              <div role="cell">
                <div className="gap-bar">
                  <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
                </div>
                <span className="consensus-badge">{formatOneMonthBadge(row.oneMonthConsensusChangePercent)}</span>
              </div>
              <div role="cell">
                <button
                  className="chevron"
                  type="button"
                  aria-controls={detailId}
                  aria-expanded={isOpen}
                  aria-label={`${row.name} 상세 ${isOpen ? '닫기' : '열기'}`}
                  onClick={() => {
                    setOpenRowKeys((previous) => {
                      const next = new Set(previous);
                      if (isOpen) {
                        next.delete(rowKey);
                      } else {
                        next.add(rowKey);
                      }
                      return next;
                    });
                  }}
                >
                  ⌄
                </button>
              </div>
            </div>
            {isOpen ? (
              <div className="expanded-row" id={detailId} role="region" aria-label={`${row.name} 상세 정보`}>
                <article className="detail-card">
                  <h3>가격 비교</h3>
                  <div className="price-compare">
                    <div className="price-tile">
                      <span>현재 가격</span>
                      <strong>{formatWon(row.currentPrice)}</strong>
                    </div>
                    <div className="price-tile">
                      <span>적정주가</span>
                      <strong>{formatWon(row.fairPrice)}</strong>
                    </div>
                  </div>
                  <div className="gap-bar large">
                    <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
                  </div>
                  <p className="muted">현재가가 적정주가 대비 {formatWon(row.gapAmount)} 낮습니다.</p>
                </article>
                <article className="detail-card">
                  <h3>
                    컨센서스 가격 변화
                    <span className="consensus-badge">{formatOneMonthBadge(row.oneMonthConsensusChangePercent)}</span>
                  </h3>
                  <ConsensusTrendLine checkpoints={row.checkpoints} />
                </article>
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
