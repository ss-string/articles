import { useCallback, useState } from 'react';
import { type HotNewsReport, type RawHotNewsReportRow } from '../hot-news/model';
import type { HotNewsReportScope } from '../hot-news/useHotNewsReports';
import { useHotNewsReportHistory, useHotNewsReports } from '../hot-news/useHotNewsReports';
import { HotNewsReportModal } from './HotNewsReportModal';

type HotNewsReportsPageProps = {
  queryRows?: (issueDate?: string) => Promise<RawHotNewsReportRow[]>;
  queryHistoryRows?: (issueDate: string, perspectiveKey: string) => Promise<RawHotNewsReportRow[]>;
  today?: string;
};

type HotNewsReportModalWithHistoryProps = {
  report: HotNewsReport;
  queryHistoryRows?: (issueDate: string, perspectiveKey: string) => Promise<RawHotNewsReportRow[]>;
  onClose: () => void;
};

function getHistoryKey(report: HotNewsReport) {
  return [report.issueDate ?? 'no-date', report.perspectiveKey ?? 'no-perspective', report.id].join(':');
}

function HotNewsReportModalWithHistory({ report, queryHistoryRows, onClose }: HotNewsReportModalWithHistoryProps) {
  const historyState = useHotNewsReportHistory({
    enabled: !!report.issueDate && !!report.perspectiveKey,
    issueDate: report.issueDate,
    perspectiveKey: report.perspectiveKey,
    queryHistoryRows,
  });

  return <HotNewsReportModal historyState={historyState} report={report} onClose={onClose} />;
}

export function HotNewsReportsPage({
  queryRows,
  queryHistoryRows,
  today,
}: HotNewsReportsPageProps) {
  const [scope, setScope] = useState<HotNewsReportScope>('all');
  const state = useHotNewsReports({ queryRows, scope, today });
  const [selectedReport, setSelectedReport] = useState<HotNewsReport | null>(null);
  const closeSelectedReport = useCallback(() => setSelectedReport(null), []);
  const selectScope = useCallback((nextScope: HotNewsReportScope) => {
    setSelectedReport(null);
    setScope(nextScope);
  }, []);

  return (
    <>
      <section className="dashboard-section hot-news-section" id="hot-news" aria-labelledby="hot-news-title">
        <div className="section-heading hot-news-heading">
          <span>Toss WTS Hot News Reports</span>
          <h2 id="hot-news-title">핫뉴스 리포트</h2>
        </div>
        <p className="hot-news-copy">토스증권 주요 뉴스 묶음을 카드로 훑고, 선택한 이슈의 리포트를 팝업에서 확인합니다.</p>
        <div className="hot-news-scope-toggle" role="group" aria-label="핫뉴스 표시 범위">
          <button
            aria-pressed={scope === 'today'}
            className={scope === 'today' ? 'active' : ''}
            onClick={() => selectScope('today')}
            type="button"
          >
            오늘
          </button>
          <button
            aria-pressed={scope === 'all'}
            className={scope === 'all' ? 'active' : ''}
            onClick={() => selectScope('all')}
            type="button"
          >
            전체
          </button>
        </div>

        {state.status === 'loading' ? <div className="state-panel">핫뉴스 리포트를 불러오는 중입니다.</div> : null}
        {state.status === 'error' ? <div className="state-panel error">{state.error}</div> : null}
        {state.status === 'success' && state.reports.length === 0 ? (
          <div className="state-panel">표시할 핫뉴스 리포트가 없습니다.</div>
        ) : null}

        {state.status === 'success' && state.reports.length > 0 ? (
          <div className="hot-news-grid">
            {state.reports.map((report) => (
              <button
                className="hot-news-card"
                key={report.id}
                onClick={() => setSelectedReport(report)}
                type="button"
              >
                <span className="hot-news-card-date">
                  {report.displayUpdatedAt ? `업데이트 ${report.displayUpdatedAt}` : report.displayDate}
                </span>
                <strong>{report.displayTitle}</strong>
                {report.tldr[0] ? <span className="hot-news-card-summary">{report.tldr[0]}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {selectedReport ? (
        <HotNewsReportModalWithHistory
          key={getHistoryKey(selectedReport)}
          queryHistoryRows={queryHistoryRows}
          report={selectedReport}
          onClose={closeSelectedReport}
        />
      ) : null}
    </>
  );
}
