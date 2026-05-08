import { createClient } from '@supabase/supabase-js';
import type { RawHotNewsReportRow } from './model';

const latestReportsViewName = 'toss_wts_hot_news_latest_reports';
const reportsTableName = 'toss_wts_hot_news_reports';

export function getHotNewsSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryHotNewsReportRows(issueDate?: string): Promise<RawHotNewsReportRow[]> {
  const { url, publishableKey } = getHotNewsSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  let query = supabase.from(latestReportsViewName).select('*');

  if (issueDate) {
    query = query.eq('issue_date', issueDate);
  }

  const { data, error } = await query
    .order('issue_date', { ascending: false })
    .order('perspective_key', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function queryHotNewsReportHistoryRows(
  issueDate: string,
  perspectiveKey: string,
): Promise<RawHotNewsReportRow[]> {
  const { url, publishableKey } = getHotNewsSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase
    .from(reportsTableName)
    .select('*')
    .eq('issue_date', issueDate)
    .eq('perspective_key', perspectiveKey)
    .order('is_latest', { ascending: false })
    .order('run_slot', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
