import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useConsensusRanking } from './useConsensusRanking';

describe('useConsensusRanking', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useConsensusRanking());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads consensus rows and AI reports from the provided query functions', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      { stock_name: 'A', current_price: 10000, target_price: 12000, consensus_1m: 11000, fnguide_code: 'A000001' },
      { stock_name: 'B', current_price: 10000, target_price: 15000, consensus_1m: 12000, fnguide_code: 'A000002' },
    ]);
    const queryReports = vi.fn().mockResolvedValue([
      {
        gicode: 'A000002',
        co_nm: 'B',
        analysis: {
          'tl;dr': 'B 리포트 요약',
          targetPriceRange: { min: 14000, median: 15000, max: 16000 },
        },
        updated_at: '2026-05-04T08:24:38.946123+00:00',
      },
    ]);

    const { result } = renderHook(() => useConsensusRanking({ queryRows, queryReports }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.rows.map((row) => row.name)).toEqual(['B', 'A']);
    expect(result.current.rows[0]?.summaryReport?.tlDr).toBe('B 리포트 요약');
    expect(queryRows).toHaveBeenCalledTimes(1);
    expect(queryReports).toHaveBeenCalledTimes(1);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useConsensusRanking({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });

  it('returns an error when the AI report query fails', async () => {
    const queryRows = vi.fn().mockResolvedValue([{ stock_name: 'A', current_price: 10000, target_price: 12000 }]);
    const queryReports = vi.fn().mockRejectedValue(new Error('report query failed'));

    const { result } = renderHook(() => useConsensusRanking({ queryRows, queryReports }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('report query failed');
  });
});
