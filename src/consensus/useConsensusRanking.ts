import { useEffect, useState } from 'react';
import { queryConsensusRows } from './api';
import { buildRankingRows, type ConsensusRankingRow, type RawConsensusRow } from './model';

type RankingState =
  | { status: 'loading'; rows: ConsensusRankingRow[]; error: null }
  | { status: 'success'; rows: ConsensusRankingRow[]; error: null }
  | { status: 'error'; rows: ConsensusRankingRow[]; error: string };

type UseConsensusRankingOptions = {
  queryRows?: () => Promise<RawConsensusRow[]>;
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

    async function load() {
      setState({ status: 'loading', rows: [], error: null });

      try {
        const rawRows = await loadRows();
        const rows = buildRankingRows(rawRows);

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
  }, [options.queryRows]);

  return state;
}
