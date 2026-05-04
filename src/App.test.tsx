import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const rows = [
  {
    stock_name: '삼성전자',
    stock_code: '005930',
    fnguide_code: 'A005930',
    current_price: 72400,
    target_price: 100200,
    consensus_1m: 93800,
    consensus_3m: 96300,
    consensus_6m: 91300,
  },
  {
    stock_name: '현대차',
    stock_code: '005380',
    fnguide_code: 'A005380',
    current_price: 244000,
    target_price: 318000,
    consensus_1m: 303400,
    consensus_3m: 296600,
    consensus_6m: 307200,
  },
];

const reports = [
  {
    gicode: 'A005930',
    co_nm: '삼성전자',
    updated_at: '2026-05-04T08:24:38.946123+00:00',
    analysis: {
      'tl;dr': '삼성전자 컨센서스는 우호적이다.',
      keyKeywords: ['메모리', 'AI'],
      risks: ['업황 둔화 가능성'],
      targetPriceRange: { min: 90000, median: 100200, max: 110000 },
      securitiesFirmCount: 2,
      securitiesFirms: [
        { name: '테스트증권', reportCount: 1, targetPrices: [100200], recommendations: ['BUY'] },
      ],
    },
  },
];

describe('App', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders ranked consensus rows with required fields', async () => {
    const { container } = render(<App queryRows={async () => rows} queryReports={async () => []} />);

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
    expect(screen.getByText('KRX 컨센서스 괴리율 랭킹')).toBeInTheDocument();
    expect(screen.queryByText(/확장 row에서 가격 차이와 컨센서스 흐름을 함께 봅니다/)).not.toBeInTheDocument();
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

  it('opens a global detail popup with AI report data when a ranking row is selected', async () => {
    const user = userEvent.setup();
    render(<App queryRows={async () => rows} queryReports={async () => reports} />);

    await screen.findByText('삼성전자');
    await user.click(screen.getByRole('row', { name: /삼성전자/ }));

    expect(screen.getByRole('dialog', { name: '삼성전자 상세 분석' })).toBeInTheDocument();
    expect(screen.getByText('가격 비교')).toBeInTheDocument();
    expect(screen.getByText('목표주가 범위')).toBeInTheDocument();
    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
    expect(screen.getByText('AI 컨센서스 요약')).toBeInTheDocument();
    expect(screen.getByText('삼성전자 컨센서스는 우호적이다.')).toBeInTheDocument();
    expect(screen.getByText('주요 리스크').closest('.detail-card')).toHaveClass('risk-card');
    expect(screen.queryByText(/URL 상태 예시/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog', { name: '삼성전자 상세 분석' })).not.toBeInTheDocument();
    expect(window.location.search).not.toContain('contentType');
    expect(window.location.search).not.toContain('contentParams');
  });

  it('opens the matching detail popup from URL query parameters', async () => {
    window.history.pushState(
      {},
      '',
      '/?contentType=consensus&contentParams=%7B%22gicode%22%3A%22A005930%22%7D',
    );

    render(<App queryRows={async () => rows} queryReports={async () => reports} />);

    expect(await screen.findByRole('dialog', { name: '삼성전자 상세 분석' })).toBeInTheDocument();
  });

  it('renders an empty state when there are no valid rows', async () => {
    render(<App queryRows={async () => []} queryReports={async () => []} />);

    expect(await screen.findByText('표시할 컨센서스 데이터가 없습니다.')).toBeInTheDocument();
  });
});
