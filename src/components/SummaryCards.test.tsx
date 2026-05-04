import { render, screen } from '@testing-library/react';
import type { ConsensusRankingRow } from '../consensus/model';
import { SummaryCards } from './SummaryCards';

function makeRow(overrides: Partial<ConsensusRankingRow>): ConsensusRankingRow {
  return {
    id: overrides.id ?? 'row',
    name: overrides.name ?? '종목',
    code: overrides.code ?? null,
    gicode: overrides.gicode ?? null,
    currentPrice: overrides.currentPrice ?? 10000,
    fairPrice: overrides.fairPrice ?? 12000,
    gapAmount: overrides.gapAmount ?? 2000,
    gapPercent: overrides.gapPercent ?? 20,
    reportCount: overrides.reportCount ?? null,
    oneMonthConsensusPrice: overrides.oneMonthConsensusPrice ?? 11000,
    oneMonthConsensusChangePercent: overrides.oneMonthConsensusChangePercent ?? 9.1,
    threeMonthConsensusPrice: overrides.threeMonthConsensusPrice ?? null,
    sixMonthConsensusPrice: overrides.sixMonthConsensusPrice ?? null,
    checkpoints: overrides.checkpoints ?? [],
    summaryReport: overrides.summaryReport ?? null,
  };
}

describe('SummaryCards', () => {
  it('calculates max gap from all rows without relying on sort order', () => {
    render(<SummaryCards rows={[makeRow({ gapPercent: 12 }), makeRow({ gapPercent: 55 })]} />);

    expect(screen.getByText('+55.0%')).toBeInTheDocument();
  });

  it('uses a neutral max gap label even when every gap is negative', () => {
    render(<SummaryCards rows={[makeRow({ gapPercent: -12 }), makeRow({ gapPercent: -4.5 })]} />);

    expect(screen.getByText('최대 괴리율')).toBeInTheDocument();
    expect(screen.getByText('-4.5%')).toBeInTheDocument();
    expect(screen.queryByText('최대 상승 여력')).not.toBeInTheDocument();
  });
});
