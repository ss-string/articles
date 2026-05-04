import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ConsensusRankingRow } from '../consensus/model';
import { ConsensusDetailModal } from './ConsensusDetailModal';

function makeRow(overrides: Partial<ConsensusRankingRow> = {}): ConsensusRankingRow {
  return {
    id: 'A128940',
    name: '한미약품',
    code: '128940',
    gicode: 'A128940',
    currentPrice: 445000,
    fairPrice: 657857,
    gapAmount: 212857,
    gapPercent: 47.8,
    reportCount: 11,
    oneMonthConsensusPrice: 620000,
    oneMonthConsensusChangePercent: 6.1,
    threeMonthConsensusPrice: 538333,
    sixMonthConsensusPrice: 477500,
    checkpoints: [
      { label: '현재 가격', price: 445000, changePercent: null },
      { label: '지난 6개월', price: 477500, changePercent: 37.8 },
      { label: '지난 3개월', price: 538333, changePercent: 22.2 },
      { label: '지난 1개월', price: 620000, changePercent: 6.1 },
      { label: '현재 컨센서스', price: 657857, changePercent: 0 },
    ],
    summaryReport: {
      gicode: 'A128940',
      companyName: '한미약품',
      updatedAt: '2026-05-04T08:24:38.946123+00:00',
      tlDr: '한미약품에 대한 컨센서스는 대부분 BUY 또는 매수로 우호적이다.',
      keyKeywords: ['R&D 모멘텀', 'MASH', '기술이전'],
      risks: ['1Q26 실적이 시장 기대치를 하회할 가능성'],
      targetPriceRange: { min: 560000, median: 660000, max: 720000 },
      securitiesFirmCount: 10,
      securitiesFirms: [
        { name: '메리츠증권', reportCount: 1, targetPrices: [620000], recommendations: ['BUY'] },
        { name: '다올투자증권', reportCount: 1, targetPrices: [720000], recommendations: ['BUY'] },
      ],
    },
    ...overrides,
  };
}

describe('ConsensusDetailModal', () => {
  it('renders price comparison, target range, trend, AI summary, risks, and firm targets', () => {
    render(<ConsensusDetailModal row={makeRow()} onClose={() => undefined} />);

    expect(screen.getByRole('dialog', { name: '한미약품 상세 분석' })).toBeInTheDocument();
    expect(screen.getByText(/컨센서스 리포트 11개 기반/)).toBeInTheDocument();
    expect(screen.queryByText(/FnGuide 리포트/)).not.toBeInTheDocument();
    expect(screen.getByText('가격 비교')).toBeInTheDocument();
    expect(screen.getAllByText('현재 가격')).not.toHaveLength(0);
    expect(screen.getByText('목표주가 범위')).toBeInTheDocument();
    expect(screen.getByText('560,000원')).toBeInTheDocument();
    expect(screen.getByText('660,000원')).toBeInTheDocument();
    expect(screen.getAllByText('720,000원')).not.toHaveLength(0);
    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
    expect(screen.getByText('AI 컨센서스 요약')).toBeInTheDocument();
    expect(screen.getByText(/대부분 BUY/)).toBeInTheDocument();
    expect(screen.getByText('R&D 모멘텀')).toBeInTheDocument();
    expect(screen.getByText('주요 리스크').closest('.detail-card')).toHaveClass('risk-card');
    expect(screen.getByText(/1Q26 실적/)).toBeInTheDocument();
    expect(screen.getByText('증권사별 목표가')).toBeInTheDocument();
    expect(screen.getByText('메리츠증권')).toBeInTheDocument();
    expect(screen.getAllByText('BUY · 1건')).not.toHaveLength(0);
  });

  it('calls onClose from the close button, backdrop, and Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ConsensusDetailModal row={makeRow()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('detail-modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('shows an empty AI report state when no report is matched', () => {
    render(<ConsensusDetailModal row={makeRow({ summaryReport: null })} onClose={() => undefined} />);

    expect(screen.getByText('AI 분석 리포트가 없습니다.')).toBeInTheDocument();
  });

  it('falls back when the report updated date is invalid', () => {
    const row = makeRow({
      summaryReport: {
        ...makeRow().summaryReport!,
        updatedAt: 'not-a-date',
      },
    });

    render(<ConsensusDetailModal row={row} onClose={() => undefined} />);

    expect(screen.getByText(/AI 리포트 업데이트 -/)).toBeInTheDocument();
  });
});
