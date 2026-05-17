import { describe, expect, it } from 'vitest';
import {
  buildAiInvestmentReportCatalog,
  formatKoreanWon,
  parseMarkdownBlocks,
  selectReportHistory,
} from './model';

function createSamsungRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'latest',
    market: 'KR',
    stock_code: '005930',
    stock_name: '삼성전자',
    issue_date: '2026-05-17',
    recommendation: '매수',
    current_price: 273500,
    total_score: 69,
    momentum_score: 78,
    technical_score: 74,
    valuation_score: 56,
    content_md: '## 투자 의견\n\n**매수** 관점입니다.\n\n### 핵심\n\nAI 수요가 확인됩니다.',
    report_payload: {
      actionPlan: {
        hold: '보유자는 유지',
        entry: '분할 진입',
        exitOrReview: '리스크 재점검',
      },
      bullFindings: ['목표주가 상향'],
      bearFindings: ['파운드리 적자'],
      riskChecklist: ['환율 변동'],
      investmentThesis: 'AI 반도체 수요와 목표주가 상향이 핵심입니다.',
    },
    agent_outputs: {
      momentum: {
        summary: '모멘텀은 우호적입니다.',
        score: 78,
        stance: 'bull',
        findings: [
          { type: 'bull', evidence: '목표주가 상승', confidence: 'high', metric: 'target_price' },
          { type: 'bull', evidence: '상승여력 23.77%', confidence: 'high', metric: 'upside' },
          { type: 'bull', evidence: 'AI 제품 수요', confidence: 'medium', metric: 'ai_demand' },
          { type: 'bull', evidence: '골디락스 레짐', confidence: 'medium', metric: 'macro' },
          { type: 'bear', evidence: '파운드리 단기 적자', confidence: 'medium', metric: 'foundry' },
          { type: 'bear', evidence: '3개월 추세 down', confidence: 'low', metric: 'trend' },
        ],
        risks: ['원문 검증 제한', '파운드리 적자', '거시경제 불확실성', 'CPI 상승', 'DX 수요 부진'],
        dataQuality: {
          limitations: ['입력 데이터 제한', '가격 시계열 없음', '원문 검증 제한', '동종업계 비교 불가', '시장 전체 배경'],
        },
      },
    },
    created_at: '2026-05-17T08:00:00+00:00',
    updated_at: '2026-05-17T09:26:10.444135+00:00',
    ...overrides,
  };
}

describe('ai investment report model', () => {
  it('keeps only the latest representative report per stock code and sorts reports by updated time', () => {
    const older = createSamsungRow({
      id: 'older',
      recommendation: '중립',
      updated_at: '2026-05-16T09:26:10.444135+00:00',
    });
    const latest = createSamsungRow();
    const other = createSamsungRow({
      id: 'other',
      stock_code: '000660',
      stock_name: 'SK하이닉스',
      updated_at: '2026-05-18T09:26:10.444135+00:00',
    });

    const catalog = buildAiInvestmentReportCatalog([older, latest, other]);

    expect(catalog.representativeReports.map((report) => report.id)).toEqual(['other', 'latest']);
    expect(catalog.reports.map((report) => report.id)).toEqual(['other', 'latest', 'older']);
    expect(selectReportHistory(catalog.reports, '005930').map((report) => report.id)).toEqual(['latest', 'older']);
  });

  it('normalizes row fields without dropping payload and agent details', () => {
    const catalog = buildAiInvestmentReportCatalog([createSamsungRow()]);
    const report = catalog.reports[0];

    expect(report.currentPrice).toBe(273500);
    expect(report.currentPriceLabel).toBe('273,500원');
    expect(report.actionPlan).toEqual({
      hold: '보유자는 유지',
      entry: '분할 진입',
      exitOrReview: '리스크 재점검',
    });
    expect(report.bullFindings).toEqual(['목표주가 상향']);
    expect(report.bearFindings).toEqual(['파운드리 적자']);
    expect(report.riskChecklist).toEqual(['환율 변동']);
    expect(report.investmentThesis).toBe('AI 반도체 수요와 목표주가 상향이 핵심입니다.');

    const momentum = report.agents.momentum;
    expect(momentum?.findings).toHaveLength(6);
    expect(momentum?.risks).toHaveLength(5);
    expect(momentum?.limitations).toHaveLength(5);
    expect(momentum?.findings[0]).toEqual({
      type: 'bull',
      evidence: '목표주가 상승',
      confidence: 'high',
      metric: 'target_price',
    });
    expect(momentum?.findings.map(({ type, evidence, confidence }) => ({ type, evidence, confidence }))[0]).toEqual({
      type: 'bull',
      evidence: '목표주가 상승',
      confidence: 'high',
    });
  });

  it('uses content_md before report_payload contentMd and falls back to an empty-body message', () => {
    expect(buildAiInvestmentReportCatalog([createSamsungRow()]).reports[0].contentMd).toContain('## 투자 의견');
    expect(
      buildAiInvestmentReportCatalog([
        createSamsungRow({ content_md: '', report_payload: { contentMd: 'payload body' } }),
      ]).reports[0].contentMd,
    ).toBe('payload body');
    expect(
      buildAiInvestmentReportCatalog([
        createSamsungRow({ content_md: '', report_payload: {} }),
      ]).reports[0].contentMd,
    ).toBe('본문이 없습니다.');
  });

  it('formats Korean won labels', () => {
    expect(formatKoreanWon(273500)).toBe('273,500원');
    expect(formatKoreanWon(null)).toBe('현재가 없음');
    expect(formatKoreanWon('')).toBe('현재가 없음');
    expect(buildAiInvestmentReportCatalog([createSamsungRow({ current_price: '', total_score: '' })]).reports[0]).toMatchObject({
      currentPrice: null,
      currentPriceLabel: '현재가 없음',
      totalScore: null,
    });
  });

  it('parses markdown headings, paragraphs, and bold text', () => {
    expect(parseMarkdownBlocks('## 투자 의견\n\n**매수** 관점입니다.\n\n### 핵심')).toEqual([
      { type: 'heading', level: 2, text: '투자 의견' },
      {
        type: 'paragraph',
        parts: [
          { text: '매수', strong: true },
          { text: ' 관점입니다.', strong: false },
        ],
      },
      { type: 'heading', level: 3, text: '핵심' },
    ]);
  });
});
