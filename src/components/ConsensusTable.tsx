import { useState } from 'react';
import { formatPercent, formatWon, type ConsensusRankingRow } from '../consensus/model';
import { ConsensusTrendLine } from './ConsensusTrendLine';

type ConsensusTableProps = {
  rows: ConsensusRankingRow[];
};

export function ConsensusTable({ rows }: ConsensusTableProps) {
  const [openRowKeys, setOpenRowKeys] = useState<Set<string>>(() => new Set());

  return (
    <section className="table-shell" aria-label="컨센서스 랭킹 테이블">
      <div className="table-head">
        <div>종목</div>
        <div>현재가</div>
        <div>적정주가</div>
        <div>갭</div>
        <div>지난 1개월 대비 컨센서스 증가</div>
        <div />
      </div>
      {rows.map((row, index) => {
        const rowKey = `${row.id}-${index}`;
        const isOpen = openRowKeys.has(rowKey);

        return (
          <details
            className="rank-detail"
            key={rowKey}
            onToggle={(event) => {
              const nextIsOpen = event.currentTarget.open;
              setOpenRowKeys((previous) => {
                const next = new Set(previous);
                if (nextIsOpen) {
                  next.add(rowKey);
                } else {
                  next.delete(rowKey);
                }
                return next;
              });
            }}
          >
            <summary className="summary-row" role="button" aria-label={`${row.name} 상세 열기`}>
              <div>
                <div className="stock-name">{row.name}</div>
                {row.code ? <div className="stock-code">{row.code}</div> : null}
              </div>
              <div className="price">{formatWon(row.currentPrice)}</div>
              <div>
                <div className="price">{formatWon(row.fairPrice)}</div>
                <div className="muted">갭 {formatWon(row.gapAmount)}</div>
              </div>
              <div className="gap-positive">{formatPercent(row.gapPercent)}</div>
              <div>
                <div className="gap-bar">
                  <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
                </div>
                <span className="consensus-badge">▲ {formatPercent(row.oneMonthConsensusChangePercent)}</span>
              </div>
              <div className="chevron" aria-hidden="true">
                ⌄
              </div>
            </summary>
            {isOpen ? (
              <div className="expanded-row">
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
                    <span className="consensus-badge">{formatPercent(row.oneMonthConsensusChangePercent)}</span>
                  </h3>
                  <ConsensusTrendLine checkpoints={row.checkpoints} />
                </article>
              </div>
            ) : null}
          </details>
        );
      })}
    </section>
  );
}
