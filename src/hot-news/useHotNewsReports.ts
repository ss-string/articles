import { useEffect, useState } from 'react';
import { queryHotNewsReportRows } from './api';
import { buildHotNewsReports, type HotNewsReport, type RawHotNewsReportRow } from './model';

type HotNewsReportsState =
  | { status: 'loading'; reports: HotNewsReport[]; error: null }
  | { status: 'success'; reports: HotNewsReport[]; error: null }
  | { status: 'error'; reports: HotNewsReport[]; error: string };

type UseHotNewsReportsOptions = {
  queryRows?: () => Promise<RawHotNewsReportRow[]>;
};

export function useHotNewsReports(options: UseHotNewsReportsOptions = {}): HotNewsReportsState {
  const [state, setState] = useState<HotNewsReportsState>({
    status: 'loading',
    reports: [],
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryHotNewsReportRows;

    async function load() {
      setState({ status: 'loading', reports: [], error: null });

      try {
        const rawRows = await loadRows();
        const reports = buildHotNewsReports(rawRows);

        if (isMounted) {
          setState({ status: 'success', reports, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            reports: [],
            error: error instanceof Error ? error.message : '핫뉴스 리포트를 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryRows]);

  return state;
}
