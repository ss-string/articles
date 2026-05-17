import { createClient } from '@supabase/supabase-js';
import type { RawRealEstateRow, RawRealEstateTables } from './model';

const tableNames = {
  interestTargets: 'real_estate_interest_targets',
  complexes: 'real_estate_complexes',
  pyeongOptions: 'real_estate_complex_pyeong_options',
  articles: 'real_estate_articles',
  priceMetrics: 'real_estate_pyeong_price_metrics',
} as const;

export function getRealEstateSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

function assertNoQueryError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function queryRealEstateTables(): Promise<RawRealEstateTables> {
  const { url, publishableKey } = getRealEstateSupabaseConfig();
  const supabase = createClient(url, publishableKey);

  const [interestTargets, complexes, pyeongOptions, articles, priceMetrics] = await Promise.all([
    supabase
      .from(tableNames.interestTargets)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase.from(tableNames.complexes).select('*'),
    supabase.from(tableNames.pyeongOptions).select('*'),
    supabase.from(tableNames.articles).select('*').eq('is_active', true).order('deal_price', { ascending: true }),
    supabase.from(tableNames.priceMetrics).select('*').eq('trade_type', 'A1').eq('window_months', 3),
  ]);

  assertNoQueryError(interestTargets.error);
  assertNoQueryError(complexes.error);
  assertNoQueryError(pyeongOptions.error);
  assertNoQueryError(articles.error);
  assertNoQueryError(priceMetrics.error);

  return {
    interestTargets: (interestTargets.data ?? []) as RawRealEstateRow[],
    complexes: (complexes.data ?? []) as RawRealEstateRow[],
    pyeongOptions: (pyeongOptions.data ?? []) as RawRealEstateRow[],
    articles: (articles.data ?? []) as RawRealEstateRow[],
    priceMetrics: (priceMetrics.data ?? []) as RawRealEstateRow[],
  };
}
