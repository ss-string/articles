import { describe, expect, it } from 'vitest';
import {
  financeRoutes,
  getActiveRoute,
  getActiveRouteForLocation,
  getVisibleNavigation,
  mainRoutes,
  navigateToPath,
  normalizePathname,
  realEstateRoutes,
  routes,
  stripBasePath,
  toBrowserPath,
} from './navigation';

describe('navigation', () => {
  it('normalizes supported and unknown paths to the active route', () => {
    expect(normalizePathname('/')).toBe('/main/macro-regime');
    expect(normalizePathname('/articles/')).toBe('/main/macro-regime');
    expect(normalizePathname('/main/macro-regime')).toBe('/main/macro-regime');
    expect(normalizePathname('/finance/hot-news')).toBe('/finance/hot-news');
    expect(normalizePathname('/finance/consensus')).toBe('/finance/consensus');
    expect(normalizePathname('/articles/finance/consensus')).toBe('/finance/consensus');
    expect(normalizePathname('/finance/volatility-calendar')).toBe('/finance/volatility-calendar');
    expect(normalizePathname('/articles/finance/volatility-calendar')).toBe('/finance/volatility-calendar');
    expect(normalizePathname('/finance/ai-reports')).toBe('/finance/ai-reports');
    expect(normalizePathname('/real-estate/transactions')).toBe('/real-estate/transactions');
    expect(normalizePathname('/articles/real-estate/transactions')).toBe('/real-estate/transactions');
    expect(normalizePathname('/unknown')).toBe('/main/macro-regime');
  });

  it('strips and reapplies the configured Vite base path', () => {
    expect(stripBasePath('/articles/finance/consensus')).toBe('/finance/consensus');
    expect(stripBasePath('/articles/')).toBe('/');
    expect(stripBasePath('/finance/consensus')).toBe('/finance/consensus');
    expect(toBrowserPath('/finance/volatility-calendar')).toBe('/articles/finance/volatility-calendar');
    expect(toBrowserPath('/finance/ai-reports')).toBe('/articles/finance/ai-reports');
    expect(toBrowserPath('/real-estate/transactions')).toBe('/articles/real-estate/transactions');
    expect(toBrowserPath('/unknown')).toBe('/articles/main/macro-regime');
  });

  it('returns route metadata with symbols and section labels', () => {
    expect(getActiveRoute('/finance/consensus')).toEqual({
      path: '/finance/consensus',
      section: 'finance',
      label: '컨센서스 괴리율 랭킹',
      shortLabel: '컨센서스 랭킹',
      kicker: '금융 밸류에이션',
      symbol: '↗',
    });
    expect(getActiveRoute('/finance/volatility-calendar')).toEqual({
      path: '/finance/volatility-calendar',
      section: 'finance',
      label: '변동성 캘린더',
      shortLabel: '변동성 캘린더',
      kicker: '매수 주의 캘린더',
      symbol: '□',
    });
    expect(getActiveRoute('/real-estate/transactions')).toEqual({
      path: '/real-estate/transactions',
      section: 'real-estate',
      label: '실거래정보',
      shortLabel: '실거래',
      kicker: '부동산 가격 모니터링',
      symbol: '⌁',
    });
    expect(routes.map((route) => route.symbol)).toEqual(['◷', '≡', '↗', '□', '⌁', '⌁']);
    expect(mainRoutes.map((route) => route.label)).toEqual(['매크로 레짐']);
    expect(financeRoutes.map((route) => route.label)).toEqual([
      '핫 뉴스 분석 리포트',
      '컨센서스 괴리율 랭킹',
      '변동성 캘린더',
      'AI 분석 리포트',
    ]);
    expect(realEstateRoutes.map((route) => route.label)).toEqual(['실거래정보']);
  });

  it('maps legacy root consensus query links to the consensus route', () => {
    const consensusQuery = '?contentType=consensus&contentParams=%7B%22gicode%22%3A%22A005930%22%7D';

    expect(getActiveRouteForLocation('/', consensusQuery).path).toBe('/finance/consensus');
    expect(getActiveRouteForLocation('/articles/', consensusQuery).path).toBe('/finance/consensus');
    expect(getActiveRouteForLocation('/', '').path).toBe('/main/macro-regime');
  });

  it('shows only the active top-level section children', () => {
    expect(getVisibleNavigation('/main/macro-regime')).toEqual([
      {
        key: 'main',
        label: '메인',
        symbol: '⌂',
        active: true,
        children: [routes[0]],
      },
      {
        key: 'finance',
        label: '금융',
        symbol: '◆',
        active: false,
        children: [],
      },
      {
        key: 'real-estate',
        label: '부동산',
        symbol: '▦',
        active: false,
        children: [],
      },
    ]);

    expect(getVisibleNavigation('/finance/hot-news')).toEqual([
      {
        key: 'main',
        label: '메인',
        symbol: '⌂',
        active: false,
        children: [],
      },
      {
        key: 'finance',
        label: '금융',
        symbol: '◆',
        active: true,
        children: financeRoutes,
      },
      {
        key: 'real-estate',
        label: '부동산',
        symbol: '▦',
        active: false,
        children: [],
      },
    ]);

    expect(getVisibleNavigation('/real-estate/transactions')).toEqual([
      {
        key: 'main',
        label: '메인',
        symbol: '⌂',
        active: false,
        children: [],
      },
      {
        key: 'finance',
        label: '금융',
        symbol: '◆',
        active: false,
        children: [],
      },
      {
        key: 'real-estate',
        label: '부동산',
        symbol: '▦',
        active: true,
        children: realEstateRoutes,
      },
    ]);
  });

  it('navigates to normalized paths and dispatches popstate events', () => {
    let popstateCount = 0;
    const handlePopstate = () => {
      popstateCount += 1;
    };

    window.addEventListener('popstate', handlePopstate);

    try {
      navigateToPath('/unknown');

      expect(window.location.pathname).toBe('/articles/main/macro-regime');
      expect(popstateCount).toBe(1);

      navigateToPath('/finance/ai-reports');

      expect(window.location.pathname).toBe('/articles/finance/ai-reports');
      expect(popstateCount).toBe(2);

      navigateToPath('/finance/volatility-calendar');

      expect(window.location.pathname).toBe('/articles/finance/volatility-calendar');
      expect(popstateCount).toBe(3);
    } finally {
      window.removeEventListener('popstate', handlePopstate);
    }
  });
});
