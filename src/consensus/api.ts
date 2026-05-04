import { createClient } from '@supabase/supabase-js';
import type { RawConsensusRow, RawSummaryReportRow } from './model';

const consensusTableName = 'krx_fnguide_consensus';
const summaryReportsTableName = 'ai_consensus_summary_reports';

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
  const { data, error } = await supabase.from(consensusTableName).select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function querySummaryReportRows(): Promise<RawSummaryReportRow[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase.from(summaryReportsTableName).select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
