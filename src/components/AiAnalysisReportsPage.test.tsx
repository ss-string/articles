import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RawAiInvestmentReportRow } from '../ai-reports/model';
import { AiAnalysisReportsPage } from './AiAnalysisReportsPage';

function createSamsungRow(overrides: RawAiInvestmentReportRow = {}): RawAiInvestmentReportRow {
  return {
    id: 'samsung-latest',
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

const latestSamsungRow = createSamsungRow();
const olderSamsungRow = createSamsungRow({
  id: 'samsung-older',
  issue_date: '2026-05-10',
  current_price: 250000,
  total_score: 61,
  momentum_score: 62,
  technical_score: 58,
  valuation_score: 64,
  content_md: '## 이전 투자 의견\n\n**보유** 관점입니다.\n\n### 이전 핵심\n\n이전 수요 점검이 필요합니다.',
  report_payload: {
    actionPlan: {
      hold: '기존 보유 유지',
      entry: '추가 진입 보류',
      exitOrReview: '실적 발표 후 재점검',
    },
    bullFindings: ['메모리 회복'],
    bearFindings: ['수요 둔화'],
    riskChecklist: ['가격 변동'],
    investmentThesis: '이전 리포트 투자 가설입니다.',
  },
  agent_outputs: {
    momentum: {
      summary: '이전 모멘텀은 중립입니다.',
      score: 62,
      stance: 'neutral',
      findings: [{ type: 'bear', evidence: '이전 수요 둔화', confidence: 'medium', metric: 'legacy_metric' }],
      risks: ['이전 리스크'],
      dataQuality: {
        limitations: ['이전 한계'],
      },
    },
  },
  created_at: '2026-05-10T08:00:00+00:00',
  updated_at: '2026-05-10T09:00:00+00:00',
});
const lgChemRow = createSamsungRow({
  id: 'lg-chem-latest',
  stock_code: '051910',
  stock_name: 'LG화학',
  recommendation: '중립',
  current_price: 410000,
  total_score: 55,
  report_payload: {
    actionPlan: { hold: '관망', entry: '대기', exitOrReview: '업황 점검' },
    bullFindings: ['배터리 소재'],
    bearFindings: ['스프레드 둔화'],
    riskChecklist: ['원재료 가격'],
    investmentThesis: '화학 업황 회복을 기다립니다.',
  },
  created_at: '2026-05-16T08:00:00+00:00',
  updated_at: '2026-05-16T09:00:00+00:00',
});

function createRecommendationRow(index: number, totalScore: number, updatedDay: number) {
  return createSamsungRow({
    id: `recommendation-${index}`,
    stock_code: String(100000 + index),
    stock_name: `추천종목${index}`,
    total_score: totalScore,
    updated_at: `2026-05-${String(updatedDay).padStart(2, '0')}T09:00:00+00:00`,
  });
}

describe('AiAnalysisReportsPage', () => {
  it('renders the loading state while reports are queried', () => {
    render(<AiAnalysisReportsPage queryRows={() => new Promise(() => undefined)} />);

    expect(screen.getByText('AI 분석 리포트를 불러오는 중입니다.')).toBeInTheDocument();
  });

  it('renders an empty state when no reports are available', async () => {
    render(<AiAnalysisReportsPage queryRows={async () => []} />);

    expect(await screen.findByText('표시할 AI 분석 리포트가 없습니다.')).toBeInTheDocument();
  });

  it('starts with an empty search input, no selected stock, and top total-score recommendations', async () => {
    const rows = [
      createRecommendationRow(1, 41, 17),
      createRecommendationRow(2, 92, 10),
      createRecommendationRow(3, 88, 11),
      createRecommendationRow(4, 79, 12),
      createRecommendationRow(5, 78, 13),
      createRecommendationRow(6, 77, 14),
      createRecommendationRow(7, 76, 15),
      createRecommendationRow(8, 75, 16),
      createRecommendationRow(9, 74, 17),
      createRecommendationRow(10, 73, 18),
      createRecommendationRow(11, 72, 19),
      createRecommendationRow(12, 71, 20),
    ];

    render(<AiAnalysisReportsPage queryRows={async () => rows} />);

    const search = await screen.findByRole('search', { name: 'AI 분석 리포트 검색' });
    const searchInput = within(search).getByRole('searchbox', { name: '종목명 또는 종목코드 검색' });

    expect(searchInput).toHaveValue('');
    expect(within(search).getByText('totalScore 상위 추천')).toBeInTheDocument();
    expect(within(search).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '검색',
      '추천종목2 100002 · 1건',
      '추천종목3 100003 · 1건',
      '추천종목4 100004 · 1건',
      '추천종목5 100005 · 1건',
      '추천종목6 100006 · 1건',
      '추천종목7 100007 · 1건',
      '추천종목8 100008 · 1건',
      '추천종목9 100009 · 1건',
      '추천종목10 100010 · 1건',
      '추천종목11 100011 · 1건',
    ]);
    expect(within(search).queryByRole('button', { name: /추천종목1 100001/ })).not.toBeInTheDocument();
    expect(within(search).queryByRole('button', { name: /추천종목12 100012/ })).not.toBeInTheDocument();
    expect(screen.getByText('선택된 종목이 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('리포트를 선택해 분석 내용을 확인하세요.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /추천종목2 리포트 이력/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '선택 리포트 분석 결과' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '점수 선택' })).not.toBeInTheDocument();
  });

  it('does not auto-select the first recommendation when submitting an empty search', async () => {
    const user = userEvent.setup();

    render(<AiAnalysisReportsPage queryRows={async () => [latestSamsungRow, lgChemRow]} />);

    const search = await screen.findByRole('search', { name: 'AI 분석 리포트 검색' });
    await user.click(within(search).getByRole('button', { name: '검색' }));

    expect(within(search).getByRole('searchbox', { name: '종목명 또는 종목코드 검색' })).toHaveValue('');
    expect(screen.getByText('선택된 종목이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '삼성전자 리포트 이력' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '선택 리포트 분석 결과' })).not.toBeInTheDocument();
  });

  it('renders search entry, selected stock history, total report content, agent details, and selected history updates', async () => {
    const user = userEvent.setup();
    const { container } = render(<AiAnalysisReportsPage queryRows={async () => [olderSamsungRow, latestSamsungRow, lgChemRow]} />);

    const search = await screen.findByRole('search', { name: 'AI 분석 리포트 검색' });
    const searchInput = within(search).getByRole('searchbox', { name: '종목명 또는 종목코드 검색' });
    expect(searchInput).toHaveValue('');
    expect(within(search).getByRole('button', { name: /삼성전자 005930/ })).not.toHaveClass('active');
    expect(within(search).getByRole('button', { name: /삼성전자 005930/ })).toHaveAttribute('aria-pressed', 'false');
    expect(within(search).getByRole('button', { name: /LG화학 051910/ })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '종목 대표 목록' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '삼성전자 리포트 이력' })).not.toBeInTheDocument();

    await user.click(within(search).getByRole('button', { name: /삼성전자 005930/ }));

    expect(searchInput).toHaveValue('삼성전자');
    expect(within(search).getByRole('button', { name: /삼성전자 005930/ })).toHaveClass('active');
    expect(within(search).getByRole('button', { name: /삼성전자 005930/ })).toHaveAttribute('aria-pressed', 'true');
    expect(within(search).queryByText('totalScore 상위 추천')).not.toBeInTheDocument();
    expect(within(search).queryByRole('button', { name: /LG화학 051910/ })).not.toBeInTheDocument();

    let history = screen.getByRole('region', { name: '삼성전자 리포트 이력' });
    const historyButtons = within(history).getAllByRole('button');
    expect(historyButtons).toHaveLength(2);
    expect(historyButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(historyButtons[1]).toHaveAttribute('aria-pressed', 'false');
    expect(historyButtons[0]).toHaveTextContent('업데이트 2026-05-17 18:26');
    expect(historyButtons[1]).toHaveTextContent('업데이트 2026-05-10 18:00');
    expect(historyButtons[0]).toHaveTextContent('최신 리포트');
    expect(historyButtons[1]).toHaveTextContent('과거 리포트');
    expect(screen.queryByText('LG화학 리포트 이력')).not.toBeInTheDocument();

    let scoreSelector = screen.getByRole('group', { name: '점수 선택' });
    expect(within(scoreSelector).getByRole('button', { name: 'totalScore 69' })).toHaveClass('active');
    expect(within(scoreSelector).getByRole('button', { name: 'totalScore 69' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(scoreSelector).getByRole('button', { name: 'momentum 78' })).toHaveAttribute('aria-pressed', 'false');
    const hero = screen.getByRole('region', { name: '선택 리포트 분석 결과' });
    expect(within(hero).getByRole('heading', { name: '삼성전자' })).toBeInTheDocument();
    expect(within(hero).queryByRole('heading', { name: /매수/ })).not.toBeInTheDocument();
    expect(within(hero).queryByText('AI 반도체 수요와 목표주가 상향이 핵심입니다.')).not.toBeInTheDocument();
    const totalView = container.querySelector('.ai-report-total-view');
    expect(Array.from(totalView?.children ?? []).map((child) => child.getAttribute('aria-label'))).toEqual([
      'TL;DR',
      '투자위원회 의견',
      '액션 플랜',
      '강세 근거',
      '약세 근거',
      '리스크 체크리스트',
      'DB row 매핑',
    ]);
    const tldr = screen.getByRole('region', { name: 'TL;DR' });
    expect(within(tldr).getByText('AI 반도체 수요와 목표주가 상향이 핵심입니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '투자 의견' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '핵심' })).toBeInTheDocument();
    expect(screen.getAllByText('매수').length).toBeGreaterThan(0);
    expect(container.querySelector('.ai-report-detail-hero')).toBeInTheDocument();
    expect(container.querySelector('.ai-report-total-view')).toBeInTheDocument();
    expect(container.querySelector('.ai-report-content-md-card')).toBeInTheDocument();

    const recommendation = screen.getByRole('region', { name: '추천 의견' });
    expect(within(recommendation).getByText('매수')).toBeInTheDocument();
    expect(within(recommendation).getByText('totalScore 69')).toBeInTheDocument();
    expect(within(recommendation).queryByText(/DB recommendation/i)).not.toBeInTheDocument();

    const actionPlan = screen.getByRole('region', { name: '액션 플랜' });
    expect(within(actionPlan).getByRole('heading', { name: '액션 플랜' })).toBeInTheDocument();
    expect(within(actionPlan).getByText('현재가')).toBeInTheDocument();
    expect(within(actionPlan).getByText('273,500원')).toBeInTheDocument();
    expect(screen.getByText('목표주가 상향')).toBeInTheDocument();
    expect(screen.getByText('파운드리 적자')).toBeInTheDocument();
    const dbMeta = screen.getByRole('region', { name: 'DB row 매핑' });
    expect(within(dbMeta).getByText('row id')).toBeInTheDocument();
    expect(within(dbMeta).getByText('samsung-latest')).toBeInTheDocument();
    expect(within(dbMeta).getByText('updated_at')).toBeInTheDocument();
    expect(within(dbMeta).getByText('2026-05-17T09:26:10.444135+00:00')).toBeInTheDocument();
    expect(screen.queryByText('bull')).not.toBeInTheDocument();
    expect(screen.queryByText('bear')).not.toBeInTheDocument();

    await user.click(within(scoreSelector).getByRole('button', { name: 'momentum 78' }));

    expect(within(scoreSelector).getByRole('button', { name: 'totalScore 69' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(scoreSelector).getByRole('button', { name: 'momentum 78' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Momentum Agent' })).toBeInTheDocument();
    expect(container.querySelector('.ai-report-agent-view')).toBeInTheDocument();
    expect(screen.getByText('모멘텀은 우호적입니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'findings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'risks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'limitations' })).toBeInTheDocument();
    for (const evidence of [
      '목표주가 상승',
      '상승여력 23.77%',
      'AI 제품 수요',
      '골디락스 레짐',
      '파운드리 단기 적자',
      '3개월 추세 down',
    ]) {
      expect(screen.getByText(evidence)).toBeInTheDocument();
    }
    expect(screen.getAllByText('high')).toHaveLength(2);
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.queryByText('target_price')).not.toBeInTheDocument();
    expect(screen.queryByText('upside')).not.toBeInTheDocument();
    for (const item of ['원문 검증 제한', '파운드리 적자', '거시경제 불확실성', 'CPI 상승', 'DX 수요 부진']) {
      expect(screen.getAllByText(item).length).toBeGreaterThan(0);
    }
    for (const item of ['입력 데이터 제한', '가격 시계열 없음', '동종업계 비교 불가', '시장 전체 배경']) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    await user.click(historyButtons[1]);

    scoreSelector = screen.getByRole('group', { name: '점수 선택' });
    expect(within(scoreSelector).getByRole('button', { name: 'totalScore 61' })).toHaveClass('active');
    expect(historyButtons[0]).toHaveAttribute('aria-pressed', 'false');
    expect(historyButtons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: '이전 투자 의견' })).toBeInTheDocument();
    expect(screen.getByText('250,000원')).toBeInTheDocument();
    expect(screen.getByText('추가 진입 보류')).toBeInTheDocument();

    await user.click(within(scoreSelector).getByRole('button', { name: 'momentum 62' }));
    expect(screen.getByText('이전 모멘텀은 중립입니다.')).toBeInTheDocument();
    expect(screen.getByText('이전 수요 둔화')).toBeInTheDocument();
    expect(screen.queryByText('legacy_metric')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'LG');
    await user.click(within(search).getByRole('button', { name: /LG화학 051910/ }));

    expect(searchInput).toHaveValue('LG화학');
    history = screen.getByRole('region', { name: 'LG화학 리포트 이력' });
    expect(within(history).getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('region', { name: '삼성전자 리포트 이력' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '추천 의견' })).getByText('중립')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '추천 의견' })).getByText('totalScore 55')).toBeInTheDocument();
  });

  it('falls back to report payload content when selected agent output is missing', async () => {
    const user = userEvent.setup();
    render(<AiAnalysisReportsPage queryRows={async () => [createSamsungRow({ agent_outputs: {} })]} />);

    const search = await screen.findByRole('search', { name: 'AI 분석 리포트 검색' });
    await user.click(within(search).getByRole('button', { name: /삼성전자 005930/ }));

    const scoreSelector = screen.getByRole('group', { name: '점수 선택' });
    await user.click(within(scoreSelector).getByRole('button', { name: 'momentum 78' }));

    expect(screen.getByRole('heading', { name: 'Momentum Agent' })).toBeInTheDocument();
    expect(screen.getAllByText('AI 반도체 수요와 목표주가 상향이 핵심입니다.').length).toBeGreaterThan(0);
    expect(screen.getByText('목표주가 상향')).toBeInTheDocument();
    expect(screen.getByText('파운드리 적자')).toBeInTheDocument();
    expect(screen.getAllByText('evidence/confidence 없음')).toHaveLength(2);
    expect(screen.getByText('환율 변동')).toBeInTheDocument();
    expect(screen.getByText('agent_outputs가 없어 상세 limitations가 없습니다.')).toBeInTheDocument();
  });

  it('does not silently reselect a selected stock after it disappears and reappears after reload', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AiAnalysisReportsPage queryRows={async () => [latestSamsungRow, lgChemRow]} />);

    const search = await screen.findByRole('search', { name: 'AI 분석 리포트 검색' });
    await user.click(within(search).getByRole('button', { name: /삼성전자 005930/ }));
    expect(screen.getByRole('region', { name: '삼성전자 리포트 이력' })).toBeInTheDocument();

    rerender(<AiAnalysisReportsPage queryRows={async () => [lgChemRow]} />);

    expect(await screen.findByText('선택된 종목이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'LG화학 리포트 이력' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '삼성전자 리포트 이력' })).not.toBeInTheDocument();

    rerender(<AiAnalysisReportsPage queryRows={async () => [latestSamsungRow, lgChemRow]} />);

    await waitFor(() => {
      expect(screen.getByText('선택된 종목이 없습니다.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('region', { name: '삼성전자 리포트 이력' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('search', { name: 'AI 분석 리포트 검색' })).getByRole('button', { name: /삼성전자 005930/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('does not reserve the TLDR grid slot when the selected report has no investment thesis', async () => {
    const user = userEvent.setup();
    const noThesisRow = createSamsungRow({
      report_payload: {
        actionPlan: {
          hold: '보유자는 유지',
          entry: '분할 진입',
          exitOrReview: '리스크 재점검',
        },
        bullFindings: ['목표주가 상향'],
        bearFindings: ['파운드리 적자'],
        riskChecklist: ['환율 변동'],
      },
    });
    const { container } = render(<AiAnalysisReportsPage queryRows={async () => [noThesisRow]} />);

    const search = await screen.findByRole('search', { name: 'AI 분석 리포트 검색' });
    await user.click(within(search).getByRole('button', { name: /삼성전자 005930/ }));

    expect(screen.queryByRole('region', { name: 'TL;DR' })).not.toBeInTheDocument();
    expect(container.querySelector('.ai-report-total-view')).toHaveClass('no-tldr');
    expect(Array.from(container.querySelector('.ai-report-total-view')?.children ?? []).map((child) => child.getAttribute('aria-label'))).toEqual([
      '투자위원회 의견',
      '액션 플랜',
      '강세 근거',
      '약세 근거',
      '리스크 체크리스트',
      'DB row 매핑',
    ]);
  });
});
