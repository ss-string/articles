import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { RawRealEstateTables } from '../real-estate/model';
import { RealEstateTransactionsPage } from './RealEstateTransactionsPage';

const tables: RawRealEstateTables = {
  interestTargets: [
    { complex_id: 'c1', pyeong_type: '80', sort_order: 1 },
    { complex_id: 'c2', pyeong_type: '84A', sort_order: 2 },
  ],
  complexes: [
    {
      complex_id: 'c1',
      complex_name: '약수하이츠',
      complex_url: 'https://fin.land.naver.com/complexes/c1?tab=article',
      households: 2282,
      use_approved_at: '1999-07-01',
    },
    { complex_id: 'c2', complex_name: '신당삼성', households: 994, use_approved_at: '1999-11-20' },
  ],
  pyeongOptions: [
    { complex_id: 'c1', pyeong_type: '80', display_pyeong_name: '80형' },
    { complex_id: 'c2', pyeong_type: '84A', display_pyeong_name: '84A형' },
  ],
  articles: [
    {
      article_number: 'a1',
      article_name: '약수하이츠',
      complex_id: 'c1',
      pyeong_type: '80',
      trade_type: '매매',
      price: 1320000000,
      building_name: '116동',
      floor_info: '저/18',
      is_active: true,
      removed_at: null,
    },
    {
      article_number: 'a2',
      article_name: '약수하이츠',
      complex_id: 'c1',
      pyeong_type: '80',
      trade_type: '매매',
      price: 1550000000,
      building_name: '110동',
      floor_info: '중/20',
      is_active: true,
      removed_at: null,
    },
    {
      article_number: 'a3',
      article_name: '약수하이츠',
      complex_id: 'c1',
      pyeong_type: '80',
      trade_type: '매매',
      price: 1580000000,
      building_name: '112동',
      floor_info: '고/22',
      is_active: false,
      removed_at: '2026-05-10T00:00:00Z',
    },
    {
      article_number: 'b1',
      complex_id: 'c2',
      pyeong_type: '84A',
      trade_type: '매매',
      price: 1190000000,
      building_name: '101동',
      floor_info: '저/19',
      is_active: true,
      removed_at: null,
    },
  ],
  priceMetrics: [
    {
      complex_id: 'c1',
      pyeong_type: '80',
      trade_type: 'A1',
      window_months: 3,
      metric_date: '2026-05-01',
      actual_median_price: 1470000000,
      chart_data: {
        series: [
          { tradeDate: '2026-04-01', dealPrice: 1400000000 },
          { tradeDate: '2026-05-01', dealPrice: 1480000000 },
        ],
        activeListingRange: { count: 2, minPrice: 1320000000, maxPrice: 1550000000 },
      },
    },
    {
      complex_id: 'c2',
      pyeong_type: '84A',
      trade_type: 'A1',
      window_months: 3,
      metric_date: '2026-05-01',
      actual_median_price: 1220000000,
      chart_data: {
        series: [{ tradeDate: '2026-05-01', dealPrice: 1230000000 }],
        activeListingRange: { count: 1, minPrice: 1190000000, maxPrice: 1190000000 },
      },
    },
  ],
};

const mergedComplexTables: RawRealEstateTables = {
  interestTargets: [
    { complex_id: '103797', pyeong_type: '3', sort_order: 1 },
    { complex_id: '103797', pyeong_type: '1', sort_order: 2 },
    { complex_id: '103797', pyeong_type: '2', sort_order: 3 },
  ],
  complexes: [
    {
      complex_id: '103797',
      complex_name: '래미안크레시티',
      households: 2397,
      use_approved_at: '2014-10-23',
    },
  ],
  pyeongOptions: [
    { complex_id: '103797', pyeong_type: '1', display_pyeong_name: '85A' },
    { complex_id: '103797', pyeong_type: '2', display_pyeong_name: '85B' },
    { complex_id: '103797', pyeong_type: '3', display_pyeong_name: '84C' },
  ],
  articles: [
    {
      article_number: 'active-a',
      article_name: '래미안크레시티',
      complex_id: '103797',
      pyeong_type: '1',
      trade_type: '매매',
      price: 1520000000,
      building_name: '101동',
      floor_info: '중/20',
      is_active: true,
      removed_at: null,
    },
    {
      article_number: 'removed-b',
      article_name: '래미안크레시티',
      complex_id: '103797',
      pyeong_type: '2',
      trade_type: '매매',
      price: 1590000000,
      building_name: '102동',
      floor_info: '저/20',
      is_active: false,
      removed_at: '2026-05-12T00:00:00Z',
    },
    {
      article_number: 'active-c',
      article_name: '래미안크레시티',
      complex_id: '103797',
      pyeong_type: '2',
      trade_type: '매매',
      price: 1650000000,
      building_name: '103동',
      floor_info: '고/25',
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
      metric_date: '2026-05-13',
      chart_data: {
        series: [
          { tradeDate: '2026-02-24', dealPrice: 1600000000 },
          { tradeDate: '2026-03-28', dealPrice: 1620000000 },
        ],
        activeListingRange: { count: 1, minPrice: 1520000000, maxPrice: 1520000000 },
      },
    },
    {
      complex_id: '103797',
      pyeong_type: '2',
      trade_type: 'A1',
      window_months: 3,
      metric_date: '2026-05-13',
      chart_data: {
        series: [
          { tradeDate: '2026-03-28', dealPrice: 1620000000 },
          { tradeDate: '2026-04-14', dealPrice: 1550000000 },
        ],
        activeListingRange: { count: 1, minPrice: 1650000000, maxPrice: 1650000000 },
      },
    },
  ],
};

const rangeOnlyTables: RawRealEstateTables = {
  interestTargets: [{ complex_id: 'range-only', pyeong_type: '84', sort_order: 1 }],
  complexes: [{ complex_id: 'range-only', complex_name: '범위단지', households: 100 }],
  pyeongOptions: [{ complex_id: 'range-only', pyeong_type: '84', display_pyeong_name: '84형' }],
  articles: [],
  priceMetrics: [
    {
      complex_id: 'range-only',
      pyeong_type: '84',
      trade_type: 'A1',
      window_months: 3,
      metric_date: '2026-05-13',
      chart_data: {
        series: [{ tradeDate: '2026-05-01', dealPrice: 1480000000 }],
        activeListingRange: { count: 2, minPrice: 1520000000, maxPrice: 1650000000 },
      },
    },
  ],
};

describe('RealEstateTransactionsPage', () => {
  it('renders the active interest target summary, 90-day chart, and active listings', async () => {
    const { container } = render(<RealEstateTransactionsPage queryTables={async () => tables} />);

    expect(await screen.findByRole('heading', { name: '관심 단지 가격 흐름' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /약수하이츠/ })).toHaveClass('active');
    expect(screen.getByRole('link', { name: '약수하이츠 네이버 부동산 열기' })).toHaveAttribute(
      'href',
      'https://fin.land.naver.com/complexes/c1?tab=article',
    );
    expect(screen.getByRole('button', { name: '약수하이츠 관심 단지 선택' })).toHaveTextContent('활성 매물 2건');
    expect(screen.getByText('최신 실거래')).toBeInTheDocument();
    expect(screen.getByText('최고 실거래')).toBeInTheDocument();
    expect(within(container.querySelector('.real-estate-summary-grid')!).getByText('현재 활성 매물')).toBeInTheDocument();
    expect(container.querySelector('.real-estate-summary-grid')).not.toHaveTextContent('호가 평균');
    expect(within(container.querySelector('.real-estate-summary-grid')!).getAllByText('14.8억')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '약수하이츠 80형 실거래 흐름' })).toBeInTheDocument();
    expect(screen.getByText('최근 90일 · 매매')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '약수하이츠 80형 최근 90일 실거래 그래프' })).toBeInTheDocument();

    const activeListingsRegion = screen.getByRole('region', { name: '현재 활성 매물' });
    expect(within(activeListingsRegion).getByRole('link', { name: '약수하이츠 매물 a1 네이버 부동산 열기' })).toHaveAttribute(
      'href',
      'https://fin.land.naver.com/articles/a1',
    );
    expect(within(activeListingsRegion).getByText('80형 · 116동 · 저/18')).toBeInTheDocument();
    expect(within(activeListingsRegion).queryByText('112동 · 고/22')).not.toBeInTheDocument();
  });

  it('shows a real transaction overlay when hovering a chart point', async () => {
    const user = userEvent.setup();
    render(<RealEstateTransactionsPage queryTables={async () => tables} />);

    await user.hover(await screen.findByRole('button', { name: '2026-05-01 실거래 보기' }));

    const overlay = screen.getByRole('status', { name: '2026-05-01 실거래' });
    expect(overlay).toHaveTextContent('실거래 14.8억');
    expect(overlay).toHaveTextContent('구분 매매');
  });

  it('exposes chart summary text without putting focusable controls inside an image role', async () => {
    render(<RealEstateTransactionsPage queryTables={async () => mergedComplexTables} />);

    const chart = await screen.findByRole('group', { name: '래미안크레시티 84C / 85A / 85B 최근 90일 실거래 그래프' });

    expect(screen.queryByRole('img', { name: /최근 90일 실거래 그래프/ })).not.toBeInTheDocument();
    expect(chart).toHaveAccessibleDescription(
      '최신 실거래 15.5억. 최고 실거래 16.2억. 활성 매물 가격범위 15.2억-16.5억.',
    );
    expect(within(chart).getByRole('button', { name: '2026-04-14 실거래 보기' })).toBeInTheDocument();
  });

  it('renders merged complex chart display from chart_data and active listing range', async () => {
    render(<RealEstateTransactionsPage queryTables={async () => mergedComplexTables} />);

    expect(await screen.findByRole('button', { name: '래미안크레시티 관심 단지 선택' })).toHaveTextContent('84C / 85A / 85B');
    expect(screen.getByRole('heading', { name: '래미안크레시티 84C / 85A / 85B 실거래 흐름' })).toBeInTheDocument();
    expect(screen.getByText('활성 매물 가격범위')).toBeInTheDocument();
    const chart = screen.getByRole('group', { name: '래미안크레시티 84C / 85A / 85B 최근 90일 실거래 그래프' });
    expect(within(chart).getByText('15.2억-16.5억')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1년' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '3년' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '5년' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '전체' })).not.toBeInTheDocument();

    const activeListingsRegion = screen.getByRole('region', { name: '현재 활성 매물' });
    expect(within(activeListingsRegion).getByText('85A · 101동 · 중/20')).toBeInTheDocument();
    expect(within(activeListingsRegion).getByText('85B · 103동 · 고/25')).toBeInTheDocument();
    expect(within(activeListingsRegion).queryByText('removed-b')).not.toBeInTheDocument();
    expect(within(activeListingsRegion).queryByText('102동 · 저/20')).not.toBeInTheDocument();
  });

  it('updates the active card, summary, chart, and articles when selecting another target', async () => {
    const user = userEvent.setup();
    const { container } = render(<RealEstateTransactionsPage queryTables={async () => tables} />);

    await user.click(await screen.findByRole('button', { name: /신당삼성/ }));

    expect(screen.getByRole('button', { name: /신당삼성/ })).toHaveClass('active');
    expect(within(container.querySelector('.real-estate-summary-grid')!).getAllByText('12.3억')).toHaveLength(2);
    expect(screen.getByRole('group', { name: '신당삼성 84A형 최근 90일 실거래 그래프' })).toBeInTheDocument();
    expect(screen.getByText('매물번호 b1')).toBeInTheDocument();
  });

  it('uses current active article rows for visible listing counts even when range data exists', async () => {
    const { container } = render(<RealEstateTransactionsPage queryTables={async () => rangeOnlyTables} />);

    expect(await screen.findByRole('button', { name: '범위단지 관심 단지 선택' })).toHaveTextContent('활성 매물 0건');
    expect(within(container.querySelector('.real-estate-summary-grid')!).getByText('0건')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '현재 활성 매물' })).toHaveTextContent('현재 활성 매물 없음');
    expect(screen.getByRole('group', { name: '범위단지 84형 최근 90일 실거래 그래프' })).toHaveAccessibleDescription(
      '최신 실거래 14.8억. 최고 실거래 14.8억. 활성 매물 가격범위 15.2억-16.5억.',
    );
  });

  it('keeps the graph area when there are no recent real transactions or active listings', async () => {
    render(
      <RealEstateTransactionsPage
        queryTables={async () => ({
          interestTargets: [{ complex_id: 'empty', pyeong_type: '84', sort_order: 1 }],
          complexes: [{ complex_id: 'empty', complex_name: '빈단지' }],
          pyeongOptions: [{ complex_id: 'empty', pyeong_type: '84', display_pyeong_name: '84형' }],
          articles: [],
          priceMetrics: [],
        })}
      />,
    );

    expect(await screen.findByRole('group', { name: '빈단지 84형 최근 90일 실거래 그래프' })).toBeInTheDocument();
    expect(screen.getByText('최근 90일 실거래 없음')).toBeInTheDocument();
    expect(screen.getAllByText('현재 활성 매물 없음')).not.toHaveLength(0);
    expect(screen.queryByText('활성 매물 가격범위')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no interest targets', async () => {
    render(
      <RealEstateTransactionsPage
        queryTables={async () => ({
          interestTargets: [],
          complexes: [],
          pyeongOptions: [],
          articles: [],
          priceMetrics: [],
        })}
      />,
    );

    expect(await screen.findByText('표시할 관심 단지가 없습니다.')).toBeInTheDocument();
  });

  it('shows an error panel when loading tables fails', async () => {
    render(<RealEstateTransactionsPage queryTables={async () => Promise.reject(new Error('테이블 로드 실패'))} />);

    expect(await screen.findByText('테이블 로드 실패')).toHaveClass('state-panel', 'error');
  });
});
