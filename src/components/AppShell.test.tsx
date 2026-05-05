import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { AppRoute } from '../navigation';
import { AppShell } from './AppShell';

const consensusRoute: AppRoute = {
  path: '/finance/consensus',
  section: 'finance',
  label: '컨센서스 괴리율 랭킹',
  shortLabel: '컨센서스 랭킹',
  kicker: '금융 밸류에이션',
  symbol: '↗',
};

const macroRoute: AppRoute = {
  path: '/main/macro-regime',
  section: 'main',
  label: '매크로 레짐',
  shortLabel: '매크로 레짐',
  kicker: '시장 국면 분석',
  symbol: '◷',
};

describe('AppShell', () => {
  it('renders the library brand in the sidebar but not in the top row', () => {
    const { container } = render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });
    const mobileSidebar = container.querySelector('.mobile-sidebar');
    const topRow = screen.getByRole('banner');

    expect(sidebar).toHaveClass('sidebar');
    expect(within(sidebar).getByText('분석자료실').closest('.brand')).toBeInTheDocument();
    expect(within(sidebar).getByText('Research Library').closest('.brand')).toBeInTheDocument();
    expect(within(sidebar).getByText('분석자료실')).toHaveClass('brand-mark');
    expect(mobileSidebar).toHaveTextContent('분석자료실');
    expect(mobileSidebar).toHaveTextContent('Research Library');
    expect(topRow).not.toHaveTextContent('분석자료실');
    expect(topRow).not.toHaveTextContent('Research Library');
    expect(screen.getByRole('button', { name: '사이드바 열기 또는 닫기' })).toBeInTheDocument();
  });

  it('uses planned layout and navigation class names', () => {
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });

    expect(sidebar.querySelector('.brand')).toBeInTheDocument();
    expect(sidebar.querySelector('.brand-mark')).toBeInTheDocument();
    expect(sidebar.querySelector('.nav-list')).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /◆ 금융/ })).toHaveClass('nav-item');
    expect(within(sidebar).getByRole('button', { name: /↗ 컨센서스 괴리율 랭킹/ })).toHaveClass('sub-item');
    expect(screen.getByRole('button', { name: '사이드바 열기 또는 닫기' })).toHaveClass(
      'sidebar-toggle desktop-toggle',
    );
    expect(screen.getByRole('button', { name: '모바일 사이드바 열기' })).toHaveClass('sidebar-toggle mobile-toggle');
    expect(document.querySelector('.workspace')).toBeInTheDocument();
    expect(document.querySelector('.dashboard')).toBeInTheDocument();
  });

  it('renders top row account and settings placeholders', () => {
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    const topRow = screen.getByRole('banner');
    expect(topRow).toHaveClass('top-nav');
    expect(within(topRow).getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(within(topRow).getByRole('button', { name: '설정' })).toBeInTheDocument();
  });

  it('shows only finance children when a finance route is active', () => {
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });
    expect(within(sidebar).getByRole('button', { name: /◆ 금융/ })).toHaveClass('active');
    expect(within(sidebar).queryByRole('button', { name: /◷ 매크로 레짐/ })).not.toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /≡ 핫 뉴스 분석 리포트/ })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: /↗ 컨센서스 괴리율 랭킹/ })).toHaveClass('active');
    expect(within(sidebar).getByRole('button', { name: /⌁ AI 분석 리포트/ })).toBeInTheDocument();
  });

  it('navigates from top-level sidebar items', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={onNavigate}>
        <p>본문</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });
    await user.click(within(sidebar).getByRole('button', { name: /⌂ 메인/ }));
    await user.click(within(sidebar).getByRole('button', { name: /◆ 금융/ }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, '/main/macro-regime');
    expect(onNavigate).toHaveBeenNthCalledWith(2, '/finance/hot-news');
  });

  it('shows only main children when the main route is active', () => {
    render(
      <AppShell activeRoute={macroRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    const sidebar = screen.getByRole('complementary', { name: '분석자료실 메뉴' });
    expect(within(sidebar).getByRole('button', { name: /⌂ 메인/ })).toHaveClass('active');
    expect(within(sidebar).getByRole('button', { name: /◷ 매크로 레짐/ })).toBeInTheDocument();
    expect(within(sidebar).queryByRole('button', { name: /≡ 핫 뉴스 분석 리포트/ })).not.toBeInTheDocument();
  });

  it('toggles the desktop sidebar from the top row', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    expect(container.querySelector('.app-shell')).not.toHaveClass('sidebar-collapsed');
    await user.click(screen.getByRole('button', { name: '사이드바 열기 또는 닫기' }));
    expect(container.querySelector('.app-shell')).toHaveClass('sidebar-collapsed');
    await user.click(screen.getByRole('button', { name: '사이드바 열기 또는 닫기' }));
    expect(container.querySelector('.app-shell')).not.toHaveClass('sidebar-collapsed');
  });

  it('opens the mobile drawer and closes it from the dimmed area without an X button', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    const mobileSidebar = container.querySelector('.mobile-sidebar');
    const dim = screen.getByTestId('mobile-sidebar-dim');

    expect(mobileSidebar).toHaveAttribute('aria-hidden', 'true');
    expect(dim).toHaveAttribute('aria-hidden', 'true');
    expect(dim).not.toHaveClass('visible');

    await user.click(screen.getByRole('button', { name: '모바일 사이드바 열기' }));
    expect(screen.getByRole('complementary', { name: '모바일 분석자료실 메뉴' })).toBeInTheDocument();
    expect(mobileSidebar).toHaveAttribute('aria-hidden', 'false');
    expect(container.querySelector('.mobile-sidebar')).toHaveClass('open');
    expect(dim).toHaveClass('visible');
    expect(within(mobileSidebar as HTMLElement).queryByRole('button', { name: /닫기/ })).not.toBeInTheDocument();
    expect(within(mobileSidebar as HTMLElement).queryByRole('button', { name: 'X' })).not.toBeInTheDocument();
    expect(within(mobileSidebar as HTMLElement).queryByRole('button', { name: '×' })).not.toBeInTheDocument();

    await user.click(screen.getByTestId('mobile-sidebar-dim'));
    expect(container.querySelector('.mobile-sidebar')).not.toHaveClass('open');
    expect(mobileSidebar).toHaveAttribute('aria-hidden', 'true');
    expect(dim).not.toHaveClass('visible');
  });

  it('uses underline tabs for finance routes and calls onNavigate', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={onNavigate}>
        <p>본문</p>
      </AppShell>,
    );

    const financeTabs = screen.getByRole('tablist', { name: '금융 하위 페이지' });
    const activeTab = screen.getByRole('tab', { name: '컨센서스 괴리율 랭킹' });

    expect(financeTabs).toHaveClass('finance-tabs');
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab).toHaveClass('finance-tab active');
    await user.click(screen.getByRole('tab', { name: 'AI 분석 리포트' }));

    expect(onNavigate).toHaveBeenCalledWith('/finance/ai-reports');
  });

  it('does not render finance tabs for a main route', () => {
    render(
      <AppShell activeRoute={macroRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    expect(screen.queryByRole('tablist', { name: '금융 하위 페이지' })).not.toBeInTheDocument();
  });

  it('renders the active route page header and children', () => {
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    expect(screen.getByText('금융 밸류에이션')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '컨센서스 괴리율 랭킹' })).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
  });
});
