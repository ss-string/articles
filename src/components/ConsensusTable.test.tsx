import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ConsensusRankingRow } from '../consensus/model';
import { ConsensusTable } from './ConsensusTable';

function makeRow(overrides: Partial<ConsensusRankingRow> = {}): ConsensusRankingRow {
  const oneMonthConsensusChangePercent = Object.prototype.hasOwnProperty.call(
    overrides,
    'oneMonthConsensusChangePercent',
  )
    ? overrides.oneMonthConsensusChangePercent
    : 6.8;

  return {
    id: overrides.id ?? '005930',
    name: overrides.name ?? '삼성전자',
    code: overrides.code ?? '005930',
    gicode: overrides.gicode ?? 'A005930',
    currentPrice: overrides.currentPrice ?? 72400,
    fairPrice: overrides.fairPrice ?? 100200,
    gapAmount: overrides.gapAmount ?? 27800,
    gapPercent: overrides.gapPercent ?? 38.4,
    reportCount: overrides.reportCount ?? 11,
    oneMonthConsensusPrice: overrides.oneMonthConsensusPrice ?? 93800,
    oneMonthConsensusChangePercent: oneMonthConsensusChangePercent ?? null,
    threeMonthConsensusPrice: overrides.threeMonthConsensusPrice ?? 96300,
    sixMonthConsensusPrice: overrides.sixMonthConsensusPrice ?? 91300,
    checkpoints:
      overrides.checkpoints ??
      [
        { label: '현재 가격', price: 72400, changePercent: null },
        { label: '지난 6개월', price: 91300, changePercent: 9.7 },
        { label: '지난 3개월', price: 96300, changePercent: 4.0 },
        { label: '지난 1개월', price: 93800, changePercent: 6.8 },
        { label: '현재 컨센서스', price: 100200, changePercent: 0 },
      ],
    summaryReport: overrides.summaryReport ?? null,
  };
}

describe('ConsensusTable', () => {
  it('exposes table, header, row, and cell semantics', () => {
    render(<ConsensusTable rows={[makeRow()]} onSelect={() => undefined} />);

    const table = screen.getByRole('table', { name: '컨센서스 랭킹 테이블' });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      '종목',
      '현재가',
      '적정가',
      '갭',
      '적정가 대비 현재가',
    ]);
    expect(within(table).queryByRole('columnheader', { name: '상세' })).not.toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '삼성전자 005930' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '72,400원' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '+27,800원 +38.4%' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /삼성전자 상세/ })).not.toBeInTheDocument();
  });

  it('calls onSelect when a row is clicked without rendering inline detail content', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const row = makeRow();

    render(<ConsensusTable rows={[row]} onSelect={onSelect} />);

    await user.click(screen.getByRole('row', { name: /삼성전자/ }));

    expect(onSelect).toHaveBeenCalledWith(row);
    expect(screen.queryByText('가격 비교')).not.toBeInTheDocument();
    expect(screen.queryByText('컨센서스 가격 변화')).not.toBeInTheDocument();
  });

  it('calls onSelect when Enter or Space is pressed on a row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const row = makeRow();

    render(<ConsensusTable rows={[row]} onSelect={onSelect} />);

    const summaryRow = screen.getByRole('row', { name: /삼성전자/ });
    summaryRow.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('does not expose inline expansion state attributes', () => {
    render(<ConsensusTable rows={[makeRow({ id: '테스트 종목', name: '테스트 종목', code: null })]} onSelect={() => undefined} />);

    const row = screen.getByRole('row', { name: /테스트 종목/ });

    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).not.toHaveAttribute('aria-controls');
  });

  it('does not render a one month consensus change badge', () => {
    const { container } = render(<ConsensusTable rows={[makeRow()]} onSelect={() => undefined} />);

    expect(container.querySelector('.consensus-badge')).not.toBeInTheDocument();
    expect(screen.queryByText('▲ +6.8%')).not.toBeInTheDocument();
  });

  it('uses positive styling for a positive price gap', () => {
    render(<ConsensusTable rows={[makeRow({ gapPercent: 38.4 })]} onSelect={() => undefined} />);

    const gapCell = screen.getByRole('cell', { name: '+27,800원 +38.4%' });

    expect(gapCell).toHaveClass('gap-positive');
    expect(gapCell).not.toHaveClass('gap-negative');
    expect(gapCell).not.toHaveClass('gap-neutral');
  });

  it('uses negative styling for a negative price gap', () => {
    render(<ConsensusTable rows={[makeRow({ gapPercent: -2 })]} onSelect={() => undefined} />);

    const gapCell = screen.getByRole('cell', { name: '+27,800원 -2.0%' });

    expect(gapCell).toHaveClass('gap-negative');
    expect(gapCell).not.toHaveClass('gap-positive');
    expect(gapCell).not.toHaveClass('gap-neutral');
  });

  it('uses neutral styling for a zero price gap', () => {
    render(<ConsensusTable rows={[makeRow({ gapPercent: 0 })]} onSelect={() => undefined} />);

    const gapCell = screen.getByRole('cell', { name: '+27,800원 +0.0%' });

    expect(gapCell).toHaveClass('gap-neutral');
    expect(gapCell).not.toHaveClass('gap-positive');
    expect(gapCell).not.toHaveClass('gap-negative');
  });

  it('fills the price position bar by current price relative to fair price', () => {
    render(
      <ConsensusTable
        rows={[makeRow({ currentPrice: 55000, fairPrice: 100000, gapAmount: 45000, gapPercent: 81.8 })]}
        onSelect={() => undefined}
      />,
    );

    const bar = screen.getByLabelText('현재가가 적정주가의 55.0% 수준입니다.');
    const fill = bar.querySelector('span');

    expect(fill).toHaveStyle({ width: '55%' });
    expect(screen.getByText('55.0%', { selector: '.price-position-value' })).toBeInTheDocument();
    expect(screen.queryByText(/초과/)).not.toBeInTheDocument();
  });

  it('caps the price position bar and marks prices above fair price as overflow', () => {
    render(
      <ConsensusTable
        rows={[makeRow({ currentPrice: 130000, fairPrice: 100000, gapAmount: -30000, gapPercent: -23.1 })]}
        onSelect={() => undefined}
      />,
    );

    const bar = screen.getByLabelText('현재가가 적정주가의 130.0% 수준으로 초과했습니다.');
    const fill = bar.querySelector('span');

    expect(bar).toHaveClass('is-overflow');
    expect(fill).toHaveStyle({ width: '100%' });
    expect(screen.getByText('초과 130.0%', { selector: '.price-position-overflow' })).toBeInTheDocument();
  });

  it('does not render price gap descriptions because detail content is external', () => {
    render(<ConsensusTable rows={[makeRow({ currentPrice: 102200, fairPrice: 100200, gapAmount: -2000, gapPercent: -2 })]} onSelect={() => undefined} />);

    expect(screen.queryByText('현재가가 적정주가 대비 2,000원 높습니다.')).not.toBeInTheDocument();
  });
});
