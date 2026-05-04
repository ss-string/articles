import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const rows = [
  {
    stock_name: '삼성전자',
    stock_code: '005930',
    current_price: 72400,
    target_price: 100200,
    consensus_1m: 93800,
    consensus_3m: 96300,
    consensus_6m: 91300,
  },
  {
    stock_name: '현대차',
    stock_code: '005380',
    current_price: 244000,
    target_price: 318000,
    consensus_1m: 303400,
    consensus_3m: 296600,
    consensus_6m: 307200,
  },
];

describe('App', () => {
  it('renders ranked consensus rows with required fields', async () => {
    const { container } = render(<App queryRows={async () => rows} />);

    expect(screen.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeInTheDocument();
    const consensusLinks = screen.getAllByRole('link', { name: '컨센서스 괴리율 랭킹' });
    expect(consensusLinks).toHaveLength(2);
    consensusLinks.forEach((link) => expect(link).toHaveAttribute('href', '#consensus'));
    expect(await screen.findByRole('heading', { name: '컨센서스 괴리율 랭킹' })).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText('72,400원')).toBeInTheDocument();
    expect(screen.getByText('100,200원')).toBeInTheDocument();
    expect(screen.getAllByText('+38.4%')).not.toHaveLength(0);
    expect(screen.getByText('지난 1개월 대비 컨센서스 증가')).toBeInTheDocument();
    expect(screen.getByText('TL;DR')).toBeInTheDocument();
    expect(screen.getAllByText(/컨센서스 대비 현재 주가가 낮게 반영된 종목/)).not.toHaveLength(0);
    expect(screen.queryByText('Data source')).not.toBeInTheDocument();
    expect(screen.queryByText(/Supabase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/FnGuide Consensus/i)).not.toBeInTheDocument();
    expect(container.querySelector('#consensus .status-panel')).not.toBeInTheDocument();
    expect(container.querySelector('.app-shell')).toBeInTheDocument();
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
    expect(container.querySelector('.top-nav')).toBeInTheDocument();
    expect(container.querySelector('.dashboard')).toBeInTheDocument();
    expect(container.querySelector('.hero-section')).toBeInTheDocument();
    expect(container.querySelector('.dashboard-section')).toBeInTheDocument();
  });

  it('expands a row and shows checkpoint prices on the line chart', async () => {
    const user = userEvent.setup();
    render(<App queryRows={async () => rows} />);

    const samsungSummary = await screen.findByRole('button', { name: /삼성전자 상세 열기/i });
    await user.click(samsungSummary);

    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
    expect(screen.getAllByText('91,300원')).not.toHaveLength(0);
    expect(screen.getAllByText('96,300원')).not.toHaveLength(0);
    expect(screen.getAllByText('93,800원')).not.toHaveLength(0);
    expect(screen.getAllByText('현재 컨센서스')).not.toHaveLength(0);
  });

  it('renders an empty state when there are no valid rows', async () => {
    render(<App queryRows={async () => []} />);

    expect(await screen.findByText('표시할 컨센서스 데이터가 없습니다.')).toBeInTheDocument();
  });
});
