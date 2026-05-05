import { type ReactNode, useState } from 'react';
import { financeRoutes, getVisibleNavigation, type AppRoute } from '../navigation';

type AppShellProps = {
  activeRoute: AppRoute;
  onNavigate(path: string): void;
  children: ReactNode;
};

export function AppShell({ activeRoute, onNavigate, children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const visibleNavigation = getVisibleNavigation(activeRoute.path);

  const shellClassName = ['app-shell', isSidebarCollapsed ? 'sidebar-collapsed' : ''].filter(Boolean).join(' ');
  const mobileSidebarClassName = ['mobile-sidebar', isMobileSidebarOpen ? 'open' : ''].filter(Boolean).join(' ');

  function handleNavigate(path: string) {
    onNavigate(path);
    setIsMobileSidebarOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <strong>분석자료실</strong>
        <span>Research Library</span>
      </div>
      <nav className="sidebar-nav">
        {visibleNavigation.map((item) => (
          <div className="sidebar-section" key={item.key}>
            <button className={item.active ? 'active' : undefined} type="button">
              {item.symbol} {item.label}
            </button>
            {item.children.length > 0 ? (
              <div className="sidebar-children">
                {item.children.map((route) => (
                  <button
                    className={route.path === activeRoute.path ? 'active' : undefined}
                    key={route.path}
                    onClick={() => handleNavigate(route.path)}
                    type="button"
                  >
                    {route.symbol} {route.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className={shellClassName}>
      <aside className="sidebar" aria-label="분석자료실 메뉴">
        {sidebarContent}
      </aside>

      <div className="mobile-sidebar-dim" data-testid="mobile-sidebar-dim" onClick={() => setIsMobileSidebarOpen(false)} />
      <aside className={mobileSidebarClassName} aria-label="모바일 분석자료실 메뉴">
        {sidebarContent}
      </aside>

      <div className="app-shell-main">
        <header className="top-nav">
          <div className="top-nav-left">
            <button
              aria-label="사이드바 열기 또는 닫기"
              aria-hidden={isMobileSidebarOpen}
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              tabIndex={isMobileSidebarOpen ? -1 : undefined}
              type="button"
            >
              ☰
            </button>
            <button aria-label="모바일 사이드바 열기" onClick={() => setIsMobileSidebarOpen(true)} type="button">
              ☰
            </button>
          </div>
          <div className="top-nav-actions">
            <button type="button">로그인</button>
            <button type="button">설정</button>
          </div>
        </header>

        {activeRoute.section === 'finance' ? (
          <nav className="finance-tabs" aria-label="금융 하위 페이지" role="tablist">
            {financeRoutes.map((route) => (
              <button
                aria-selected={route.path === activeRoute.path}
                className={route.path === activeRoute.path ? 'finance-tab active' : 'finance-tab'}
                key={route.path}
                onClick={() => onNavigate(route.path)}
                role="tab"
                type="button"
              >
                {route.label}
              </button>
            ))}
          </nav>
        ) : null}

        <main className="page-content">
          <div className="page-header">
            <p>{activeRoute.kicker}</p>
            <h1>{activeRoute.label}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
