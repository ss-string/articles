import { useEffect, useState } from 'react';
import { queryConsensusRows, querySummaryReportRows } from './api';
import {
  buildRankingRowsWithReports,
  type ConsensusRankingRow,
  type RawConsensusRow,
  type RawSummaryReportRow,
} from './model';

type RankingState =
  | { status: 'loading'; rows: ConsensusRankingRow[]; error: null }
  | { status: 'success'; rows: ConsensusRankingRow[]; error: null }
  | { status: 'error'; rows: ConsensusRankingRow[]; error: string };

type UseConsensusRankingOptions = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryReports?: () => Promise<RawSummaryReportRow[]>;
};

export function useConsensusRanking(options: UseConsensusRankingOptions = {}): RankingState {
  const [state, setState] = useState<RankingState>({
    status: 'loading',
    rows: [],
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryConsensusRows;
    const loadReports = options.queryReports ?? querySummaryReportRows;

    async function load() {
      setState({ status: 'loading', rows: [], error: null });

      try {
        const [rawRows, rawReports] = await Promise.all([loadRows(), loadReports()]);
        const rows = buildRankingRowsWithReports(rawRows, rawReports);

        if (isMounted) {
          setState({ status: 'success', rows, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            rows: [],
            error: error instanceof Error ? error.message : '컨센서스 데이터를 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryRows, options.queryReports]);

  return state;
}
