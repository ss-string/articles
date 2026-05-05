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
  const mobileSidebarDimClassName = ['mobile-sidebar-dim', isMobileSidebarOpen ? 'visible' : '']
    .filter(Boolean)
    .join(' ');

  const sectionPaths = {
    main: '/main/macro-regime',
    finance: '/finance/hot-news',
  };

  function handleNavigate(path: string) {
    onNavigate(path);
    setIsMobileSidebarOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="brand">
        <strong className="brand-mark">분석자료실</strong>
        <span>Research Library</span>
      </div>
      <nav className="nav-list">
        {visibleNavigation.map((item) => (
          <div className="nav-group" key={item.key}>
            <button
              className={['nav-item', item.active ? 'active' : ''].filter(Boolean).join(' ')}
              onClick={() => handleNavigate(sectionPaths[item.key])}
              type="button"
            >
              <span className="menu-symbol">{item.symbol}</span> {item.label}
            </button>
            {item.children.length > 0 ? (
              <div className="sub-list">
                {item.children.map((route) => (
                  <button
                    className={['sub-item', route.path === activeRoute.path ? 'active' : ''].filter(Boolean).join(' ')}
                    key={route.path}
                    onClick={() => handleNavigate(route.path)}
                    type="button"
                  >
                    <span className="sub-symbol">{route.symbol}</span> {route.label}
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

      <div
        aria-hidden={!isMobileSidebarOpen}
        className={mobileSidebarDimClassName}
        data-testid="mobile-sidebar-dim"
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      <aside
        aria-hidden={!isMobileSidebarOpen}
        className={mobileSidebarClassName}
        aria-label="모바일 분석자료실 메뉴"
      >
        {isMobileSidebarOpen ? sidebarContent : null}
      </aside>

      <div className="workspace">
        <header className="top-nav">
          <div className="top-nav-left">
            <button
              aria-label="사이드바 열기 또는 닫기"
              className="sidebar-toggle desktop-toggle"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              type="button"
            >
              ☰
            </button>
            <button
              aria-label="모바일 사이드바 열기"
              className="sidebar-toggle mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              type="button"
            >
              ☰
            </button>
          </div>
          <div className="top-nav-actions">
            <span>로그인</span>
            <span>설정</span>
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

        <main className="dashboard">
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
