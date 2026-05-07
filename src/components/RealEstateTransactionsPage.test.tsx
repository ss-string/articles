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
    },
    {
      article_number: 'b1',
      complex_id: 'c2',
      pyeong_type: '84A',
      trade_type: '매매',
      price: 1190000000,
      building_name: '101동',
      floor_info: '저/19',
    },
  ],
  priceMetrics: [
    {
      complex_id: 'c1',
      pyeong_type: '80',
      metric_date: '2026-04-01',
      actual_average_price: 1400000000,
      asking_average_price: 1450000000,
      actual_median_price: 1410000000,
    },
    {
      complex_id: 'c1',
      pyeong_type: '80',
      metric_date: '2026-05-01',
      actual_average_price: 1480000000,
      asking_average_price: 1460000000,
      actual_median_price: 1470000000,
    },
    {
      complex_id: 'c2',
      pyeong_type: '84A',
      metric_date: '2026-05-01',
      actual_average_price: 1230000000,
      asking_average_price: 1210000000,
      actual_median_price: 1220000000,
    },
  ],
};

describe('RealEstateTransactionsPage', () => {
  it('renders the active interest target summary, chart, and below-median articles', async () => {
    render(<RealEstateTransactionsPage queryTables={async () => tables} />);

    expect(await screen.findByRole('heading', { name: '관심 단지 가격 흐름' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /약수하이츠/ })).toHaveClass('active');
    expect(screen.getByRole('link', { name: '약수하이츠 네이버 부동산 열기' })).toHaveAttribute(
      'href',
      'https://fin.land.naver.com/complexes/c1?tab=article',
    );
    expect(screen.getByRole('button', { name: '약수하이츠 관심 단지 선택' })).toHaveTextContent('전체 매물 2건');
    expect(screen.getByText('실거래 평균')).toBeInTheDocument();
    expect(screen.getByText('호가 평균')).toBeInTheDocument();
    expect(screen.getByText('중위값')).toBeInTheDocument();
    expect(screen.getByText('현재 매물')).toBeInTheDocument();
    expect(screen.getByText('14억 8,000만')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '약수하이츠 80형 가격 비교 그래프' })).toBeInTheDocument();

    const belowMedianRegion = screen.getByRole('region', { name: '중위값 이하 매물' });
    expect(within(belowMedianRegion).getByRole('link', { name: '약수하이츠 매물 a1 네이버 부동산 열기' })).toHaveAttribute(
      'href',
      'https://fin.land.naver.com/articles/a1',
    );
    expect(within(belowMedianRegion).getByText('116동 · 저/18')).toBeInTheDocument();
    expect(within(belowMedianRegion).getByText('-10.2%')).toHaveClass('below-average');
    expect(within(belowMedianRegion).queryByText('매물번호 a2')).not.toBeInTheDocument();
  });

  it('toggles between below-median and all articles', async () => {
    const user = userEvent.setup();
    render(<RealEstateTransactionsPage queryTables={async () => tables} />);

    const belowMedianRegion = await screen.findByRole('region', { name: '중위값 이하 매물' });
    expect(within(belowMedianRegion).queryByText('110동 · 중/20')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전체 매물' }));

    const allArticlesRegion = screen.getByRole('region', { name: '전체 매물' });
    expect(within(allArticlesRegion).getByText('116동 · 저/18')).toBeInTheDocument();
    expect(within(allArticlesRegion).getByText('110동 · 중/20')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '중위값 이하' }));

    expect(screen.getByRole('region', { name: '중위값 이하 매물' })).toBeInTheDocument();
    expect(screen.queryByText('110동 · 중/20')).not.toBeInTheDocument();
  });

  it('updates the active card, summary, chart, and articles when selecting another target', async () => {
    const user = userEvent.setup();
    render(<RealEstateTransactionsPage queryTables={async () => tables} />);

    await user.click(await screen.findByRole('button', { name: /신당삼성/ }));

    expect(screen.getByRole('button', { name: /신당삼성/ })).toHaveClass('active');
    expect(screen.getByText('12억 3,000만')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '신당삼성 84A형 가격 비교 그래프' })).toBeInTheDocument();
    expect(screen.getByText('매물번호 b1')).toBeInTheDocument();
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
