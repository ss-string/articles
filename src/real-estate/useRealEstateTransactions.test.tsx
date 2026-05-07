import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRealEstateTransactions } from './useRealEstateTransactions';

describe('useRealEstateTransactions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useRealEstateTransactions());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads a normalized real estate dashboard from the provided query function', async () => {
    const queryTables = vi.fn().mockResolvedValue({
      interestTargets: [{ complex_id: 'c1', pyeong_type: '80', sort_order: 1 }],
      complexes: [{ complex_id: 'c1', complex_name: '약수하이츠' }],
      pyeongOptions: [{ complex_id: 'c1', pyeong_type: '80', display_pyeong_name: '32평' }],
      articles: [
        { article_no: 'a1', complex_id: 'c1', pyeong_type: '80', trade_type: '매매', price: 1320000000 },
        { article_no: 'a2', complex_id: 'c1', pyeong_type: '80', trade_type: '매매', price: 1550000000 },
      ],
      priceMetrics: [
        { complex_id: 'c1', pyeong_type: '80', metric_date: '2026-05-01', actual_median_price: 1470000000 },
      ],
    });

    const { result } = renderHook(() => useRealEstateTransactions({ queryTables }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.dashboard.targets[0]?.complexName).toBe('약수하이츠');
    expect(result.current.dashboard.targets[0]?.belowMedianArticles).toHaveLength(1);
    expect(queryTables).toHaveBeenCalledTimes(1);
  });

  it('returns an error when the query fails', async () => {
    const queryTables = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useRealEstateTransactions({ queryTables }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
