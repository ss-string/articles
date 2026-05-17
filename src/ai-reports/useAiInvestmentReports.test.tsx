import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryAiInvestmentReportRows } from './api';
import { useAiInvestmentReports } from './useAiInvestmentReports';

const from = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from })),
}));

function createSamsungRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'latest',
    stock_code: '005930',
    stock_name: '삼성전자',
    current_price: 273500,
    updated_at: '2026-05-17T09:26:10.444135+00:00',
    ...overrides,
  };
}

function createQuery(result: { data: Record<string, unknown>[] | null; error: { message: string } | null }) {
  const query = {
    order: vi.fn(),
    select: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.order.mockResolvedValue(result);

  return query;
}

describe('useAiInvestmentReports', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useAiInvestmentReports());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('returns a success catalog when the provided query returns raw rows', async () => {
    const queryRows = vi.fn().mockResolvedValue([createSamsungRow()]);

    const { result } = renderHook(() => useAiInvestmentReports({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.catalog.representativeReports.map((report) => report.stockCode)).toEqual(['005930']);
    expect(result.current.catalog.reports[0].currentPriceLabel).toBe('273,500원');
  });

  it('returns an error message when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('query failed'));

    const { result } = renderHook(() => useAiInvestmentReports({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('query failed');
  });
});

describe('queryAiInvestmentReportRows', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    from.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('queries investment recommendation reports with the expected columns and latest update order', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue({ select: query.select });

    await queryAiInvestmentReportRows();

    expect(from).toHaveBeenCalledWith('investment_recommendation_reports');
    expect(query.select).toHaveBeenCalledWith(
      'id, market, stock_code, stock_name, issue_date, recommendation, current_price, total_score, valuation_score, momentum_score, technical_score, content_md, report_payload, agent_outputs, source_payload, created_at, updated_at',
    );
    expect(query.order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('throws the Supabase error message when the query fails', async () => {
    const query = createQuery({ data: null, error: { message: 'permission denied' } });
    from.mockReturnValue({ select: query.select });

    await expect(queryAiInvestmentReportRows()).rejects.toThrow('permission denied');
  });
});
