import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { RawHotNewsReportRow } from './hot-news/model';

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
];

const hotNewsRows: RawHotNewsReportRow[] = [
  {
    id: 1,
    issue_date: '2026-05-04',
    title: '2026-05-04 조선 에너지 수주',
    perspective: '조선 에너지 수주',
    tldr: ['국내 조선·해양 에너지 인프라 기업의 수주 뉴스가 집중'],
  },
];

describe('App routing', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders macro regime as the default main page', async () => {
    render(
      <App
        queryRows={async () => rows}
        queryHotNewsRows={async () => hotNewsRows}
        queryMacroRows={async () => macroRows}
        queryReports={async () => []}
      />,
    );

    const topRow = screen.getByRole('banner');
    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });

    expect(within(sidebar).getByText('분석자료실')).toBeInTheDocument();
    expect(topRow).not.toHaveTextContent('분석자료실');
    expect(within(topRow).getByText('로그인')).toBeInTheDocument();
    expect(within(topRow).getByText('설정')).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /⌂ 메인/ })).toHaveClass('active');
    expect(within(sidebar).getByRole('button', { name: /◷ 매크로 레짐/ })).toBeInTheDocument();
    expect(within(sidebar).queryByRole('button', { name: /≡ 핫 뉴스 분석 리포트/ })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('button', { name: /↗ 컨센서스 괴리율 랭킹/ })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('button', { name: /⌁ AI 분석 리포트/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '매크로 레짐' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '최신 매크로 레짐 판단' })).toBeInTheDocument();
  });

  it('renders finance consensus route with finance children and underline tabs', async () => {
    window.history.pushState({}, '', '/finance/consensus');

    render(
      <App
        queryRows={async () => rows}
        queryHotNewsRows={async () => hotNewsRows}
        queryMacroRows={async () => macroRows}
        queryReports={async () => []}
      />,
    );

    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });
    const activeTab = screen.getByRole('tab', { name: '컨센서스 괴리율 랭킹' });

    expect(within(sidebar).getByRole('button', { name: /◆ 금융/ })).toHaveClass('active');
    expect(within(sidebar).getByRole('button', { name: /≡ 핫 뉴스 분석 리포트/ })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /↗ 컨센서스 괴리율 랭킹/ })).toHaveClass('active');
    expect(within(sidebar).getByRole('button', { name: /⌁ AI 분석 리포트/ })).toBeInTheDocument();
    expect(within(sidebar).queryByRole('button', { name: /◷ 매크로 레짐/ })).not.toBeInTheDocument();
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab).toHaveClass('finance-tab active');
    expect(await screen.findByText('삼성전자')).toBeInTheDocument();
  });

  it('navigates between finance pages from underline tabs', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/finance/hot-news');

    render(
      <App
        queryRows={async () => rows}
        queryHotNewsRows={async () => hotNewsRows}
        queryMacroRows={async () => macroRows}
        queryReports={async () => []}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: '핫 뉴스 분석 리포트' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'AI 분석 리포트' }));

    expect(window.location.pathname).toBe('/finance/ai-reports');
    expect(screen.getByRole('heading', { level: 1, name: 'AI 분석 리포트' })).toBeInTheDocument();
    expect(screen.getByText('표시할 AI 분석 리포트가 없습니다.')).toBeInTheDocument();
  });

  it('opens and closes the mobile sidebar from the dimmed area without a close button', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <App
        queryRows={async () => rows}
        queryHotNewsRows={async () => hotNewsRows}
        queryMacroRows={async () => macroRows}
        queryReports={async () => []}
      />,
    );

    const mobileSidebar = container.querySelector('.mobile-sidebar') as HTMLElement;
    const dim = screen.getByTestId('mobile-sidebar-dim');

    expect(mobileSidebar).not.toHaveClass('open');
    expect(dim).not.toHaveClass('visible');

    await user.click(screen.getByRole('button', { name: '모바일 사이드바 열기' }));

    expect(mobileSidebar).toHaveClass('open');
    expect(dim).toHaveClass('visible');
    expect(within(mobileSidebar).queryByRole('button', { name: /닫기/ })).not.toBeInTheDocument();
    expect(within(mobileSidebar).queryByRole('button', { name: 'X' })).not.toBeInTheDocument();
    expect(within(mobileSidebar).queryByRole('button', { name: '×' })).not.toBeInTheDocument();

    await user.click(dim);

    expect(mobileSidebar).not.toHaveClass('open');
    expect(dim).not.toHaveClass('visible');
  });

  it('keeps consensus detail popup behavior with URL query parameters', async () => {
    window.history.pushState(
      {},
      '',
      '/finance/consensus?contentType=consensus&contentParams=%7B%22gicode%22%3A%22A005930%22%7D',
    );

    render(<App queryRows={async () => rows} queryHotNewsRows={async () => hotNewsRows} queryReports={async () => []} />);

    const dialog = await screen.findByRole('dialog', { name: '삼성전자 상세 분석' });
    expect(within(dialog).getByText('AI 분석 리포트가 없습니다.')).toBeInTheDocument();
  });
});
