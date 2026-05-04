import { createClient } from '@supabase/supabase-js';
import type { RawMacroRegimeRow } from './model';

const tableName = 'macro_regime_decisions';
const markets = ['KR', 'US'] as const;

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryMacroRegimeRows(): Promise<RawMacroRegimeRow[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey);

  const results = await Promise.all(
    markets.map(async (market) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('market', market)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      return data?.[0] ?? null;
    }),
  );

  return results.filter((row): row is RawMacroRegimeRow => row !== null);
}
