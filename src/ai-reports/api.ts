import { createClient } from '@supabase/supabase-js';
import type { RawAiInvestmentReportRow } from './model';

const reportsTableName = 'investment_recommendation_reports';

const selectColumns =
  'id, market, stock_code, stock_name, issue_date, recommendation, current_price, total_score, valuation_score, momentum_score, technical_score, content_md, report_payload, agent_outputs, source_payload, created_at, updated_at';

export function getAiInvestmentReportsSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryAiInvestmentReportRows(): Promise<RawAiInvestmentReportRow[]> {
  const { url, publishableKey } = getAiInvestmentReportsSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase
    .from(reportsTableName)
    .select(selectColumns)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
