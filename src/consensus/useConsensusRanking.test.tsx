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

  it('loads and ranks rows from the provided query function', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      { stock_name: 'A', current_price: 10000, target_price: 12000, consensus_1m: 11000 },
      { stock_name: 'B', current_price: 10000, target_price: 15000, consensus_1m: 12000 },
    ]);

    const { result } = renderHook(() => useConsensusRanking({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.rows.map((row) => row.name)).toEqual(['B', 'A']);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useConsensusRanking({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
