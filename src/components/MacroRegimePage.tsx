import { useEffect, useId, useState } from 'react';
import type { RawMacroRegimeRow, MacroRegimeDecision, MacroKeyIndicator } from '../macro-regime/model';
import { useMacroRegimeDecisions } from '../macro-regime/useMacroRegimeDecisions';

type MacroRegimePageProps = {
  queryRows?: () => Promise<RawMacroRegimeRow[]>;
};

function renderMarkdownText(markdown: string | null) {
  return (markdown ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^#{1,6}\s*/, '').replace(/^\|\s*/, '').replace(/\s*\|$/g, ''));
}

function IndicatorRow({ indicator }: { indicator: MacroKeyIndicator }) {
  return (
    <div className="macro-indicator-row">
      <strong>{indicator.label}</strong>
      <span>{indicator.valueLabel}</span>
      <span className={`macro-trend macro-trend-${indicator.trendTone}`}>{indicator.trendLabel}</span>
      <span>{indicator.source ?? '-'}</span>
      <span>{indicator.interpretation ?? '-'}</span>
    </div>
  );
}

function DecisionCard({ decision, onOpen }: { decision: MacroRegimeDecision; onOpen: () => void }) {
  return (
    <button className="macro-regime-card" type="button" onClick={onOpen}>
      <div className="macro-card-meta">
        <span className="macro-market-chip">{decision.market}</span>
        <time>{decision.dateLabel}</time>
      </div>
      <strong>{decision.regime}</strong>
      <p>{decision.axisSummary}</p>
      <div className="macro-axis-mini-grid">
        {decision.axisAssessments.map((axis) => (
          <span className="macro-axis-mini" key={axis.key}>
            <small>{axis.label}</small>
            <b>{axis.judgment}</b>
          </span>
        ))}
      </div>
    </button>
  );
}

function DetailDialog({ decision, onClose }: { decision: MacroRegimeDecision; onClose: () => void }) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="macro-modal-backdrop" onClick={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="macro-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="macro-modal-header">
          <div>
            <div className="macro-modal-meta">
              <span>{decision.market}</span>
              <time>{decision.dateLabel}</time>
            </div>
            <h3 id={titleId}>{decision.regime}</h3>
          </div>
          <button className="macro-modal-close" type="button" aria-label="상세 팝업 닫기" onClick={onClose}>
            x
          </button>
        </header>
        <div className="macro-modal-body">
          <aside className="macro-modal-nav" aria-label="매크로 레짐 상세 목차">
            {['요약', '4개 축 판단', '핵심 지표', '자산 영향', '리스크', '전문'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </aside>
          <main className="macro-modal-content">
            <section className="macro-popup-panel">
              <span className="macro-panel-kicker">TL;DR</span>
              <p>{decision.summary ?? '-'}</p>
            </section>
            <section className="macro-popup-panel">
              <h4>4개 축 판단</h4>
              <div className="macro-axis-list">
                {decision.axisAssessments.map((axis, index) => (
                  <article className="macro-axis-block" key={axis.key}>
                    <div className="macro-axis-row">
                      <h5>{axis.label}</h5>
                      <span>{index === 0 ? `판단 ${axis.judgment}` : `${axis.label} 판단 ${axis.judgment}`}</span>
                      <span>{axis.confidenceLabel}</span>
                    </div>
                    <p>{axis.rationale || '-'}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="macro-popup-panel">
              <h4>핵심 지표</h4>
              <div className="macro-indicator-table">
                {decision.keyIndicators.length > 0 ? (
                  decision.keyIndicators.map((indicator) => (
                    <IndicatorRow indicator={indicator} key={`${indicator.label}-${indicator.source ?? 'unknown'}`} />
                  ))
                ) : (
                  <p>표시할 핵심 지표가 없습니다.</p>
                )}
              </div>
            </section>
            <section className="macro-popup-panel">
              <h4>자산 영향</h4>
              <ul>
                {decision.assetImplications.length > 0 ? (
                  decision.assetImplications.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>표시할 자산 영향이 없습니다.</li>
                )}
              </ul>
            </section>
            <section className="macro-popup-panel">
              <h4>리스크</h4>
              <ul>
                {decision.riskFactors.length > 0 ? (
                  decision.riskFactors.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>표시할 리스크가 없습니다.</li>
                )}
              </ul>
            </section>
            <section className="macro-popup-panel">
              <h4>전문</h4>
              {renderMarkdownText(decision.contentMarkdown).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}

export function MacroRegimePage({ queryRows }: MacroRegimePageProps) {
  const state = useMacroRegimeDecisions({ queryRows });
  const [selectedDecision, setSelectedDecision] = useState<MacroRegimeDecision | null>(null);

  const statusContent =
    state.status === 'loading' ? (
      <div className="state-panel">매크로 레짐 데이터를 불러오는 중입니다.</div>
    ) : state.status === 'error' ? (
      <div className="state-panel error">{state.error}</div>
    ) : state.decisions.length === 0 ? (
      <div className="state-panel">표시할 매크로 레짐 데이터가 없습니다.</div>
    ) : null;

  return (
    <section className="dashboard-section macro-regime-section" id="macro-regime" aria-labelledby="macro-regime-title">
      <div className="section-heading">
        <span>Macro Regime</span>
        <h2 id="macro-regime-title">최신 매크로 레짐 판단</h2>
      </div>
      <p className="macro-regime-copy">
        국가별 최신 레짐 판단을 먼저 확인하고, 카드를 선택하면 화면 전환 없이 상세 설명을 모두 읽습니다.
      </p>
      {statusContent}
      {state.status === 'success' && state.decisions.length > 0 ? (
        <div className="macro-regime-grid">
          {state.decisions.map((decision) => (
            <DecisionCard decision={decision} key={decision.id} onOpen={() => setSelectedDecision(decision)} />
          ))}
        </div>
      ) : null}
      {selectedDecision ? <DetailDialog decision={selectedDecision} onClose={() => setSelectedDecision(null)} /> : null}
    </section>
  );
}
