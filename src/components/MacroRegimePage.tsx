import { useEffect, useId, useRef, useState } from 'react';
import type { RawMacroRegimeRow, MacroRegimeDecision, MacroKeyIndicator } from '../macro-regime/model';
import { useMacroRegimeDecisions } from '../macro-regime/useMacroRegimeDecisions';

type MacroRegimePageProps = {
  queryRows?: () => Promise<RawMacroRegimeRow[]>;
};

const detailSections = [
  { id: 'macro-summary', label: '요약' },
  { id: 'macro-axis-assessments', label: '4개 축 판단' },
  { id: 'macro-key-indicators', label: '핵심 지표' },
  { id: 'macro-asset-implications', label: '자산 영향' },
  { id: 'macro-risk-factors', label: '리스크' },
  { id: 'macro-full-content', label: '전문' },
] as const;

function renderMarkdownText(markdown: string | null) {
  return (markdown ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^#{1,6}\s*/, '').replace(/^\|\s*/, '').replace(/\s*\|$/g, ''))
    .filter((line) => !/^as\s+of\b/i.test(line) && !/updated_at\s*최신/i.test(line))
    .filter((line) => !/^\d{4}-\d{2}-\d{2}\s+(KR|US)\s+매크로\s+레짐/.test(line));
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
        <time dateTime={decision.runDate}>{decision.dateLabel}</time>
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
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  function moveToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ block: 'start' });
  }

  return (
    <div className="macro-modal-backdrop" onClick={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="macro-modal"
        ref={dialogRef}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="macro-modal-header">
          <div>
            <div className="macro-modal-meta">
              <span>{decision.market}</span>
              <time dateTime={decision.runDate}>{decision.dateLabel}</time>
            </div>
            <h3 id={titleId}>{decision.regime}</h3>
          </div>
          <button
            className="macro-modal-close"
            type="button"
            aria-label="상세 팝업 닫기"
            ref={closeButtonRef}
            onClick={onClose}
          >
            x
          </button>
        </header>
        <div className="macro-modal-body">
          <aside className="macro-modal-nav" aria-label="매크로 레짐 상세 목차">
            {detailSections.map((item) => (
              <button type="button" key={item.id} onClick={() => moveToSection(item.id)}>
                {item.label}
              </button>
            ))}
          </aside>
          <div className="macro-modal-content">
            <section className="macro-popup-panel" id="macro-summary">
              <h4>요약</h4>
              <span className="macro-panel-kicker">TL;DR</span>
              <p>{decision.summary ?? '-'}</p>
            </section>
            <section className="macro-popup-panel" id="macro-axis-assessments">
              <h4>4개 축 판단</h4>
              <div className="macro-axis-list">
                {decision.axisAssessments.map((axis) => (
                  <article className="macro-axis-block" key={axis.key}>
                    <div className="macro-axis-row">
                      <h5>{axis.label}</h5>
                      <span>판단 {axis.judgment}</span>
                      <span>{axis.confidenceLabel}</span>
                    </div>
                    <p>{axis.rationale || '-'}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="macro-popup-panel" id="macro-key-indicators">
              <h4>핵심 지표</h4>
              <div className="macro-indicator-table">
                {decision.keyIndicators.length > 0 ? (
                  decision.keyIndicators.map((indicator, index) => (
                    <IndicatorRow
                      indicator={indicator}
                      key={`${indicator.label}-${indicator.source ?? 'unknown'}-${index}`}
                    />
                  ))
                ) : (
                  <p>표시할 핵심 지표가 없습니다.</p>
                )}
              </div>
            </section>
            <section className="macro-popup-panel" id="macro-asset-implications">
              <h4>자산 영향</h4>
              <ul>
                {decision.assetImplications.length > 0 ? (
                  decision.assetImplications.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)
                ) : (
                  <li>표시할 자산 영향이 없습니다.</li>
                )}
              </ul>
            </section>
            <section className="macro-popup-panel" id="macro-risk-factors">
              <h4>리스크</h4>
              <ul>
                {decision.riskFactors.length > 0 ? (
                  decision.riskFactors.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)
                ) : (
                  <li>표시할 리스크가 없습니다.</li>
                )}
              </ul>
            </section>
            <section className="macro-popup-panel" id="macro-full-content">
              <h4>전문</h4>
              {renderMarkdownText(decision.contentMarkdown).map((line, index) => (
                <p key={`${index}-${line}`}>{line}</p>
              ))}
            </section>
          </div>
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
