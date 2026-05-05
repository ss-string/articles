import { describe, expect, it } from 'vitest';
import {
  financeRoutes,
  getActiveRoute,
  getVisibleNavigation,
  mainRoutes,
  navigateToPath,
  normalizePathname,
  routes,
} from './navigation';

describe('navigation', () => {
  it('normalizes supported and unknown paths to the active route', () => {
    expect(normalizePathname('/')).toBe('/main/macro-regime');
    expect(normalizePathname('/main/macro-regime')).toBe('/main/macro-regime');
    expect(normalizePathname('/finance/hot-news')).toBe('/finance/hot-news');
    expect(normalizePathname('/finance/consensus')).toBe('/finance/consensus');
    expect(normalizePathname('/finance/ai-reports')).toBe('/finance/ai-reports');
    expect(normalizePathname('/unknown')).toBe('/main/macro-regime');
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
    expect(routes.map((route) => route.symbol)).toEqual(['◷', '≡', '↗', '⌁']);
    expect(mainRoutes.map((route) => route.label)).toEqual(['매크로 레짐']);
    expect(financeRoutes.map((route) => route.label)).toEqual([
      '핫 뉴스 분석 리포트',
      '컨센서스 괴리율 랭킹',
      'AI 분석 리포트',
    ]);
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

      expect(window.location.pathname).toBe('/main/macro-regime');
      expect(popstateCount).toBe(1);

      navigateToPath('/finance/ai-reports');

      expect(window.location.pathname).toBe('/finance/ai-reports');
      expect(popstateCount).toBe(2);
    } finally {
      window.removeEventListener('popstate', handlePopstate);
    }
  });
});
