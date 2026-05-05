export type AppSection = 'main' | 'finance';

export type AppRoute = {
  path: string;
  section: AppSection;
  label: string;
  shortLabel: string;
  kicker: string;
  symbol: string;
};

export type TopLevelNavigationItem = {
  key: AppSection;
  label: string;
  symbol: string;
  active: boolean;
  children: AppRoute[];
};

const defaultPath = '/main/macro-regime';

export const mainRoutes: AppRoute[] = [
  {
    path: '/main/macro-regime',
    section: 'main',
    label: '매크로 레짐',
    shortLabel: '매크로 레짐',
    kicker: '시장 국면 분석',
    symbol: '◷',
  },
];

export const financeRoutes: AppRoute[] = [
  {
    path: '/finance/hot-news',
    section: 'finance',
    label: '핫 뉴스 분석 리포트',
    shortLabel: '핫 뉴스 분석',
    kicker: '금융 이슈',
    symbol: '≡',
  },
  {
    path: '/finance/consensus',
    section: 'finance',
    label: '컨센서스 괴리율 랭킹',
    shortLabel: '컨센서스 랭킹',
    kicker: '금융 밸류에이션',
    symbol: '↗',
  },
  {
    path: '/finance/ai-reports',
    section: 'finance',
    label: 'AI 분석 리포트',
    shortLabel: 'AI 분석',
    kicker: '자동 분석 요약',
    symbol: '⌁',
  },
];

export const routes: AppRoute[] = [...mainRoutes, ...financeRoutes];

export function normalizePathname(pathname: string) {
  if (pathname === '/') {
    return defaultPath;
  }

  return routes.some((route) => route.path === pathname) ? pathname : defaultPath;
}

export function getActiveRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  return routes.find((route) => route.path === normalizedPathname) ?? routes[0];
}

export function getVisibleNavigation(pathname: string): TopLevelNavigationItem[] {
  const activeRoute = getActiveRoute(pathname);

  return [
    {
      key: 'main',
      label: '메인',
      symbol: '⌂',
      active: activeRoute.section === 'main',
      children: activeRoute.section === 'main' ? mainRoutes : [],
    },
    {
      key: 'finance',
      label: '금융',
      symbol: '◆',
      active: activeRoute.section === 'finance',
      children: activeRoute.section === 'finance' ? financeRoutes : [],
    },
  ];
}

export function navigateToPath(path: string) {
  const normalizedPath = normalizePathname(path);
  window.history.pushState({}, '', normalizedPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
