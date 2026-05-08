import { useCallback, useState } from 'react';
import { formatIssueDate, type HotNewsReport, type RawHotNewsReportRow } from '../hot-news/model';
import { useHotNewsReportHistory, useHotNewsReports } from '../hot-news/useHotNewsReports';
import { HotNewsReportModal } from './HotNewsReportModal';

type HotNewsReportsPageProps = {
  queryRows?: (issueDate?: string) => Promise<RawHotNewsReportRow[]>;
  queryLatestIssueDate?: () => Promise<string | null>;
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
  queryLatestIssueDate,
  queryHistoryRows,
  today,
}: HotNewsReportsPageProps) {
  const state = useHotNewsReports({ queryRows, queryLatestIssueDate, today });
  const [selectedReport, setSelectedReport] = useState<HotNewsReport | null>(null);
  const closeSelectedReport = useCallback(() => setSelectedReport(null), []);

  return (
    <>
      <section className="dashboard-section hot-news-section" id="hot-news" aria-labelledby="hot-news-title">
        <div className="section-heading hot-news-heading">
          <span>Toss WTS Hot News Reports</span>
          <h2 id="hot-news-title">핫뉴스 리포트</h2>
        </div>
        <p className="hot-news-copy">토스증권 주요 뉴스 묶음을 카드로 훑고, 선택한 이슈의 리포트를 팝업에서 확인합니다.</p>

        {state.status === 'loading' ? <div className="state-panel">핫뉴스 리포트를 불러오는 중입니다.</div> : null}
        {state.status === 'error' ? <div className="state-panel error">{state.error}</div> : null}
        {state.status === 'success' && state.reports.length === 0 ? (
          <div className="state-panel">표시할 핫뉴스 리포트가 없습니다.</div>
        ) : null}
        {state.status === 'success' && state.isFallback && state.issueDate ? (
          <div className="state-panel hot-news-fallback-notice">
            최신 {formatIssueDate(state.issueDate)} 리포트를 표시합니다.
          </div>
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
                {report.changeStatus === 'material_change' ? (
                  <span className="hot-news-change-badge">중요 변경</span>
                ) : null}
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
