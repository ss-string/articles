import { useEffect } from 'react';
import { formatPercent, formatWon, type ConsensusRankingRow, type SecuritiesFirmSummary } from '../consensus/model';
import { ConsensusTrendLine } from './ConsensusTrendLine';

type ConsensusDetailModalProps = {
  row: ConsensusRankingRow;
  onClose: () => void;
};

function formatGapDescription(gapAmount: number) {
  if (gapAmount > 0) {
    return `현재가가 적정주가 대비 ${formatWon(gapAmount)} 낮습니다.`;
  }

  if (gapAmount < 0) {
    return `현재가가 적정주가 대비 ${formatWon(Math.abs(gapAmount))} 높습니다.`;
  }

  return '현재가와 적정주가가 같습니다.';
}

function formatRecommendation(firm: SecuritiesFirmSummary) {
  const recommendation = firm.recommendations.find((item) => item.length > 0) ?? '-';
  return `${recommendation} · ${firm.reportCount.toLocaleString('ko-KR')}건`;
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function ConsensusDetailModal({ row, onClose }: ConsensusDetailModalProps) {
  const report = row.summaryReport;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-layer" data-testid="detail-modal-backdrop" role="presentation" onClick={onClose}>
      <article
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">Content modal · {row.gicode ?? row.code ?? row.name}</span>
            <h2 id="detail-modal-title">{row.name} 상세 분석</h2>
            <p>
              {row.code ?? '-'} · 컨센서스 리포트 {row.reportCount?.toLocaleString('ko-KR') ?? '-'}개 기반 · AI 리포트
              업데이트 {formatUpdatedAt(report?.updatedAt ?? null)}
            </p>
          </div>
          <button className="close-button" type="button" aria-label="닫기" onClick={onClose}>
            x
          </button>
        </header>

        <div className="modal-body">
          <div className="detail-grid">
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
              <p className="muted">{formatGapDescription(row.gapAmount)}</p>
              <div className="target-range-inline">
                <h3>목표주가 범위</h3>
                <div className="range-grid">
                  <div>
                    <span>최저</span>
                    <strong>{formatWon(report?.targetPriceRange.min ?? null)}</strong>
                  </div>
                  <div>
                    <span>중앙값</span>
                    <strong>{formatWon(report?.targetPriceRange.median ?? null)}</strong>
                  </div>
                  <div>
                    <span>최고</span>
                    <strong>{formatWon(report?.targetPriceRange.max ?? null)}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h3>
                컨센서스 가격 변화
                <span className="consensus-badge">{formatPercent(row.oneMonthConsensusChangePercent)}</span>
              </h3>
              <ConsensusTrendLine checkpoints={row.checkpoints} targetPriceRange={report?.targetPriceRange ?? null} />
            </article>
          </div>

          {report ? (
            <div className="ai-grid">
              <div className="ai-left">
                <article className="detail-card ai-report">
                  <h3>AI 컨센서스 요약</h3>
                  <p>{report.tlDr ?? 'AI 컨센서스 요약이 없습니다.'}</p>
                  <div className="keyword-row">
                    {report.keyKeywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                </article>

                <article className="detail-card risk-card">
                  <h3>주요 리스크</h3>
                  <ul className="risk-list">
                    {report.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <article className="detail-card">
                <h3>증권사별 목표가</h3>
                <div className="firm-list">
                  {report.securitiesFirms.map((firm) => (
                    <div className="firm-row" key={firm.name}>
                      <span>{firm.name}</span>
                      <strong>{formatWon(firm.targetPrices[0] ?? null)}</strong>
                      <em>{formatRecommendation(firm)}</em>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <article className="detail-card ai-report">
              <h3>AI 컨센서스 요약</h3>
              <p>AI 분석 리포트가 없습니다.</p>
            </article>
          )}
        </div>
      </article>
    </div>
  );
}
