import { useEffect, useState } from 'react';
import { queryRealEstateTables } from './api';
import {
  buildRealEstateDashboard,
  emptyDashboard,
  type RawRealEstateTables,
  type RealEstateDashboard,
} from './model';

type RealEstateTransactionsState =
  | { status: 'loading'; dashboard: RealEstateDashboard; error: null }
  | { status: 'success'; dashboard: RealEstateDashboard; error: null }
  | { status: 'error'; dashboard: RealEstateDashboard; error: string };

type UseRealEstateTransactionsOptions = {
  queryTables?: () => Promise<RawRealEstateTables>;
};

export function useRealEstateTransactions(options: UseRealEstateTransactionsOptions = {}): RealEstateTransactionsState {
  const [state, setState] = useState<RealEstateTransactionsState>({
    status: 'loading',
    dashboard: emptyDashboard,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadTables = options.queryTables ?? queryRealEstateTables;

    async function load() {
      setState({ status: 'loading', dashboard: emptyDashboard, error: null });

      try {
        const tables = await loadTables();
        const dashboard = buildRealEstateDashboard(tables);

        if (isMounted) {
          setState({ status: 'success', dashboard, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            dashboard: emptyDashboard,
            error: error instanceof Error ? error.message : '부동산 실거래정보를 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryTables]);

  return state;
}
