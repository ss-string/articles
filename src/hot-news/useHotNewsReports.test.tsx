import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHotNewsReports } from './useHotNewsReports';

describe('useHotNewsReports', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useHotNewsReports());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads normalized hot news reports from the provided query function', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      {
        id: 1,
        issue_date: '2026-05-04',
        title: '2026-05-04 조선 에너지 수주',
        perspective: '조선 에너지 수주',
        tldr: ['국내 조선·해양 에너지 인프라 기업의 수주 뉴스가 집중'],
      },
    ]);

    const { result } = renderHook(() => useHotNewsReports({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.reports.map((report) => report.title)).toEqual(['2026-05-04 조선 에너지 수주']);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useHotNewsReports({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
