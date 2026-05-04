import {
  buildRankingRows,
  formatPercent,
  formatWon,
  normalizeConsensusRow,
} from './model';

describe('consensus model', () => {
  it('normalizes raw Supabase rows and calculates gap metrics', () => {
    const row = normalizeConsensusRow({
      stock_name: '삼성전자',
      stock_code: '005930',
      current_price: '72400',
      target_price: '100200',
      consensus_1m: '93800',
      consensus_3m: '96300',
      consensus_6m: '91300',
    });

    expect(row).toMatchObject({
      name: '삼성전자',
      code: '005930',
      currentPrice: 72400,
      fairPrice: 100200,
      gapAmount: 27800,
    });
    expect(row?.gapPercent).toBeCloseTo(38.397, 3);
    expect(row?.oneMonthConsensusChangePercent).toBeCloseTo(6.823, 3);
    expect(row?.checkpoints).toEqual([
      { label: '지난 6개월', price: 91300, changePercent: expect.any(Number) },
      { label: '지난 3개월', price: 96300, changePercent: expect.any(Number) },
      { label: '지난 1개월', price: 93800, changePercent: expect.any(Number) },
      { label: '현재 컨센서스', price: 100200, changePercent: 0 },
    ]);
  });

  it('sorts ranking rows by largest fair price gap first', () => {
    const rows = buildRankingRows([
      { stock_name: '낮은괴리', current_price: 10000, target_price: 11000, consensus_1m: 10000 },
      { stock_name: '높은괴리', current_price: 10000, target_price: 15000, consensus_1m: 12000 },
      { stock_name: '중간괴리', current_price: 10000, target_price: 13000, consensus_1m: 12500 },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['높은괴리', '중간괴리', '낮은괴리']);
  });

  it('excludes rows with invalid denominators or missing required prices', () => {
    const rows = buildRankingRows([
      { stock_name: '정상', current_price: 10000, target_price: 12000, consensus_1m: 11000 },
      { stock_name: '현재가없음', current_price: 0, target_price: 12000, consensus_1m: 11000 },
      { stock_name: '적정가없음', current_price: 10000, target_price: null, consensus_1m: 11000 },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['정상']);
  });

  it('formats prices and percents for Korean financial display', () => {
    expect(formatWon(100200)).toBe('100,200원');
    expect(formatPercent(6.823)).toBe('+6.8%');
    expect(formatPercent(-2.12)).toBe('-2.1%');
    expect(formatPercent(null)).toBe('-');
  });
});
