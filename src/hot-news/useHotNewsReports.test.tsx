import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTodayInSeoul, useHotNewsReportHistory, useHotNewsReports } from './useHotNewsReports';

describe('useHotNewsReports', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
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

    const { result } = renderHook(() => useHotNewsReports({ today: '2026-05-08', queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.reports.map((report) => report.title)).toEqual(['2026-05-04 조선 에너지 수주']);
    expect(result.current.issueDate).toBe('2026-05-08');
    expect(result.current.isFallback).toBe(false);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useHotNewsReports({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });

  it('falls back to the latest issue date when today has no reports', async () => {
    const queryRows = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 1,
          issue_date: '2026-05-07',
          title: '2026-05-07 AI 인프라',
          perspective: 'AI 인프라',
        },
      ]);
    const queryLatestIssueDate = vi.fn().mockResolvedValue('2026-05-07');

    const { result } = renderHook(() =>
      useHotNewsReports({
        today: '2026-05-08',
        queryRows,
        queryLatestIssueDate,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(queryRows).toHaveBeenNthCalledWith(1, '2026-05-08');
    expect(queryRows).toHaveBeenNthCalledWith(2, '2026-05-07');
    expect(result.current.issueDate).toBe('2026-05-07');
    expect(result.current.isFallback).toBe(true);
    expect(result.current.reports.map((report) => report.title)).toEqual(['2026-05-07 AI 인프라']);
  });

  it('returns empty success without fallback when latest issue date is null', async () => {
    const queryRows = vi.fn().mockResolvedValue([]);
    const queryLatestIssueDate = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(() =>
      useHotNewsReports({
        today: '2026-05-08',
        queryRows,
        queryLatestIssueDate,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(queryRows).toHaveBeenCalledTimes(1);
    expect(queryRows).toHaveBeenCalledWith('2026-05-08');
    expect(queryLatestIssueDate).toHaveBeenCalledTimes(1);
    expect(result.current.reports).toEqual([]);
    expect(result.current.issueDate).toBe('2026-05-08');
    expect(result.current.isFallback).toBe(false);
  });

  it('returns empty success without fallback when latest issue date is today', async () => {
    const queryRows = vi.fn().mockResolvedValue([]);
    const queryLatestIssueDate = vi.fn().mockResolvedValue('2026-05-08');

    const { result } = renderHook(() =>
      useHotNewsReports({
        today: '2026-05-08',
        queryRows,
        queryLatestIssueDate,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(queryRows).toHaveBeenCalledTimes(1);
    expect(queryRows).toHaveBeenCalledWith('2026-05-08');
    expect(queryLatestIssueDate).toHaveBeenCalledTimes(1);
    expect(result.current.reports).toEqual([]);
    expect(result.current.issueDate).toBe('2026-05-08');
    expect(result.current.isFallback).toBe(false);
  });

  it('does not fall back when today has reports', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      {
        id: 1,
        issue_date: '2026-05-08',
        title: '2026-05-08 AI 인프라',
        perspective: 'AI 인프라',
      },
    ]);
    const queryLatestIssueDate = vi.fn().mockResolvedValue('2026-05-07');

    const { result } = renderHook(() =>
      useHotNewsReports({
        today: '2026-05-08',
        queryRows,
        queryLatestIssueDate,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(queryRows).toHaveBeenCalledTimes(1);
    expect(queryRows).toHaveBeenCalledWith('2026-05-08');
    expect(queryLatestIssueDate).not.toHaveBeenCalled();
    expect(result.current.issueDate).toBe('2026-05-08');
    expect(result.current.isFallback).toBe(false);
  });
});

describe('getTodayInSeoul', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the Asia/Seoul date at UTC date boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T15:30:00Z'));

    expect(getTodayInSeoul()).toBe('2026-05-08');
  });
});

describe('useHotNewsReportHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads history when enabled with issue date and perspective key', async () => {
    const queryHistoryRows = vi.fn().mockResolvedValue([
      {
        id: 1,
        issue_date: '2026-05-07',
        title: '2026-05-07 AI 인프라',
        perspective_key: 'ai_infra',
        run_slot: 'morning',
      },
    ]);

    const { result } = renderHook(() =>
      useHotNewsReportHistory({
        issueDate: '2026-05-07',
        perspectiveKey: 'ai_infra',
        enabled: true,
        queryHistoryRows,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(queryHistoryRows).toHaveBeenCalledWith('2026-05-07', 'ai_infra');
    expect(result.current.reports.map((report) => report.displayTitle)).toEqual(['AI 인프라']);
  });

  it('returns empty success without querying when disabled', () => {
    const queryHistoryRows = vi.fn();

    const { result } = renderHook(() =>
      useHotNewsReportHistory({
        issueDate: '2026-05-07',
        perspectiveKey: 'ai_infra',
        enabled: false,
        queryHistoryRows,
      }),
    );

    expect(result.current).toEqual({ status: 'success', reports: [], error: null });
    expect(queryHistoryRows).not.toHaveBeenCalled();
  });

  it('returns empty success without querying when issue date is null', () => {
    const queryHistoryRows = vi.fn();

    const { result } = renderHook(() =>
      useHotNewsReportHistory({
        issueDate: null,
        perspectiveKey: 'ai_infra',
        enabled: true,
        queryHistoryRows,
      }),
    );

    expect(result.current).toEqual({ status: 'success', reports: [], error: null });
    expect(queryHistoryRows).not.toHaveBeenCalled();
  });

  it('returns empty success without querying when perspective key is null', () => {
    const queryHistoryRows = vi.fn();

    const { result } = renderHook(() =>
      useHotNewsReportHistory({
        issueDate: '2026-05-07',
        perspectiveKey: null,
        enabled: true,
        queryHistoryRows,
      }),
    );

    expect(result.current).toEqual({ status: 'success', reports: [], error: null });
    expect(queryHistoryRows).not.toHaveBeenCalled();
  });
});
