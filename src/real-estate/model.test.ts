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

  it('merges same-complex pyeong targets with the same exclusive area and derives asking average from articles', () => {
    const dashboard = buildRealEstateDashboard({
      interestTargets: [
        { complex_id: '103797', pyeong_type: '3', display_order: 5, display_pyeong_name: '84C' },
        { complex_id: '103797', pyeong_type: '1', display_order: 6, display_pyeong_name: '85A' },
        { complex_id: '103797', pyeong_type: '2', display_order: 7, display_pyeong_name: '85B' },
      ],
      complexes: [
        {
          complex_id: '103797',
          complex_name: '래미안크레시티',
          total_household_number: 2397,
          use_approval_date: '2014-10-23',
        },
      ],
      pyeongOptions: [
        { complex_id: '103797', pyeong_type: '1', pyeong_name: '85A', exclusive_space: 59.99 },
        { complex_id: '103797', pyeong_type: '2', pyeong_name: '85B', exclusive_space: 59.99 },
        { complex_id: '103797', pyeong_type: '3', pyeong_name: '84C', exclusive_space: 59.99 },
      ],
      articles: [
        {
          article_number: 'c-low',
          complex_id: '103797',
          pyeong_type: '3',
          trade_type_name: '매매',
          deal_price: 1520000000,
        },
        {
          article_number: 'a-high',
          complex_id: '103797',
          pyeong_type: '1',
          trade_type_name: '매매',
          deal_price: 1600000000,
        },
        {
          article_number: 'b-high',
          complex_id: '103797',
          pyeong_type: '2',
          trade_type_name: '매매',
          deal_price: 1640000000,
        },
      ],
      priceMetrics: [
        {
          complex_id: '103797',
          pyeong_type: '1',
          trade_type: 'A1',
          window_months: 3,
          median_deal_price: 1547500000,
          raw_real_price: {
            records: [
              { dealPrice: 1510000000 },
              { dealPrice: 1620000000 },
            ],
          },
          updated_at: '2026-05-07T08:02:25.029+00:00',
        },
        {
          complex_id: '103797',
          pyeong_type: '2',
          trade_type: 'A1',
          window_months: 3,
          median_deal_price: 1547500000,
          raw_real_price: {
            records: [
              { dealPrice: 1510000000 },
              { dealPrice: 1620000000 },
            ],
          },
          updated_at: '2026-05-07T08:02:25.029+00:00',
        },
        {
          complex_id: '103797',
          pyeong_type: '3',
          trade_type: 'A1',
          window_months: 3,
          median_deal_price: 1547500000,
          raw_real_price: {
            records: [
              { dealPrice: 1510000000 },
              { dealPrice: 1620000000 },
            ],
          },
          updated_at: '2026-05-07T08:02:25.029+00:00',
        },
      ],
    });

    expect(dashboard.targets).toHaveLength(1);
    expect(dashboard.targets[0]).toMatchObject({
      complexName: '래미안크레시티',
      pyeongName: '84C / 85A / 85B',
      latestMetric: {
        actualAveragePrice: 1565000000,
        actualMedianPrice: 1547500000,
        askingAveragePrice: 1586666666.6666667,
      },
    });
    expect(dashboard.targets[0]?.currentArticles.map((article) => article.articleNo)).toEqual([
      'c-low',
      'a-high',
      'b-high',
    ]);
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.articleNo)).toEqual(['c-low']);
  });

  it('merges all interest pyeongs under the same complex even when exclusive areas differ or are missing', () => {
    const dashboard = buildRealEstateDashboard({
      interestTargets: [
        { complex_id: '100692', pyeong_type: '1', display_order: 1, display_pyeong_name: '1' },
        { complex_id: '100692', pyeong_type: '2', display_order: 2, display_pyeong_name: '79B' },
        { complex_id: '100692', pyeong_type: '3', display_order: 3, display_pyeong_name: '79C' },
        { complex_id: '100692', pyeong_type: '4', display_order: 4, display_pyeong_name: '4' },
      ],
      complexes: [{ complex_id: '100692', complex_name: '래미안옥수리버젠' }],
      pyeongOptions: [
        { complex_id: '100692', pyeong_type: '1', pyeong_name: '1', exclusive_space: null },
        { complex_id: '100692', pyeong_type: '2', pyeong_name: '79B', exclusive_space: 59.25 },
        { complex_id: '100692', pyeong_type: '3', pyeong_name: '79C', exclusive_space: 59.84 },
        { complex_id: '100692', pyeong_type: '4', pyeong_name: '4', exclusive_space: null },
      ],
      articles: [
        { article_number: 'b', complex_id: '100692', pyeong_type: '2', trade_type_name: '매매', deal_price: 1500000000 },
        { article_number: 'c', complex_id: '100692', pyeong_type: '3', trade_type_name: '매매', deal_price: 1600000000 },
      ],
      priceMetrics: [
        {
          complex_id: '100692',
          pyeong_type: '2',
          trade_type: 'A1',
          window_months: 3,
          median_deal_price: 1550000000,
          updated_at: '2026-05-07T00:00:00Z',
        },
        {
          complex_id: '100692',
          pyeong_type: '3',
          trade_type: 'A1',
          window_months: 3,
          median_deal_price: 1570000000,
          updated_at: '2026-05-07T00:00:00Z',
        },
      ],
    });

    expect(dashboard.targets).toHaveLength(1);
    expect(dashboard.targets[0]).toMatchObject({
      id: '100692',
      complexName: '래미안옥수리버젠',
      pyeongName: '1 / 79B / 79C / 4',
      latestMetric: {
        actualMedianPrice: 1560000000,
      },
    });
    expect(dashboard.targets[0]?.currentArticles.map((article) => article.articleNo)).toEqual(['b', 'c']);
    expect(dashboard.targets[0]?.belowMedianArticles.map((article) => article.articleNo)).toEqual(['b']);
  });

  it('merges pyeong chart data and active current sale listings at the complex level', () => {
    const dashboard = buildRealEstateDashboard({
      interestTargets: [
        { complex_id: '103797', pyeong_type: '3', display_order: 5, display_pyeong_name: '84C' },
        { complex_id: '103797', pyeong_type: '1', display_order: 6, display_pyeong_name: '85A' },
        { complex_id: '103797', pyeong_type: '2', display_order: 7, display_pyeong_name: '85B' },
      ],
      complexes: [{ complex_id: '103797', complex_name: '래미안크레시티' }],
      pyeongOptions: [
        { complex_id: '103797', pyeong_type: '1', pyeong_name: '85A', exclusive_space: 59.99 },
        { complex_id: '103797', pyeong_type: '2', pyeong_name: '85B', exclusive_space: 59.99 },
        { complex_id: '103797', pyeong_type: '3', pyeong_name: '84C', exclusive_space: 59.99 },
      ],
      articles: [
        {
          article_number: 'active-a',
          complex_id: '103797',
          pyeong_type: '1',
          trade_type_name: '매매',
          deal_price: 1520000000,
          is_active: true,
          removed_at: null,
        },
        {
          article_number: 'removed-b',
          complex_id: '103797',
          pyeong_type: '2',
          trade_type_name: '매매',
          deal_price: 1590000000,
          is_active: false,
          removed_at: '2026-04-01T00:00:00Z',
        },
        {
          article_number: 'active-c',
          complex_id: '103797',
          pyeong_type: '2',
          trade_type_name: '매매',
          deal_price: 1650000000,
          is_active: true,
          removed_at: null,
        },
        {
          article_number: 'lease-d',
          complex_id: '103797',
          pyeong_type: '1',
          trade_type_name: '전세',
          deal_price: 800000000,
          is_active: true,
          removed_at: null,
        },
      ],
      priceMetrics: [
        {
          complex_id: '103797',
          pyeong_type: '1',
          trade_type: 'A1',
          window_months: 3,
          chart_data: {
            series: [
              { trade_date: '2026-02-24', deal_price: 1600000000 },
              { tradeDate: '2026-03-28', dealPrice: 1620000000 },
              { tradeDate: '2026-04-14', dealPrice: 1540000000 },
            ],
            activeListingRange: { count: 1, minPrice: 1520000000, maxPrice: 1520000000 },
          },
          updated_at: '2026-04-20T00:00:00Z',
        },
        {
          complex_id: '103797',
          pyeong_type: '2',
          trade_type: 'A1',
          window_months: 3,
          chart_data: {
            series: [
              { trade_date: '2026-03-28', deal_price: 1620000000 },
              { trade_date: '2026-04-14', deal_price: 1550000000 },
            ],
            active_listing_range: { count: 1, min_price: 1650000000, max_price: 1650000000 },
          },
          updated_at: '2026-04-21T00:00:00Z',
        },
      ],
    });

    const target = dashboard.targets[0];

    expect(dashboard.targets).toHaveLength(1);
    expect(target?.id).toBe('103797');
    expect(target?.pyeongName).toBe('84C / 85A / 85B');
    expect(target?.chartSeries).toEqual([
      { tradeDate: '2026-02-24', dealPrice: 1600000000 },
      { tradeDate: '2026-03-28', dealPrice: 1620000000 },
      { tradeDate: '2026-04-14', dealPrice: 1540000000 },
      { tradeDate: '2026-04-14', dealPrice: 1550000000 },
    ]);
    expect(target?.latestRealPrice).toBe(1550000000);
    expect(target?.highestRealPrice).toBe(1620000000);
    expect(target?.activeListingRange).toEqual({
      count: 2,
      minPrice: 1520000000,
      maxPrice: 1650000000,
    });
    expect(target?.currentArticles.map((article) => article.articleNo)).toEqual(['active-a', 'active-c']);
  });
});

describe('formatKoreanHousePrice', () => {
  it('formats won prices in Korean house price units', () => {
    expect(formatKoreanHousePrice(1485000000)).toBe('14억 8,500만');
    expect(formatKoreanHousePrice(900000000)).toBe('9억');
    expect(formatKoreanHousePrice(null)).toBe('-');
  });
});
