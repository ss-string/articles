import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useVolatilityCalendar } from './useVolatilityCalendar';

describe('useVolatilityCalendar', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useVolatilityCalendar());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads normalized volatility calendar from the provided query function', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      {
        id: 1,
        updated_at: '2026-05-07T02:23:06.029364+00:00',
        events: [{ event: '미국 CPI', market: 'US_STOCK', date_kst: '2026-05-12', risk_level: 0.9 }],
      },
    ]);

    const { result } = renderHook(() => useVolatilityCalendar({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.calendar?.events.map((event) => event.name)).toEqual(['미국 CPI']);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useVolatilityCalendar({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
