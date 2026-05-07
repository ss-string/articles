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
        {
          article_number: 'a1',
          complex_id: 'c1',
          pyeong_type: '80',
          trade_type: 'sale',
          price: 1320000000,
          building_name: '116동',
          floor_info: '저/18',
        },
        { article_number: 'median', complex_id: 'c1', pyeong_type: '80', trade_type: '매매', price: 1470000000 },
        { article_no: 'lease1', complex_id: 'c1', pyeong_type: '80', trade_type: '전세', price: 900000000 },
        { article_no: 'unknown1', complex_id: 'c1', pyeong_type: '80', trade_type: null, price: 1420000000 },
        { article_no: 'a3', complex_id: 'c1', pyeong_type: '80', trade_type: '매매', price: 1420000000 },
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
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.articleNo)).toEqual(['a1', 'a3', 'median']);
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.price)).toEqual([
      1320000000,
      1420000000,
      1470000000,
    ]);
    expect(dashboard.targets[0]?.belowMedianArticles[0]).toMatchObject({
      buildingName: '116동',
      floorInfo: '저/18',
    });
    expect(dashboard.targets[0]?.metricsSeries.map((metric) => metric.metricDate)).toEqual([
      '2026-04-01',
      '2026-05-01',
    ]);
  });

  it('accepts the local Supabase real estate schema column names and prefers sale metrics', () => {
    const dashboard = buildRealEstateDashboard({
      interestTargets: [{ complex_id: 'c1', pyeong_type: '80', sort_order: 1 }],
      complexes: [
        {
          complex_id: 'c1',
          complex_name: '약수하이츠',
          total_household_number: 2282,
          use_approval_date: '1999-07-30',
        },
      ],
      pyeongOptions: [{ complex_id: 'c1', pyeong_type: '80', pyeong_name: '80형', exclusive_space: 59.97 }],
      articles: [
        {
          article_number: 'sale1',
          complex_id: 'c1',
          pyeong_type: '80',
          trade_type_name: '매매',
          deal_price: 1320000000,
          dong_name: '116동',
          floor_info: '저/18',
        },
        {
          article_number: 'lease1',
          complex_id: 'c1',
          pyeong_type: '80',
          trade_type_name: '전세',
          deal_price: 700000000,
        },
        {
          article_number: 'unknown1',
          complex_id: 'c1',
          pyeong_type: '80',
          deal_price: 1200000000,
        },
      ],
      priceMetrics: [
        {
          complex_id: 'c1',
          pyeong_type: '80',
          trade_type: '전세',
          window_months: 3,
          median_deal_price: 700000000,
          updated_at: '2026-05-03T00:00:00Z',
        },
        {
          complex_id: 'c1',
          pyeong_type: '80',
          trade_type: '매매',
          window_months: 12,
          median_deal_price: 1600000000,
          updated_at: '2026-05-04T00:00:00Z',
        },
        {
          complex_id: 'c1',
          pyeong_type: '80',
          trade_type: '매매',
          window_months: 3,
          median_deal_price: 1470000000,
          min_deal_price: 1320000000,
          max_deal_price: 1590000000,
          updated_at: '2026-05-02T00:00:00Z',
        },
      ],
    });

    expect(dashboard.targets[0]).toMatchObject({
      households: 2282,
      approvedAt: '1999-07-30',
      pyeongName: '80형',
      latestMetric: {
        tradeType: '매매',
        windowMonths: 3,
        actualAveragePrice: 1470000000,
        actualMedianPrice: 1470000000,
        minPrice: 1320000000,
        maxPrice: 1590000000,
      },
    });
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.articleNo)).toEqual(['sale1']);
  });
});

describe('formatKoreanHousePrice', () => {
  it('formats won prices in Korean house price units', () => {
    expect(formatKoreanHousePrice(1485000000)).toBe('14억 8,500만');
    expect(formatKoreanHousePrice(900000000)).toBe('9억');
    expect(formatKoreanHousePrice(null)).toBe('-');
  });
});
