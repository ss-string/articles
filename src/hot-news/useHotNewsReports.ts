import { useEffect, useState } from 'react';
import { queryHotNewsLatestIssueDate, queryHotNewsReportHistoryRows, queryHotNewsReportRows } from './api';
import { buildHotNewsReports, type HotNewsReport, type RawHotNewsReportRow } from './model';

type HotNewsReportsState =
  | { status: 'loading'; reports: HotNewsReport[]; error: null; issueDate: string | null; isFallback: boolean }
  | { status: 'success'; reports: HotNewsReport[]; error: null; issueDate: string | null; isFallback: boolean }
  | { status: 'error'; reports: HotNewsReport[]; error: string; issueDate: string | null; isFallback: boolean };

type UseHotNewsReportsOptions = {
  today?: string;
  queryRows?: (issueDate?: string) => Promise<RawHotNewsReportRow[]>;
  queryLatestIssueDate?: () => Promise<string | null>;
};

type HotNewsReportHistoryState =
  | { status: 'loading'; reports: HotNewsReport[]; error: null }
  | { status: 'success'; reports: HotNewsReport[]; error: null }
  | { status: 'error'; reports: HotNewsReport[]; error: string };

type UseHotNewsReportHistoryOptions = {
  issueDate: string | null;
  perspectiveKey: string | null;
  enabled: boolean;
  queryHistoryRows?: (issueDate: string, perspectiveKey: string) => Promise<RawHotNewsReportRow[]>;
};

export function getTodayInSeoul() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

export function useHotNewsReports(options: UseHotNewsReportsOptions = {}): HotNewsReportsState {
  const today = options.today ?? getTodayInSeoul();
  const [state, setState] = useState<HotNewsReportsState>({
    status: 'loading',
    reports: [],
    error: null,
    issueDate: null,
    isFallback: false,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryHotNewsReportRows;
    const loadLatestIssueDate = options.queryLatestIssueDate ?? queryHotNewsLatestIssueDate;

    async function load() {
      setState({ status: 'loading', reports: [], error: null, issueDate: null, isFallback: false });

      try {
        const todayRows = await loadRows(today);

        if (todayRows.length > 0) {
          const reports = buildHotNewsReports(todayRows);

          if (isMounted) {
            setState({ status: 'success', reports, error: null, issueDate: today, isFallback: false });
          }

          return;
        }

        const latestIssueDate = await loadLatestIssueDate();

        if (!latestIssueDate || latestIssueDate === today) {
          if (isMounted) {
            setState({ status: 'success', reports: [], error: null, issueDate: today, isFallback: false });
          }

          return;
        }

        const fallbackRows = await loadRows(latestIssueDate);
        const reports = buildHotNewsReports(fallbackRows);

        if (isMounted) {
          setState({ status: 'success', reports, error: null, issueDate: latestIssueDate, isFallback: true });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            reports: [],
            error: error instanceof Error ? error.message : '핫뉴스 리포트를 불러오지 못했습니다.',
            issueDate: null,
            isFallback: false,
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryRows, options.queryLatestIssueDate, today]);

  return state;
}

export function useHotNewsReportHistory(options: UseHotNewsReportHistoryOptions): HotNewsReportHistoryState {
  const isReady = options.enabled && !!options.issueDate && !!options.perspectiveKey;
  const [state, setState] = useState<HotNewsReportHistoryState>(() =>
    isReady ? { status: 'loading', reports: [], error: null } : { status: 'success', reports: [], error: null },
  );

  useEffect(() => {
    if (!options.enabled || !options.issueDate || !options.perspectiveKey) {
      setState({ status: 'success', reports: [], error: null });
      return;
    }

    let isMounted = true;
    const loadHistoryRows = options.queryHistoryRows ?? queryHotNewsReportHistoryRows;

    async function load() {
      setState({ status: 'loading', reports: [], error: null });

      try {
        const rawRows = await loadHistoryRows(options.issueDate!, options.perspectiveKey!);
        const reports = buildHotNewsReports(rawRows);

        if (isMounted) {
          setState({ status: 'success', reports, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            reports: [],
            error: error instanceof Error ? error.message : '핫뉴스 이력을 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.enabled, options.issueDate, options.perspectiveKey, options.queryHistoryRows]);

  return state;
}
