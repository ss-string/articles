import {
  buildMacroRegimeDecisions,
  formatDecisionDate,
  formatTrendLabel,
  normalizeMacroRegimeRow,
} from './model';

const usRow = {
  id: '2026-05-04-US',
  run_date: '2026-05-04',
  market: 'US',
  regime: '리플레이션(reflation)',
  summary:
    '미국은 성장축이 중립, 물가축이 elevated로 판정되어 성장 x 물가 4분면 계약상 리플레이션(reflation)에 해당한다.',
  axis_assessments: {
    growth: {
      axis: 'neutral',
      rationale: '성장 지표는 약한 음수이나 contracting으로 단정하기에는 신호 강도가 부족하다.',
      confidence: 0.69,
    },
    inflation: {
      axis: 'elevated',
      rationale: '헤드라인 CPI의 레벨 부담과 상승 추세를 반영한다.',
      confidence: 0.71,
    },
    monetary: {
      axis: 'neutral',
      rationale: '연방기금금리 부담과 수익률곡선 개선이 상충된다.',
      confidence: 0.66,
    },
    liquidity: {
      axis: 'ample',
      rationale: 'M2와 HY spread가 유동성을 지지한다.',
      confidence: 0.78,
    },
  },
  key_indicators: [
    {
      label: '미국 CPI (YoY)',
      value: 3.32,
      unit: '%',
      source: 'FRED',
      trend_3m: 'up',
      interpretation: 'level_score -1과 상승 추세가 elevated 판정의 핵심',
    },
    {
      label: '미국 HY 크레딧 스프레드',
      value: 2.83,
      unit: '%',
      source: 'FRED',
      trend_3m: 'down',
      interpretation: '스프레드 하락은 유동성 ample 판정을 지지',
    },
  ],
  asset_implications: [
    '성장 중립과 물가 elevated 조합은 리플레이션(reflation)으로, 명목 성장 민감 자산에는 지지적일 수 있다.',
  ],
  risk_factors: ['성장 지표 3개가 모두 약한 음수 signal_score라 성장축이 약화될 위험이 있다.'],
  content_md:
    '# 2026-05-04 US 매크로 레짐: 리플레이션(reflation)\n\n## 요약 (TL;DR)\n미국은 성장축이 neutral, 물가축이 elevated다.',
  updated_at: '2026-05-04T07:53:42.522269+00:00',
};

describe('macro regime model', () => {
  it('normalizes a macro regime row for card and popup display', () => {
    const decision = normalizeMacroRegimeRow(usRow);

    expect(decision).toMatchObject({
      id: '2026-05-04-US',
      market: 'US',
      dateLabel: '2026.05.04',
      regime: '리플레이션(reflation)',
      axisSummary: '성장축은 neutral, 물가축은 elevated로 판정됐습니다.',
      summary: usRow.summary,
      assetImplications: usRow.asset_implications,
      riskFactors: usRow.risk_factors,
      contentMarkdown: usRow.content_md,
    });
    expect(decision?.axisAssessments.map((axis) => axis.label)).toEqual([
      '성장',
      '물가',
      '통화',
      '유동성',
    ]);
    expect(decision?.axisAssessments[0]).toMatchObject({
      key: 'growth',
      judgment: 'neutral',
      confidenceLabel: '컨피던스 0.69',
    });
    expect(decision?.keyIndicators[0]).toMatchObject({
      label: '미국 CPI (YoY)',
      valueLabel: '3.32%',
      trendLabel: '↑ 상승',
      trendTone: 'up',
    });
  });

  it('returns null when required card fields are missing or invalid', () => {
    expect(normalizeMacroRegimeRow({ market: 'US', regime: '리플레이션(reflation)' })).toBeNull();
    expect(normalizeMacroRegimeRow({ run_date: '2026-05-04', regime: '리플레이션(reflation)' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'JP', run_date: '2026-05-04', regime: 'x' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: '2026-05-04' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: 'not-a-date', regime: 'x' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: 20260504, regime: 'x' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: '2026-05-04-not-iso', regime: 'x' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: '2026-05-04Tbad', regime: 'x' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: '2026-02-30', regime: 'x' })).toBeNull();
    expect(normalizeMacroRegimeRow({ market: 'US', run_date: '2026-05-04', regime: 123 })).toBeNull();
    expect(
      normalizeMacroRegimeRow({
        market: 'US',
        run_date: '2026-05-04T07:53:42.522269+00:00',
        regime: 'x',
      })?.dateLabel,
    ).toBe('2026.05.04');
  });

  it('formats dates and trend labels', () => {
    expect(formatDecisionDate('2026-05-04')).toBe('2026.05.04');
    expect(formatDecisionDate('2026-05-04T07:53:42.522269+00:00')).toBe('2026.05.04');
    expect(formatDecisionDate('2026-05-04-not-iso')).toBe('-');
    expect(formatDecisionDate(null)).toBe('-');
    expect(formatTrendLabel('up')).toEqual({ label: '↑ 상승', tone: 'up' });
    expect(formatTrendLabel('down')).toEqual({ label: '↓ 하락', tone: 'down' });
    expect(formatTrendLabel('flat')).toEqual({ label: '→ 보합', tone: 'flat' });
    expect(formatTrendLabel('unknown')).toEqual({ label: '-', tone: 'neutral' });
  });

  it('builds KR and US decisions in fixed display order', () => {
    const decisions = buildMacroRegimeDecisions([
      { ...usRow, market: 'US' },
      { ...usRow, id: '2026-05-04-KR', market: 'KR', regime: '골디락스(goldilocks)' },
    ]);

    expect(decisions.map((decision) => decision.market)).toEqual(['KR', 'US']);
  });
});
