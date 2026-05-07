import { createClient } from '@supabase/supabase-js';
import type { RawVolatilityCalendarRow } from './model';

const tableName = 'stock_volatility_check_calendars';

export function getVolatilityCalendarSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryVolatilityCalendarRows(): Promise<RawVolatilityCalendarRow[]> {
  const { url, publishableKey } = getVolatilityCalendarSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase
    .from(tableName)
    .select('id, issue_date, events, updated_at')
    .order('issue_date', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
