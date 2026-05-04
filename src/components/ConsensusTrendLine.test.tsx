import { render, screen } from '@testing-library/react';
import type { ConsensusCheckpoint } from '../consensus/model';
import { ConsensusTrendLine } from './ConsensusTrendLine';

const checkpoints: ConsensusCheckpoint[] = [
  { label: '지난 6개월', price: 91300, changePercent: 9.7 },
  { label: '지난 3개월', price: null, changePercent: null },
  { label: '지난 1개월', price: 93800, changePercent: 6.8 },
  { label: '현재 컨센서스', price: 100200, changePercent: 0 },
];

describe('ConsensusTrendLine', () => {
  it('exposes the chart by role and accessible name', () => {
    render(<ConsensusTrendLine checkpoints={checkpoints} />);

    expect(screen.getByRole('img', { name: '컨센서스 가격 선 그래프' })).toBeInTheDocument();
  });

  it('does not plot or label null checkpoint prices as chart points', () => {
    const { container } = render(<ConsensusTrendLine checkpoints={checkpoints} />);

    expect(screen.getAllByText('-', { selector: 'strong' })).toHaveLength(1);
    expect([...container.querySelectorAll('.chart-point')]).toHaveLength(3);
    expect([...container.querySelectorAll('.point-label')].map((label) => label.textContent)).toEqual([
      '지난 6개월91,300원',
      '지난 1개월93,800원',
      '현재 컨센서스100,200원',
    ]);
  });

  it('omits the line path when fewer than two valid prices exist', () => {
    const { container } = render(
      <ConsensusTrendLine
        checkpoints={[
          { label: '지난 6개월', price: null, changePercent: null },
          { label: '지난 3개월', price: null, changePercent: null },
          { label: '지난 1개월', price: null, changePercent: null },
          { label: '현재 컨센서스', price: 100200, changePercent: 0 },
        ]}
      />,
    );

    expect(container.querySelector('.chart-line')).not.toBeInTheDocument();
    expect([...container.querySelectorAll('.chart-point')]).toHaveLength(1);
    expect(screen.getAllByText('-', { selector: 'strong' })).toHaveLength(3);
  });
});
