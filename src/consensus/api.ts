import { createClient } from '@supabase/supabase-js';
import type { RawConsensusRow } from './model';

const tableName = 'krx_fnguide_consensus';

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryConsensusRows(): Promise<RawConsensusRow[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
