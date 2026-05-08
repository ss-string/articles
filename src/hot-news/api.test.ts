import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  queryHotNewsLatestIssueDate,
  queryHotNewsReportHistoryRows,
  queryHotNewsReportRows,
} from './api';

const from = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from })),
}));

function createQuery(result: { data: Record<string, unknown>[]; error: null }) {
  const query = {
    data: result.data,
    error: result.error,
    eq: vi.fn(),
    limit: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
  };

  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue(result);
  query.select.mockReturnValue(query);

  return query;
}

describe('hot-news api', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    from.mockReset();
  });

  it('queries latest hot-news reports by issue date and perspective key order', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue({ select: query.select });

    await queryHotNewsReportRows('2026-05-08');

    expect(from).toHaveBeenCalledWith('toss_wts_hot_news_latest_reports');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('issue_date', '2026-05-08');
    expect(query.order).toHaveBeenCalledWith('issue_date', { ascending: false });
    expect(query.order).toHaveBeenCalledWith('perspective_key', { ascending: true });
  });

  it('queries hot-news report history by issue date, perspective key, latest status, and latest run slot order', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue({ select: query.select });

    await queryHotNewsReportHistoryRows('2026-05-07', 'ai_infra');

    expect(from).toHaveBeenCalledWith('toss_wts_hot_news_reports');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('issue_date', '2026-05-07');
    expect(query.eq).toHaveBeenCalledWith('perspective_key', 'ai_infra');
    expect(query.order).toHaveBeenCalledWith('is_latest', { ascending: false });
    expect(query.order).toHaveBeenCalledWith('run_slot', { ascending: false });
  });

  it('queries the latest hot-news issue date from the latest reports view', async () => {
    const query = createQuery({ data: [{ issue_date: '2026-05-08' }], error: null });
    from.mockReturnValue({ select: query.select });

    await expect(queryHotNewsLatestIssueDate()).resolves.toBe('2026-05-08');

    expect(from).toHaveBeenCalledWith('toss_wts_hot_news_latest_reports');
    expect(query.select).toHaveBeenCalledWith('issue_date');
    expect(query.order).toHaveBeenCalledWith('issue_date', { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(1);
  });
});
