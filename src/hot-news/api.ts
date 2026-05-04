import { createClient } from '@supabase/supabase-js';
import type { RawHotNewsReportRow } from './model';

const tableName = 'toss_wts_hot_news_reports';

export function getHotNewsSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryHotNewsReportRows(): Promise<RawHotNewsReportRow[]> {
  const { url, publishableKey } = getHotNewsSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('issue_date', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
