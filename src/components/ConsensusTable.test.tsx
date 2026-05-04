import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    currentPrice: overrides.currentPrice ?? 72400,
    fairPrice: overrides.fairPrice ?? 100200,
    gapAmount: overrides.gapAmount ?? 27800,
    gapPercent: overrides.gapPercent ?? 38.4,
    oneMonthConsensusPrice: overrides.oneMonthConsensusPrice ?? 93800,
    oneMonthConsensusChangePercent: oneMonthConsensusChangePercent ?? null,
    threeMonthConsensusPrice: overrides.threeMonthConsensusPrice ?? 96300,
    sixMonthConsensusPrice: overrides.sixMonthConsensusPrice ?? 91300,
    checkpoints:
      overrides.checkpoints ??
      [
        { label: '지난 6개월', price: 91300, changePercent: 9.7 },
        { label: '지난 3개월', price: 96300, changePercent: 4.0 },
        { label: '지난 1개월', price: 93800, changePercent: 6.8 },
        { label: '현재 컨센서스', price: 100200, changePercent: 0 },
      ],
  };
}

describe('ConsensusTable', () => {
  it('exposes table, header, row, and cell semantics', () => {
    render(<ConsensusTable rows={[makeRow()]} />);

    const table = screen.getByRole('table', { name: '컨센서스 랭킹 테이블' });
    expect(within(table).getByRole('columnheader', { name: '종목' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: '현재가' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '삼성전자 005930' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '72,400원' })).toBeInTheDocument();
  });

  it('keeps detail content hidden until the row is expanded', async () => {
    const user = userEvent.setup();
    render(<ConsensusTable rows={[makeRow()]} />);

    expect(screen.queryByText('컨센서스 가격 변화')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: '삼성전자 상세 열기' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(expandButton);

    expect(screen.getByRole('button', { name: '삼성전자 상세 닫기' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
  });

  it('renders expanded detail as a row and cell inside its row group', async () => {
    const user = userEvent.setup();
    render(<ConsensusTable rows={[makeRow()]} />);

    await user.click(screen.getByRole('button', { name: '삼성전자 상세 열기' }));

    const table = screen.getByRole('table', { name: '컨센서스 랭킹 테이블' });
    const expandedCell = within(table).getByRole('cell', { name: /가격 비교/ });

    expect(expandedCell).toHaveClass('expanded-cell');
    expect(expandedCell).toHaveAttribute('aria-colspan', '6');
    expect(expandedCell.closest('[role="row"]')).toHaveClass('expanded-row');
    expect(expandedCell.closest('[role="rowgroup"]')).toHaveClass('rank-detail');
  });

  it('uses whitespace-free aria controls when stock code is missing and name has spaces', async () => {
    const user = userEvent.setup();
    render(<ConsensusTable rows={[makeRow({ id: '테스트 종목', name: '테스트 종목', code: null })]} />);

    const expandButton = screen.getByRole('button', { name: '테스트 종목 상세 열기' });
    const controls = expandButton.getAttribute('aria-controls');

    expect(controls).toBeTruthy();
    expect(controls).not.toMatch(/\s/);

    await user.click(expandButton);

    expect(document.getElementById(controls ?? '')).toBeInTheDocument();
  });

  it('renders a neutral badge when one month consensus change is missing', () => {
    render(<ConsensusTable rows={[makeRow({ oneMonthConsensusChangePercent: null })]} />);

    expect(screen.getByText('-', { selector: '.consensus-badge' })).toBeInTheDocument();
    expect(screen.queryByText('▲ -')).not.toBeInTheDocument();
  });

  it('renders a downward badge for negative one month consensus change', () => {
    render(<ConsensusTable rows={[makeRow({ oneMonthConsensusChangePercent: -2.1 })]} />);

    expect(screen.getByText('▼ -2.1%', { selector: '.consensus-badge' })).toBeInTheDocument();
    expect(screen.queryByText('▲ -2.1%')).not.toBeInTheDocument();
  });

  it('renders a neutral badge for zero one month consensus change', () => {
    render(<ConsensusTable rows={[makeRow({ oneMonthConsensusChangePercent: 0 })]} />);

    expect(screen.getByText('0.0%', { selector: '.consensus-badge' })).toBeInTheDocument();
    expect(screen.queryByText('▲ +0.0%')).not.toBeInTheDocument();
  });

  it('uses the same directional badge in the expanded detail', async () => {
    const user = userEvent.setup();
    render(<ConsensusTable rows={[makeRow({ oneMonthConsensusChangePercent: -2.1 })]} />);

    await user.click(screen.getByRole('button', { name: '삼성전자 상세 열기' }));

    expect(screen.getAllByText('▼ -2.1%', { selector: '.consensus-badge' })).toHaveLength(2);
    expect(screen.queryByText('-2.1%', { selector: '.detail-card .consensus-badge' })).not.toBeInTheDocument();
  });

  it('describes a negative price gap as current price being higher than fair price', async () => {
    const user = userEvent.setup();
    render(<ConsensusTable rows={[makeRow({ currentPrice: 102200, fairPrice: 100200, gapAmount: -2000, gapPercent: -2 })]} />);

    await user.click(screen.getByRole('button', { name: '삼성전자 상세 열기' }));

    expect(screen.getByText('현재가가 적정주가 대비 2,000원 높습니다.')).toBeInTheDocument();
    expect(screen.queryByText(/-2,000원 낮습니다/)).not.toBeInTheDocument();
  });

  it('describes a zero price gap as equal prices', async () => {
    const user = userEvent.setup();
    render(<ConsensusTable rows={[makeRow({ currentPrice: 100200, fairPrice: 100200, gapAmount: 0, gapPercent: 0 })]} />);

    await user.click(screen.getByRole('button', { name: '삼성전자 상세 열기' }));

    expect(screen.getByText('현재가와 적정주가가 같습니다.')).toBeInTheDocument();
  });
});
