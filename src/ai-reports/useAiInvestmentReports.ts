import { useEffect, useState } from 'react';
import { queryAiInvestmentReportRows } from './api';
import {
  buildAiInvestmentReportCatalog,
  type AiInvestmentReportCatalog,
  type RawAiInvestmentReportRow,
} from './model';

type AiInvestmentReportsState =
  | { status: 'loading'; catalog: AiInvestmentReportCatalog; error: null }
  | { status: 'success'; catalog: AiInvestmentReportCatalog; error: null }
  | { status: 'error'; catalog: AiInvestmentReportCatalog; error: string };

type UseAiInvestmentReportsOptions = {
  queryRows?: () => Promise<RawAiInvestmentReportRow[]>;
};

const emptyCatalog: AiInvestmentReportCatalog = {
  representativeReports: [],
  reports: [],
};

export function useAiInvestmentReports(options: UseAiInvestmentReportsOptions = {}): AiInvestmentReportsState {
  const [state, setState] = useState<AiInvestmentReportsState>({
    status: 'loading',
    catalog: emptyCatalog,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryAiInvestmentReportRows;

    async function load() {
      setState({ status: 'loading', catalog: emptyCatalog, error: null });

      try {
        const rows = await loadRows();
        const catalog = buildAiInvestmentReportCatalog(rows);

        if (isMounted) {
          setState({ status: 'success', catalog, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            catalog: emptyCatalog,
            error: error instanceof Error ? error.message : 'AI 분석 리포트를 불러오지 못했습니다.',
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
