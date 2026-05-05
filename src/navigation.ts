import { appBasePath } from './appBasePath';

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
const basePath = import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/' ? import.meta.env.BASE_URL : appBasePath;

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

function ensureLeadingSlash(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function trimTrailingSlash(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function splitPathAndSuffix(path: string) {
  const suffixStart = path.search(/[?#]/);

  if (suffixStart === -1) {
    return { pathname: path, suffix: '' };
  }

  return {
    pathname: path.slice(0, suffixStart),
    suffix: path.slice(suffixStart),
  };
}

export function stripBasePath(pathname: string) {
  const normalizedPathname = ensureLeadingSlash(pathname || '/');
  const normalizedBase = trimTrailingSlash(ensureLeadingSlash(basePath));

  if (normalizedBase === '/') {
    return normalizedPathname;
  }

  if (normalizedPathname === normalizedBase || normalizedPathname === `${normalizedBase}/`) {
    return '/';
  }

  if (normalizedPathname.startsWith(`${normalizedBase}/`)) {
    return ensureLeadingSlash(normalizedPathname.slice(normalizedBase.length));
  }

  return normalizedPathname;
}

export function normalizePathname(pathname: string) {
  const { pathname: pathnameOnly } = splitPathAndSuffix(pathname);
  const appPathname = stripBasePath(pathnameOnly);

  if (appPathname === '/') {
    return defaultPath;
  }

  return routes.some((route) => route.path === appPathname) ? appPathname : defaultPath;
}

export function getActiveRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  return routes.find((route) => route.path === normalizedPathname) ?? routes[0];
}

export function hasConsensusContentQuery(search: string) {
  return new URLSearchParams(search).get('contentType') === 'consensus';
}

export function getActiveRouteForLocation(pathname: string, search: string) {
  const appPathname = stripBasePath(pathname);

  if (appPathname === '/' && hasConsensusContentQuery(search)) {
    return routes.find((route) => route.path === '/finance/consensus') ?? routes[0];
  }

  return getActiveRoute(pathname);
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

export function toBrowserPath(path: string) {
  const { suffix } = splitPathAndSuffix(path);
  const normalizedPath = normalizePathname(path);
  const normalizedBase = trimTrailingSlash(ensureLeadingSlash(basePath));
  const browserPath = normalizedBase === '/' ? normalizedPath : `${normalizedBase}${normalizedPath}`;

  return `${browserPath}${suffix}`;
}

export function navigateToPath(path: string) {
  window.history.pushState({}, '', toBrowserPath(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
}
