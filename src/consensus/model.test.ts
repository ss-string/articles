import {
  buildRankingRowsWithReports,
  buildRankingRows,
  formatPercent,
  formatWon,
  normalizeConsensusRow,
} from './model';

describe('consensus model', () => {
  it('normalizes gicode from fnguide_code and merges the matching AI summary report', () => {
    const rows = buildRankingRowsWithReports(
      [
        {
          stock_code: '128940',
          stock_name: '한미약품',
          current_price_value: 445000,
          fnguide_code: 'A128940',
          report_count: 11,
          consensus_trend_values: {
            six_month_ago: 477500,
            three_month_ago: 538333,
            month_ago: 620000,
            now: 657857,
          },
          target_price_value: 657857,
        },
      ],
      [
        {
          gicode: 'A128940',
          co_nm: '한미약품',
          updated_at: '2026-05-04T08:24:38.946123+00:00',
          analysis: {
            'tl;dr': '한미약품 컨센서스는 우호적이다.',
            keyKeywords: ['R&D 모멘텀', 'MASH'],
            risks: ['1Q26 실적이 시장 기대치를 하회할 가능성'],
            targetPriceRange: { min: 560000, median: 660000, max: 720000 },
            securitiesFirmCount: 10,
            securitiesFirms: [
              {
                name: '메리츠증권',
                reportCount: 1,
                targetPrices: [620000],
                recommendations: ['BUY'],
              },
            ],
          },
        },
      ],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'A128940',
      code: '128940',
      gicode: 'A128940',
      reportCount: 11,
      summaryReport: {
        gicode: 'A128940',
        companyName: '한미약품',
        updatedAt: '2026-05-04T08:24:38.946123+00:00',
        tlDr: '한미약품 컨센서스는 우호적이다.',
        keyKeywords: ['R&D 모멘텀', 'MASH'],
        risks: ['1Q26 실적이 시장 기대치를 하회할 가능성'],
        targetPriceRange: { min: 560000, median: 660000, max: 720000 },
        securitiesFirmCount: 10,
        securitiesFirms: [
          {
            name: '메리츠증권',
            reportCount: 1,
            targetPrices: [620000],
            recommendations: ['BUY'],
          },
        ],
      },
    });
  });

  it('keeps rows without matching AI reports and adds the current price checkpoint', () => {
    const rows = buildRankingRowsWithReports(
      [
        {
          stock_name: '리포트없음',
          current_price: 10000,
          target_price: 12000,
          consensus_1m: 11000,
        },
      ],
      [],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.gicode).toBeNull();
    expect(rows[0]?.summaryReport).toBeNull();
    expect(rows[0]?.checkpoints.map((checkpoint) => checkpoint.label)).toEqual([
      '현재 가격',
      '지난 6개월',
      '지난 3개월',
      '지난 1개월',
      '현재 컨센서스',
    ]);
    expect(rows[0]?.checkpoints[0]).toEqual({
      label: '현재 가격',
      price: 10000,
      changePercent: null,
    });
  });

  it('accepts camelCase reportCount and uses the latest AI report for each gicode', () => {
    const rows = buildRankingRowsWithReports(
      [
        {
          stock_name: '최신리포트',
          stock_code: '123456',
          fnguide_code: 'A123456',
          current_price: 10000,
          target_price: 12000,
          reportCount: 7,
        },
      ],
      [
        {
          gicode: 'A123456',
          updated_at: '2026-05-04T08:24:38.946123+00:00',
          analysis: { 'tl;dr': '최신 리포트' },
        },
        {
          gicode: 'A123456',
          updated_at: '2026-05-03T08:24:38.946123+00:00',
          analysis: { 'tl;dr': '이전 리포트' },
        },
      ],
    );

    expect(rows[0]?.reportCount).toBe(7);
    expect(rows[0]?.summaryReport?.tlDr).toBe('최신 리포트');
    expect(rows[0]?.summaryReport?.updatedAt).toBe('2026-05-04T08:24:38.946123+00:00');
  });

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
    expect(row?.gapPercent).toBeCloseTo(((100200 - 72400) / 72400) * 100);
    expect(row?.oneMonthConsensusChangePercent).toBeCloseTo(((100200 - 93800) / 93800) * 100);
    expect(row?.checkpoints).toEqual([
      { label: '현재 가격', price: 72400, changePercent: null },
      { label: '지난 6개월', price: 91300, changePercent: expect.any(Number) },
      { label: '지난 3개월', price: 96300, changePercent: expect.any(Number) },
      { label: '지난 1개월', price: 93800, changePercent: expect.any(Number) },
      { label: '현재 컨센서스', price: 100200, changePercent: 0 },
    ]);
  });

  it('normalizes the krx_fnguide_consensus production schema from n8n', () => {
    const row = normalizeConsensusRow({
      stock_code: '035420',
      stock_name: 'NAVER',
      current_price_value: 209000,
      consensus_trend_values: {
        six_month_ago: 260000,
        three_month_ago: 280000,
        month_ago: 300000,
        now: 313350,
      },
      target_price_value: 313350,
      target_price_gap_rate: 49.93,
    });

    expect(row).toMatchObject({
      id: '035420',
      name: 'NAVER',
      code: '035420',
      currentPrice: 209000,
      fairPrice: 313350,
      gapAmount: 104350,
      oneMonthConsensusPrice: 300000,
      threeMonthConsensusPrice: 280000,
      sixMonthConsensusPrice: 260000,
    });
    expect(row?.gapPercent).toBeCloseTo(((313350 - 209000) / 209000) * 100);
    expect(row?.oneMonthConsensusChangePercent).toBeCloseTo(((313350 - 300000) / 300000) * 100);
    expect(row?.checkpoints).toEqual([
      { label: '현재 가격', price: 209000, changePercent: null },
      { label: '지난 6개월', price: 260000, changePercent: expect.any(Number) },
      { label: '지난 3개월', price: 280000, changePercent: expect.any(Number) },
      { label: '지난 1개월', price: 300000, changePercent: expect.any(Number) },
      { label: '현재 컨센서스', price: 313350, changePercent: 0 },
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

  it('parses comma-formatted and percent-suffixed numeric strings', () => {
    const row = normalizeConsensusRow({
      stock_name: '삼성전자',
      current_price: '72,400',
      target_price: '100,200',
      consensus_1m: '93,800%',
    });

    expect(row).toMatchObject({
      currentPrice: 72400,
      fairPrice: 100200,
      oneMonthConsensusPrice: 93800,
    });
    expect(row?.gapPercent).toBeCloseTo(((100200 - 72400) / 72400) * 100);
    expect(row?.oneMonthConsensusChangePercent).toBeCloseTo(((100200 - 93800) / 93800) * 100);
  });

  it('excludes rows when required prices are invalid numeric strings or blank text', () => {
    const rows = buildRankingRows([
      { stock_name: '정상', current_price: '10,000', target_price: '12,000' },
      { stock_name: '문자현재가', current_price: 'abc', target_price: '12,000' },
      { stock_name: '공백현재가', current_price: '   ', target_price: '12,000' },
      { stock_name: '빈적정가', current_price: '10,000', target_price: '' },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['정상']);
  });

  it('keeps missing checkpoint prices as null', () => {
    const row = normalizeConsensusRow({
      stock_name: '체크포인트없음',
      current_price: 10000,
      target_price: 12000,
    });

    expect(row?.oneMonthConsensusPrice).toBeNull();
    expect(row?.threeMonthConsensusPrice).toBeNull();
    expect(row?.sixMonthConsensusPrice).toBeNull();
    expect(row?.checkpoints).toEqual([
      { label: '현재 가격', price: 10000, changePercent: null },
      { label: '지난 6개월', price: null, changePercent: null },
      { label: '지난 3개월', price: null, changePercent: null },
      { label: '지난 1개월', price: null, changePercent: null },
      { label: '현재 컨센서스', price: 12000, changePercent: 0 },
    ]);
  });

  it('returns null checkpoint change percentages for zero or negative denominators', () => {
    const row = normalizeConsensusRow({
      stock_name: '분모검증',
      current_price: 10000,
      target_price: 12000,
      consensus_1m: 0,
      consensus_3m: -1000,
      consensus_6m: 11000,
    });

    expect(row?.oneMonthConsensusChangePercent).toBeNull();
    expect(row?.checkpoints).toEqual([
      { label: '현재 가격', price: 10000, changePercent: null },
      { label: '지난 6개월', price: 11000, changePercent: expect.any(Number) },
      { label: '지난 3개월', price: -1000, changePercent: null },
      { label: '지난 1개월', price: 0, changePercent: null },
      { label: '현재 컨센서스', price: 12000, changePercent: 0 },
    ]);
    expect(row?.checkpoints[1]?.changePercent).toBeCloseTo(((12000 - 11000) / 11000) * 100);
  });

  it('formats prices and percents for Korean financial display', () => {
    expect(formatWon(100200)).toBe('100,200원');
    expect(formatPercent(6.823)).toBe('+6.8%');
    expect(formatPercent(-2.12)).toBe('-2.1%');
    expect(formatPercent(null)).toBe('-');
  });
});
