import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  selectReportHistory,
  type AgentKey,
  type AiInvestmentReport,
  type AiReportScoreKey,
  type MarkdownBlock,
  type RawAiInvestmentReportRow,
} from '../ai-reports/model';
import { useAiInvestmentReports } from '../ai-reports/useAiInvestmentReports';

type AiAnalysisReportsPageProps = {
  queryRows?: () => Promise<RawAiInvestmentReportRow[]>;
};

const scoreCards: Array<{ key: AiReportScoreKey; label: string; getValue: (report: AiInvestmentReport) => number | null }> =
  [
    { key: 'total', label: 'totalScore', getValue: (report) => report.totalScore },
    { key: 'momentum', label: 'momentum', getValue: (report) => report.momentumScore },
    { key: 'technical', label: 'technical', getValue: (report) => report.technicalScore },
    { key: 'valuation', label: 'valuation', getValue: (report) => report.valuationScore },
  ];

const agentLabels: Record<AgentKey, string> = {
  momentum: 'Momentum Agent',
  technical: 'Technical Agent',
  valuation: 'Valuation Agent',
};

function getScoreLabel(value: number | null) {
  return value === null ? '-' : String(value);
}

function compareSearchReportEntries(
  left: { report: SearchReport; index: number },
  right: { report: SearchReport; index: number },
) {
  const leftScore = left.report.totalScore;
  const rightScore = right.report.totalScore;

  if (leftScore !== null && rightScore === null) {
    return -1;
  }

  if (leftScore === null && rightScore !== null) {
    return 1;
  }

  if (leftScore !== null && rightScore !== null && rightScore !== leftScore) {
    return rightScore - leftScore;
  }

  if (right.report.sortTimestamp !== left.report.sortTimestamp) {
    return right.report.sortTimestamp - left.report.sortTimestamp;
  }

  return left.index - right.index;
}

function getReportSummary(report: AiInvestmentReport) {
  if (report.investmentThesis) {
    return report.investmentThesis;
  }

  const firstParagraph = report.markdownBlocks.find((block) => block.type === 'paragraph');
  if (!firstParagraph || firstParagraph.type !== 'paragraph') {
    return report.contentMd;
  }

  return firstParagraph.parts.map((part) => part.text).join('');
}

function renderMarkdownBlock(block: MarkdownBlock, index: number) {
  if (block.type === 'heading') {
    const HeadingTag = block.level === 2 ? 'h3' : 'h4';
    return <HeadingTag key={`${block.text}-${index}`}>{block.text}</HeadingTag>;
  }

  return (
    <p key={`paragraph-${index}`}>
      {block.parts.map((part, partIndex) =>
        part.strong ? (
          <strong key={`${part.text}-${partIndex}`}>{part.text}</strong>
        ) : (
          <span key={`${part.text}-${partIndex}`}>{part.text}</span>
        ),
      )}
    </p>
  );
}

function renderList(items: string[], emptyText: string) {
  if (items.length === 0) {
    return <p className="ai-report-muted">{emptyText}</p>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

type SearchReport = AiInvestmentReport & { historyCount: number };

function AiReportSearch({
  reports,
  emptyReports,
  activeReportId,
  query,
  onQueryChange,
  onSelect,
}: {
  reports: SearchReport[];
  emptyReports: SearchReport[];
  activeReportId: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (stockCode: string, reportId?: string) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;
  const filteredReports = hasSearchQuery
    ? reports.filter(
        (report) =>
          report.stockName.toLowerCase().includes(normalizedQuery) ||
          report.stockCode.toLowerCase().includes(normalizedQuery),
      )
    : emptyReports;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSearchQuery) {
      return;
    }

    const firstReport = filteredReports[0];
    if (firstReport) {
      onSelect(firstReport.stockCode, firstReport.id);
      onQueryChange(firstReport.stockName);
    }
  }

  return (
    <section className="ai-report-search-panel" role="search" aria-label="AI 분석 리포트 검색">
      <form className="ai-report-search-form" onSubmit={handleSubmit}>
        <input
          aria-label="종목명 또는 종목코드 검색"
          id="ai-report-search-input"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="종목명 또는 종목코드 검색"
          type="search"
          value={query}
        />
        <button type="submit">검색</button>
      </form>
      {!hasSearchQuery ? <p className="ai-report-search-helper">totalScore 상위 추천</p> : null}
      <div className="ai-report-search-results" aria-label="검색 결과">
        {filteredReports.map((report) => (
          <button
            aria-pressed={activeReportId === report.id}
            className={`ai-report-search-chip ${activeReportId === report.id ? 'active' : ''}`}
            key={report.id}
            type="button"
            onClick={() => {
              onSelect(report.stockCode, report.id);
              onQueryChange(report.stockName);
            }}
          >
            {report.stockName} {report.stockCode} · totalScore {getScoreLabel(report.totalScore)} · {report.historyCount}건
          </button>
        ))}
      </div>
    </section>
  );
}

function ReportHistoryList({
  report,
  history,
  selectedReportId,
  onSelect,
}: {
  report: AiInvestmentReport;
  history: AiInvestmentReport[];
  selectedReportId: string;
  onSelect: (reportId: string) => void;
}) {
  return (
    <section className="ai-report-panel" aria-label={`${report.stockName} 리포트 이력`}>
      <div className="ai-report-panel-title">
        <span>리포트 이력</span>
        <strong>{history.length.toLocaleString('ko-KR')}건</strong>
      </div>
      <div className="ai-report-history-list">
        {history.map((historyReport) => (
          <button
            aria-pressed={selectedReportId === historyReport.id}
            className={`ai-report-history-card ${selectedReportId === historyReport.id ? 'active' : ''}`}
            key={historyReport.id}
            type="button"
            onClick={() => onSelect(historyReport.id)}
          >
            <strong>업데이트 {historyReport.displayUpdatedAt ?? historyReport.updatedAt ?? '-'}</strong>
            <span>{history.indexOf(historyReport) === 0 ? '최신 리포트' : '과거 리포트'}</span>
            <span>발행일 {historyReport.issueDate ?? '-'}</span>
            <span>{historyReport.recommendation ?? '추천 없음'}</span>
            <span>totalScore {getScoreLabel(historyReport.totalScore)}</span>
            <small>
              momentum {getScoreLabel(historyReport.momentumScore)} · technical {getScoreLabel(historyReport.technicalScore)} ·
              valuation {getScoreLabel(historyReport.valuationScore)}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}

function ScoreSelector({
  report,
  selectedScore,
  onSelect,
}: {
  report: AiInvestmentReport;
  selectedScore: AiReportScoreKey;
  onSelect: (scoreKey: AiReportScoreKey) => void;
}) {
  return (
    <div className="ai-report-score-grid" role="group" aria-label="점수 선택">
      {scoreCards.map((score) => {
        const value = score.getValue(report);
        return (
          <button
            aria-label={`${score.label} ${getScoreLabel(value)}`}
            aria-pressed={selectedScore === score.key}
            className={`ai-report-score-card ${selectedScore === score.key ? 'active' : ''}`}
            key={score.key}
            type="button"
            onClick={() => onSelect(score.key)}
          >
            <span>{score.label}</span>
            <strong>{getScoreLabel(value)}</strong>
          </button>
        );
      })}
    </div>
  );
}

function RecommendationPanel({ report }: { report: AiInvestmentReport }) {
  return (
    <section className="ai-report-recommendation" aria-label="추천 의견">
      <strong>{report.recommendation ?? '추천 없음'}</strong>
      <span>totalScore {getScoreLabel(report.totalScore)}</span>
    </section>
  );
}

function TotalReportView({ report }: { report: AiInvestmentReport }) {
  const hasTldr = Boolean(report.investmentThesis);

  return (
    <div className={`ai-report-total-view ${hasTldr ? '' : 'no-tldr'}`}>
      {hasTldr ? (
        <section className="ai-report-content-card ai-report-tldr-card" aria-label="TL;DR">
          <h3>TL;DR</h3>
          <p>{report.investmentThesis}</p>
        </section>
      ) : null}

      <section className="ai-report-content-card ai-report-content-md-card" aria-label="투자위원회 의견">
        <div className="ai-report-markdown">{report.markdownBlocks.map(renderMarkdownBlock)}</div>
      </section>

      <section className="ai-report-content-card ai-report-action-card" aria-label="액션 플랜">
        <h3>액션 플랜</h3>
        <div className="ai-report-current-price">
          <span>현재가</span>
          <strong>{report.currentPriceLabel}</strong>
        </div>
        <dl className="ai-report-action-list">
          {report.actionPlan.hold ? (
            <>
              <dt>hold</dt>
              <dd>{report.actionPlan.hold}</dd>
            </>
          ) : null}
          {report.actionPlan.entry ? (
            <>
              <dt>entry</dt>
              <dd>{report.actionPlan.entry}</dd>
            </>
          ) : null}
          {report.actionPlan.exitOrReview ? (
            <>
              <dt>exitOrReview</dt>
              <dd>{report.actionPlan.exitOrReview}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section className="ai-report-content-card ai-report-bull-card" aria-label="강세 근거">
        <h3>강세 근거</h3>
        {renderList(report.bullFindings, '강세 근거가 없습니다.')}
      </section>

      <section className="ai-report-content-card ai-report-bear-card" aria-label="약세 근거">
        <h3>약세 근거</h3>
        {renderList(report.bearFindings, '약세 근거가 없습니다.')}
      </section>

      <section className="ai-report-content-card ai-report-risk-card" aria-label="리스크 체크리스트">
        <h3>리스크 체크리스트</h3>
        {renderList(report.riskChecklist, '리스크 체크리스트가 없습니다.')}
      </section>

      <section className="ai-report-content-card ai-report-debug-card" aria-label="DB row 매핑">
        <h3>DB row 매핑</h3>
        <dl className="ai-report-meta-list">
          <dt>row id</dt>
          <dd>{report.id}</dd>
          <dt>stock_code</dt>
          <dd>{report.stockCode}</dd>
          <dt>issue_date</dt>
          <dd>{report.issueDate ?? '-'}</dd>
          <dt>updated_at</dt>
          <dd>{report.updatedAt ?? '-'}</dd>
        </dl>
      </section>
    </div>
  );
}

function AgentReportView({ report, scoreKey }: { report: AiInvestmentReport; scoreKey: AgentKey }) {
  const agent = report.agents[scoreKey];

  if (!agent) {
    const fallbackFindings = [
      ...report.bullFindings.map((finding) => ({ type: 'bull', evidence: finding })),
      ...report.bearFindings.map((finding) => ({ type: 'bear', evidence: finding })),
    ];

    return (
      <div className="ai-report-agent-view">
        <section className="ai-report-content-card">
          <div className="ai-report-agent-header">
            <h3>{agentLabels[scoreKey]}</h3>
            <span>score {getScoreLabel(scoreCards.find((score) => score.key === scoreKey)?.getValue(report) ?? null)}</span>
          </div>
          <h4>summary</h4>
          <p>{report.investmentThesis ?? getReportSummary(report)}</p>
          <p className="ai-report-muted">agent_outputs가 없어 report_payload 기반으로 표시합니다.</p>
        </section>

        <section className="ai-report-content-card">
          <h4>findings</h4>
          <div className="ai-report-finding-list">
            {fallbackFindings.length > 0 ? (
              fallbackFindings.map((finding, index) => (
                <article className="ai-report-finding-card" key={`${finding.type}-${finding.evidence}-${index}`}>
                  <div>
                    <span className={`ai-report-badge ${finding.type}`}>{finding.type}</span>
                    <span className="ai-report-badge missing">evidence/confidence 없음</span>
                  </div>
                  <p>{finding.evidence}</p>
                </article>
              ))
            ) : (
              <p className="ai-report-muted">표시할 발견사항이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="ai-report-content-card">
          <h4>risks</h4>
          {renderList(report.riskChecklist, '표시할 리스크가 없습니다.')}
        </section>

        <section className="ai-report-content-card">
          <h4>limitations</h4>
          <p className="ai-report-muted">agent_outputs가 없어 상세 limitations가 없습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="ai-report-agent-view">
      <section className="ai-report-content-card">
        <div className="ai-report-agent-header">
          <h3>{agent.label}</h3>
          <span>score {getScoreLabel(agent.score)}</span>
          {agent.stance ? <span>stance {agent.stance}</span> : null}
        </div>
        <h4>summary</h4>
        <p>{agent.summary ?? 'summary가 없습니다.'}</p>
      </section>

      <section className="ai-report-content-card">
        <h4>findings</h4>
        <div className="ai-report-finding-list">
          {agent.findings.length > 0 ? (
            agent.findings.map((finding, index) => (
              <article className="ai-report-finding-card" key={`${finding.evidence}-${index}`}>
                <div>
                  <span className={`ai-report-badge ${finding.type === 'bear' ? 'bear' : 'bull'}`}>{finding.type}</span>
                  {finding.confidence ? <span className="ai-report-badge confidence">{finding.confidence}</span> : null}
                </div>
                <p>{finding.evidence}</p>
              </article>
            ))
          ) : (
            <p className="ai-report-muted">finding이 없습니다.</p>
          )}
        </div>
      </section>

      <section className="ai-report-content-card">
        <h4>risks</h4>
        {renderList(agent.risks, 'risk가 없습니다.')}
      </section>

      <section className="ai-report-content-card">
        <h4>limitations</h4>
        {renderList(agent.limitations, 'limitation이 없습니다.')}
      </section>
    </div>
  );
}

export function AiAnalysisReportsPage({ queryRows }: AiAnalysisReportsPageProps) {
  const state = useAiInvestmentReports({ queryRows });
  const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<AiReportScoreKey>('total');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const reports = state.status === 'success' ? state.catalog.reports : [];
  const representatives = state.status === 'success' ? state.catalog.representativeReports : [];
  const historyCountsByStockCode = useMemo(
    () =>
      reports.reduce((counts, report) => {
        counts.set(report.stockCode, (counts.get(report.stockCode) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    [reports],
  );
  const representativeSearchReports = useMemo<SearchReport[]>(
    () =>
      representatives.map((report) => ({
        ...report,
        historyCount: historyCountsByStockCode.get(report.stockCode) ?? 0,
      })),
    [historyCountsByStockCode, representatives],
  );
  const emptySearchReports = useMemo<SearchReport[]>(
    () =>
      reports
        .map((report, index) => ({
          report: {
            ...report,
            historyCount: historyCountsByStockCode.get(report.stockCode) ?? 0,
          },
          index,
        }))
        .sort(compareSearchReportEntries)
        .slice(0, 10)
        .map(({ report }) => report),
    [historyCountsByStockCode, reports],
  );
  const selectedRepresentativeExists = representatives.some((report) => report.stockCode === selectedStockCode);
  const activeStockCode = selectedRepresentativeExists ? selectedStockCode : null;
  const displayedSearchQuery = searchQuery ?? '';
  const history = useMemo(() => (activeStockCode ? selectReportHistory(reports, activeStockCode) : []), [activeStockCode, reports]);
  const selectedReport = activeStockCode ? history.find((report) => report.id === selectedReportId) ?? history[0] ?? null : null;

  useEffect(() => {
    if (state.status === 'success' && selectedStockCode && !selectedRepresentativeExists) {
      setSelectedStockCode(null);
      setSelectedReportId(null);
      setSelectedScore('total');
    }
  }, [selectedRepresentativeExists, selectedStockCode, state.status]);

  function handleSelectStock(stockCode: string, reportId?: string) {
    setSelectedStockCode(stockCode);
    setSelectedReportId(reportId ?? null);
    setSelectedScore('total');
  }

  function handleSelectReport(reportId: string) {
    setSelectedReportId(reportId);
    setSelectedScore('total');
  }

  return (
    <section className="analysis-section ai-report-section" aria-labelledby="ai-report-title">
      <div className="section-heading">
        <span>자동 분석 요약</span>
        <h2 id="ai-report-title">AI 분석 리포트</h2>
      </div>

      {state.status === 'loading' ? <div className="state-panel">AI 분석 리포트를 불러오는 중입니다.</div> : null}
      {state.status === 'error' ? <div className="state-panel error">{state.error}</div> : null}
      {state.status === 'success' && representatives.length === 0 ? (
        <div className="state-panel">표시할 AI 분석 리포트가 없습니다.</div>
      ) : null}
      {state.status === 'success' && representatives.length > 0 ? (
        <>
          <AiReportSearch
            activeReportId={selectedReport?.id ?? null}
            emptyReports={emptySearchReports}
            query={displayedSearchQuery}
            reports={representativeSearchReports}
            onQueryChange={setSearchQuery}
            onSelect={handleSelectStock}
          />

          {selectedReport ? (
            <div className="ai-report-layout">
              <div className="ai-report-sidebar">
                <ReportHistoryList
                  history={history}
                  report={selectedReport}
                  selectedReportId={selectedReport.id}
                  onSelect={handleSelectReport}
                />
              </div>

              <div className="ai-report-main">
                <section className="ai-report-detail-hero" aria-label="선택 리포트 분석 결과">
                  <div>
                    <span>
                      {selectedReport.stockCode} · {selectedReport.issueDate ?? selectedReport.displayUpdatedAt ?? '-'}
                    </span>
                    <h3>{selectedReport.stockName}</h3>
                  </div>
                  <RecommendationPanel report={selectedReport} />
                </section>

                <ScoreSelector report={selectedReport} selectedScore={selectedScore} onSelect={setSelectedScore} />

                {selectedScore === 'total' ? (
                  <TotalReportView report={selectedReport} />
                ) : (
                  <AgentReportView report={selectedReport} scoreKey={selectedScore} />
                )}
              </div>
            </div>
          ) : (
            <div className="ai-report-layout">
              <div className="ai-report-sidebar">
                <section className="ai-report-panel" aria-label="리포트 이력 미선택 상태">
                  <div className="ai-report-panel-title">
                    <span>리포트 이력</span>
                    <strong>미선택</strong>
                  </div>
                  <p className="ai-report-muted">선택된 종목이 없습니다.</p>
                </section>
              </div>
              <div className="ai-report-main">
                <section className="ai-report-empty-detail state-panel" aria-label="상세 미선택 상태">
                  <strong>리포트를 선택해 분석 내용을 확인하세요.</strong>
                  <p>상단의 추천 종목이나 검색 결과를 선택하면 분석 본문과 점수 카드가 표시됩니다.</p>
                  <div className="ai-report-score-grid ai-report-score-grid-placeholder" aria-hidden="true">
                    {scoreCards.map((score) => (
                      <div className="ai-report-score-card" key={score.key}>
                        <span>{score.label}</span>
                        <strong>-</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
