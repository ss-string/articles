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

const macroRows = [
  {
    id: '2026-05-04-KR',
    run_date: '2026-05-04',
    market: 'KR',
    regime: '골디락스(goldilocks)',
    axis_assessments: {
      growth: { axis: 'expanding', rationale: '성장 확장', confidence: 0.82 },
      inflation: { axis: 'neutral', rationale: '물가 중립', confidence: 0.74 },
      monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.63 },
      liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.68 },
    },
  },
  {
    id: '2026-05-04-US',
    run_date: '2026-05-04',
    market: 'US',
    regime: '리플레이션(reflation)',
    summary: '미국은 성장축이 중립, 물가축이 elevated로 판정된다.',
    axis_assessments: {
      growth: { axis: 'neutral', rationale: '성장 중립', confidence: 0.69 },
      inflation: { axis: 'elevated', rationale: '물가 부담', confidence: 0.71 },
      monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.66 },
      liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.78 },
    },
    key_indicators: [
      {
        label: '미국 CPI (YoY)',
        value: 3.32,
        unit: '%',
        source: 'FRED',
        trend_3m: 'up',
        interpretation: 'level_score -1과 상승 추세가 elevated 판정의 핵심',
      },
    ],
    asset_implications: ['유동성 ample은 위험자산을 보조한다.'],
    risk_factors: ['성장축이 contracting으로 약화될 위험이 있다.'],
    content_md: '# US 전문\n미국 전문입니다.',
  },
];

describe('App', () => {
  it('renders ranked consensus rows with required fields', async () => {
    const { container } = render(<App queryRows={async () => rows} queryMacroRows={async () => macroRows} />);

    expect(screen.getByRole('heading', { name: 'Portfolio Dashboard' })).toBeInTheDocument();
    const macroLinks = screen.getAllByRole('link', { name: '매크로 레짐' });
    expect(macroLinks).toHaveLength(2);
    macroLinks.forEach((link) => expect(link).toHaveAttribute('href', '#macro-regime'));
    expect(await screen.findByRole('heading', { name: '최신 매크로 레짐 판단' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /KR/ })).toHaveTextContent('골디락스(goldilocks)');
    expect(screen.getByRole('button', { name: /US/ })).toHaveTextContent('리플레이션(reflation)');
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

  it('expands a row and shows checkpoint prices on the line chart', async () => {
    const user = userEvent.setup();
    render(<App queryRows={async () => rows} />);

    await screen.findByText('삼성전자');
    await user.click(screen.getByRole('row', { name: /삼성전자/ }));

    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
    expect(screen.getAllByText('91,300원')).not.toHaveLength(0);
    expect(screen.getAllByText('96,300원')).not.toHaveLength(0);
    expect(screen.getAllByText('93,800원')).not.toHaveLength(0);
    expect(screen.getAllByText('현재 컨센서스')).not.toHaveLength(0);
  });

  it('opens the macro regime popup from the app shell', async () => {
    const user = userEvent.setup();
    render(<App queryRows={async () => rows} queryMacroRows={async () => macroRows} />);

    await user.click(await screen.findByRole('button', { name: /US/ }));

    expect(screen.getByRole('dialog', { name: '리플레이션(reflation)' })).toBeInTheDocument();
    expect(screen.getByText('미국 CPI (YoY)')).toBeInTheDocument();
    expect(screen.getByText('↑ 상승')).toBeInTheDocument();
  });

  it('renders an empty state when there are no valid rows', async () => {
    render(<App queryRows={async () => []} />);

    expect(await screen.findByText('표시할 컨센서스 데이터가 없습니다.')).toBeInTheDocument();
  });
});
