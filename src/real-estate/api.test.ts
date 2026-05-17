import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryRealEstateTables } from './api';

const from = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from })),
}));

function createQueryBuilder(data: unknown[] = []) {
  const result = { data, error: null };
  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    order: vi.fn(() => queryBuilder),
    then: vi.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject)),
  };

  return queryBuilder;
}

describe('real estate api', () => {
  let queryBuilders: Record<string, ReturnType<typeof createQueryBuilder>>;

  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    from.mockReset();

    queryBuilders = {
      real_estate_interest_targets: createQueryBuilder([
        { complex_id: 'c1', pyeong_type: '80', display_order: 1 },
      ]),
      real_estate_complexes: createQueryBuilder(),
      real_estate_complex_pyeong_options: createQueryBuilder(),
      real_estate_articles: createQueryBuilder(),
      real_estate_pyeong_price_metrics: createQueryBuilder(),
    };

    from.mockImplementation((tableName: string) => queryBuilders[tableName]);
  });

  it('queries active real estate interest targets ordered by display_order', async () => {
    await queryRealEstateTables();

    expect(from).toHaveBeenCalledWith('real_estate_interest_targets');
    expect(queryBuilders.real_estate_interest_targets.eq).toHaveBeenCalledWith('is_active', true);
    expect(queryBuilders.real_estate_interest_targets.order).toHaveBeenCalledWith('display_order', { ascending: true });
    expect(queryBuilders.real_estate_interest_targets.order).not.toHaveBeenCalledWith('sort_order', expect.anything());
  });

  it('queries active real estate articles ordered by deal price', async () => {
    await queryRealEstateTables();

    expect(from).toHaveBeenCalledWith('real_estate_articles');
    expect(queryBuilders.real_estate_articles.eq).toHaveBeenCalledWith('is_active', true);
    expect(queryBuilders.real_estate_articles.order).toHaveBeenCalledWith('deal_price', { ascending: true });
  });

  it('queries 90-day sale pyeong price metrics', async () => {
    await queryRealEstateTables();

    expect(from).toHaveBeenCalledWith('real_estate_pyeong_price_metrics');
    expect(queryBuilders.real_estate_pyeong_price_metrics.eq).toHaveBeenCalledWith('trade_type', 'A1');
    expect(queryBuilders.real_estate_pyeong_price_metrics.eq).toHaveBeenCalledWith('window_months', 3);
    expect(queryBuilders.real_estate_pyeong_price_metrics.order).not.toHaveBeenCalled();
  });
});
