import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMacroRegimeDecisions } from './useMacroRegimeDecisions';

describe('useMacroRegimeDecisions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useMacroRegimeDecisions());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads normalized KR and US decisions from the provided query function', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      {
        id: '2026-05-04-US',
        run_date: '2026-05-04',
        market: 'US',
        regime: '리플레이션(reflation)',
        axis_assessments: {
          growth: { axis: 'neutral', rationale: '성장 중립', confidence: 0.69 },
          inflation: { axis: 'elevated', rationale: '물가 부담', confidence: 0.71 },
          monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.66 },
          liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.78 },
        },
      },
      {
        id: '2026-05-04-KR',
        run_date: '2026-05-04',
        market: 'KR',
        regime: '골디락스(goldilocks)',
        axis_assessments: {
          growth: { axis: 'expanding', rationale: '성장 확장', confidence: 0.82 },
          inflation: { axis: 'neutral', rationale: '물가 중립', confidence: 0.74 },
          monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.63 },
          liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.68 },
        },
      },
    ]);

    const { result } = renderHook(() => useMacroRegimeDecisions({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.decisions.map((decision) => decision.market)).toEqual(['KR', 'US']);
    expect(result.current.decisions.map((decision) => decision.regime)).toEqual([
      '골디락스(goldilocks)',
      '리플레이션(reflation)',
    ]);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useMacroRegimeDecisions({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
