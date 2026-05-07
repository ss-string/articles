import { describe, expect, it } from 'vitest';
import {
  buildRealEstateDashboard,
  formatKoreanHousePrice,
  type RawRealEstateTables,
} from './model';

describe('buildRealEstateDashboard', () => {
  it('joins real estate tables and exposes articles below the latest median price', () => {
    const tables: RawRealEstateTables = {
      interestTargets: [
        { id: 't2', complex_id: 'c2', pyeong_type: '59', sort_order: 2 },
        { id: 't1', complex_id: 'c1', pyeong_type: '80', sort_order: 1 },
      ],
      complexes: [
        {
          complex_id: 'c1',
          complex_name: '약수하이츠',
          households: 2282,
          use_approved_at: '1999-07-30',
        },
        { complex_id: 'c2', complex_name: '래미안옥수리버젠' },
      ],
      pyeongOptions: [
        { complex_id: 'c1', pyeong_type: '80', display_pyeong_name: '32평' },
        { complex_id: 'c2', pyeong_type: '59', display_pyeong_name: '24평' },
      ],
      articles: [
        { article_no: 'a2', complex_id: 'c1', pyeong_type: '80', trade_type: '매매', price: 1550000000 },
        { article_no: 'a1', complex_id: 'c1', pyeong_type: '80', trade_type: 'sale', price: 1320000000 },
        { article_no: 'lease1', complex_id: 'c1', pyeong_type: '80', trade_type: '전세', price: 900000000 },
        { article_no: 'a3', complex_id: 'c1', pyeong_type: '80', trade_type: null, price: 1420000000 },
      ],
      priceMetrics: [
        {
          complex_id: 'c1',
          pyeong_type: '80',
          metric_date: '2026-05-01',
          actual_average_price: 1480000000,
          asking_average_price: 1460000000,
          actual_median_price: 1470000000,
        },
        {
          complex_id: 'c1',
          pyeong_type: '80',
          metric_date: '2026-04-01',
          actual_average_price: 1430000000,
          asking_average_price: 1440000000,
          actual_median_price: 1450000000,
        },
      ],
    };

    const dashboard = buildRealEstateDashboard(tables);

    expect(dashboard.targets.map((target) => target.complexName)).toEqual([
      '약수하이츠',
      '래미안옥수리버젠',
    ]);
    expect(dashboard.targets[0]?.latestMetric?.actualAveragePrice).toBe(1480000000);
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.articleNo)).toEqual(['a1', 'a3']);
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.price)).toEqual([
      1320000000,
      1420000000,
    ]);
    expect(dashboard.targets[0]?.metricsSeries.map((metric) => metric.metricDate)).toEqual([
      '2026-04-01',
      '2026-05-01',
    ]);
  });
});

describe('formatKoreanHousePrice', () => {
  it('formats won prices in Korean house price units', () => {
    expect(formatKoreanHousePrice(1485000000)).toBe('14억 8,500만');
    expect(formatKoreanHousePrice(900000000)).toBe('9억');
    expect(formatKoreanHousePrice(null)).toBe('-');
  });
});
