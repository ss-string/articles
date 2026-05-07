import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryVolatilityCalendarRows } from './api';
import { useVolatilityCalendar } from './useVolatilityCalendar';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseMocks.createClient,
}));

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

  it('queries the latest volatility calendar row with the expected shape', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');

    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    supabaseMocks.createClient.mockReturnValue({ from });

    await queryVolatilityCalendarRows();

    expect(supabaseMocks.createClient).toHaveBeenCalledWith('https://example.supabase.co', 'publishable-key');
    expect(from).toHaveBeenCalledWith('stock_volatility_check_calendars');
    expect(select).toHaveBeenCalledWith('id, issue_date, events, updated_at');
    expect(order).toHaveBeenCalledWith('issue_date', { ascending: false });
    expect(limit).toHaveBeenCalledWith(1);
  });
});
