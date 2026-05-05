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
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    expect(screen.getByRole('complementary', { name: '분석자료실 메뉴' })).toHaveTextContent('분석자료실');
    expect(screen.getByRole('banner')).not.toHaveTextContent('분석자료실');
    expect(screen.getByRole('button', { name: '사이드바 열기 또는 닫기' })).toBeInTheDocument();
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
  });

  it('opens the mobile drawer and closes it from the dimmed area without an X button', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell activeRoute={consensusRoute} onNavigate={vi.fn()}>
        <p>본문</p>
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: '모바일 사이드바 열기' }));
    expect(container.querySelector('.mobile-sidebar')).toHaveClass('open');
    expect(screen.queryByRole('button', { name: /닫기/ })).not.toBeInTheDocument();

    await user.click(screen.getByTestId('mobile-sidebar-dim'));
    expect(container.querySelector('.mobile-sidebar')).not.toHaveClass('open');
  });

  it('uses underline tabs for finance routes and calls onNavigate', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <AppShell activeRoute={consensusRoute} onNavigate={onNavigate}>
        <p>본문</p>
      </AppShell>,
    );

    expect(screen.getByRole('tab', { name: '컨센서스 괴리율 랭킹' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'AI 분석 리포트' }));

    expect(onNavigate).toHaveBeenCalledWith('/finance/ai-reports');
  });
});
