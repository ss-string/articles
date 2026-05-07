import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryRealEstateTables } from './api';

const order = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from })),
}));

describe('real estate api', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    from.mockReset();
    select.mockReset();
    order.mockReset();
    eq.mockReset();

    order.mockResolvedValue({ data: [{ complex_id: 'c1', pyeong_type: '80', display_order: 1 }], error: null });
    eq.mockReturnValue({ order });
    select.mockImplementation(() => ({ data: [], error: null, eq }));
    from.mockReturnValue({ select });
  });

  it('queries active real estate interest targets ordered by display_order', async () => {
    await queryRealEstateTables();

    expect(from).toHaveBeenCalledWith('real_estate_interest_targets');
    expect(eq).toHaveBeenCalledWith('is_active', true);
    expect(order).toHaveBeenCalledWith('display_order', { ascending: true });
    expect(order).not.toHaveBeenCalledWith('sort_order', expect.anything());
  });
});
