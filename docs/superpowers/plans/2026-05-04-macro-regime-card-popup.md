# Macro Regime Card Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `macro_regime_decisions`의 KR/US 최신 판단을 카드로 보여주고, 카드 선택 시 기존 대시보드 스타일의 상세 팝업에서 실제 데이터를 모두 보여준다.

**Architecture:** 기존 컨센서스 구현처럼 Supabase 조회, 정규화 모델, React hook, UI 컴포넌트를 분리한다. `macro-regime` 도메인은 `src/macro-regime/`에 두고, 화면 컴포넌트는 `src/components/`에 둔다. 앱은 기존 `App.tsx` 셸 안에 `MacroRegimePage` 섹션을 추가하고, 테스트는 모델, hook, 앱 상호작용을 각각 검증한다.

**Tech Stack:** React, TypeScript, Vite, Supabase JS, Vitest, React Testing Library, CSS.

---

## 파일 구조

- Create: `src/macro-regime/model.ts`
  - 원시 Supabase 행을 KR/US 최신 판단 UI 모델로 정규화한다.
  - 날짜, 추세, 마크다운 전문 표시용 데이터 변환을 담당한다.
- Create: `src/macro-regime/model.test.ts`
  - 정규화, 날짜 포맷, 추세 라벨, KR/US 정렬을 검증한다.
- Create: `src/macro-regime/api.ts`
  - Supabase 설정을 읽고 `macro_regime_decisions`를 국가별 최신 행으로 조회한다.
- Create: `src/macro-regime/useMacroRegimeDecisions.ts`
  - 로딩, 성공, 오류 상태를 관리하고 정규화된 KR/US 판단을 반환한다.
- Create: `src/macro-regime/useMacroRegimeDecisions.test.tsx`
  - 환경변수 오류, query 함수 주입, query 실패 상태를 검증한다.
- Create: `src/components/MacroRegimePage.tsx`
  - KR/US 카드 행과 상세 팝업을 렌더링한다.
- Create: `src/components/MacroRegimePage.test.tsx`
  - 카드 표시, 팝업 열기/닫기, 실제 상세 데이터 표시를 검증한다.
- Modify: `src/App.tsx`
  - `MacroRegimePage`를 기존 대시보드 흐름에 삽입하고 테스트 주입용 prop을 추가한다.
- Modify: `src/App.test.tsx`
  - 앱 셸 안에 매크로 레짐 섹션과 팝업 상호작용이 동작하는지 검증한다.
- Modify: `src/content.ts`
  - 내비게이션에 `매크로 레짐` 항목을 추가한다.
- Modify: `src/styles.css`
  - 기존 어두운 대시보드 스타일 안에서 매크로 카드, 모달, 축 목록, 지표 테이블 반응형 스타일을 추가한다.

---

### Task 1: 매크로 레짐 모델

**Files:**
- Create: `src/macro-regime/model.ts`
- Create: `src/macro-regime/model.test.ts`

- [ ] **Step 1: 실패하는 모델 테스트 작성**

Create `src/macro-regime/model.test.ts`:

```ts
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

  it('returns null when required card fields are missing', () => {
    expect(normalizeMacroRegimeRow({ market: 'US', regime: '리플레이션(reflation)' })).toBeNull();
    expect(normalizeMacroRegimeRow({ run_date: '2026-05-04', regime: '리플레이션(reflation)' })).toBeNull();
  });

  it('formats dates and trend labels', () => {
    expect(formatDecisionDate('2026-05-04')).toBe('2026.05.04');
    expect(formatDecisionDate('2026-05-04T07:53:42.522269+00:00')).toBe('2026.05.04');
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
```

- [ ] **Step 2: 모델 테스트가 실패하는지 확인**

Run: `rtk npm test -- src/macro-regime/model.test.ts`

Expected: FAIL with an import error for `./model`.

- [ ] **Step 3: 모델 구현 작성**

Create `src/macro-regime/model.ts`:

```ts
export type RawMacroRegimeRow = Record<string, unknown>;

export type MacroRegimeMarket = 'KR' | 'US';
export type TrendTone = 'up' | 'down' | 'flat' | 'neutral';
export type AxisKey = 'growth' | 'inflation' | 'monetary' | 'liquidity';

export type MacroAxisAssessment = {
  key: AxisKey;
  label: '성장' | '물가' | '통화' | '유동성';
  judgment: string;
  rationale: string;
  confidence: number | null;
  confidenceLabel: string;
};

export type MacroKeyIndicator = {
  label: string;
  valueLabel: string;
  source: string;
  trendLabel: string;
  trendTone: TrendTone;
  interpretation: string;
};

export type MacroRegimeDecision = {
  id: string;
  market: MacroRegimeMarket;
  dateLabel: string;
  regime: string;
  axisSummary: string;
  summary: string;
  axisAssessments: MacroAxisAssessment[];
  keyIndicators: MacroKeyIndicator[];
  assetImplications: string[];
  riskFactors: string[];
  contentMarkdown: string;
};

const axisDefinitions: Array<{ key: AxisKey; label: MacroAxisAssessment['label'] }> = [
  { key: 'growth', label: '성장' },
  { key: 'inflation', label: '물가' },
  { key: 'monetary', label: '통화' },
  { key: 'liquidity', label: '유동성' },
];

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parseText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parseText).filter((item): item is string => item !== null);
}

export function formatDecisionDate(value: unknown): string {
  const text = parseText(value);
  if (!text) {
    return '-';
  }

  const datePart = text.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart.replace(/-/g, '.') : text;
}

export function formatTrendLabel(value: unknown): { label: string; tone: TrendTone } {
  const trend = parseText(value);

  if (trend === 'up') {
    return { label: '↑ 상승', tone: 'up' };
  }

  if (trend === 'down') {
    return { label: '↓ 하락', tone: 'down' };
  }

  if (trend === 'flat') {
    return { label: '→ 보합', tone: 'flat' };
  }

  return { label: '-', tone: 'neutral' };
}

function formatValue(value: unknown, unit: unknown): string {
  const textValue = parseText(value);
  const textUnit = parseText(unit);

  if (!textValue) {
    return '-';
  }

  return `${textValue}${textUnit ?? ''}`;
}

function normalizeAxisAssessments(value: unknown): MacroAxisAssessment[] {
  const assessments = readObject(value);

  return axisDefinitions.map(({ key, label }) => {
    const source = readObject(assessments?.[key]) ?? {};
    const judgment = parseText(source.axis) ?? '-';
    const rationale = parseText(source.rationale) ?? '축 판단 설명이 없습니다.';
    const confidence = parseNumber(source.confidence);

    return {
      key,
      label,
      judgment,
      rationale,
      confidence,
      confidenceLabel: confidence === null ? '컨피던스 -' : `컨피던스 ${confidence.toFixed(2)}`,
    };
  });
}

function normalizeKeyIndicators(value: unknown): MacroKeyIndicator[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const source = readObject(item);
      if (!source) {
        return null;
      }

      const trend = formatTrendLabel(source.trend_3m);

      return {
        label: parseText(source.label) ?? '-',
        valueLabel: formatValue(source.value, source.unit),
        source: parseText(source.source) ?? '-',
        trendLabel: trend.label,
        trendTone: trend.tone,
        interpretation: parseText(source.interpretation) ?? '-',
      };
    })
    .filter((item): item is MacroKeyIndicator => item !== null);
}

function isMarket(value: string | null): value is MacroRegimeMarket {
  return value === 'KR' || value === 'US';
}

export function normalizeMacroRegimeRow(row: RawMacroRegimeRow): MacroRegimeDecision | null {
  const market = parseText(row.market);
  const regime = parseText(row.regime);
  const runDate = parseText(row.run_date);

  if (!isMarket(market) || !regime || !runDate) {
    return null;
  }

  const axisAssessments = normalizeAxisAssessments(row.axis_assessments);
  const growth = axisAssessments.find((axis) => axis.key === 'growth')?.judgment ?? '-';
  const inflation = axisAssessments.find((axis) => axis.key === 'inflation')?.judgment ?? '-';

  return {
    id: parseText(row.id) ?? `${market}-${runDate}`,
    market,
    dateLabel: formatDecisionDate(runDate),
    regime,
    axisSummary: `성장축은 ${growth}, 물가축은 ${inflation}로 판정됐습니다.`,
    summary: parseText(row.summary) ?? '요약이 없습니다.',
    axisAssessments,
    keyIndicators: normalizeKeyIndicators(row.key_indicators),
    assetImplications: parseTextList(row.asset_implications),
    riskFactors: parseTextList(row.risk_factors),
    contentMarkdown: parseText(row.content_md) ?? '',
  };
}

export function buildMacroRegimeDecisions(rows: RawMacroRegimeRow[]): MacroRegimeDecision[] {
  const decisions = rows
    .map(normalizeMacroRegimeRow)
    .filter((decision): decision is MacroRegimeDecision => decision !== null);

  return ['KR', 'US']
    .map((market) => decisions.find((decision) => decision.market === market))
    .filter((decision): decision is MacroRegimeDecision => decision !== undefined);
}
```

- [ ] **Step 4: 모델 테스트 통과 확인**

Run: `rtk npm test -- src/macro-regime/model.test.ts`

Expected: PASS.

- [ ] **Step 5: 모델 계층 커밋**

```bash
rtk git add src/macro-regime/model.ts src/macro-regime/model.test.ts
rtk git commit -m "feat: 매크로 레짐 모델 추가"
```

---

### Task 2: Supabase 조회 hook

**Files:**
- Create: `src/macro-regime/api.ts`
- Create: `src/macro-regime/useMacroRegimeDecisions.ts`
- Create: `src/macro-regime/useMacroRegimeDecisions.test.tsx`

- [ ] **Step 1: 실패하는 hook 테스트 작성**

Create `src/macro-regime/useMacroRegimeDecisions.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMacroRegimeDecisions } from './useMacroRegimeDecisions';

describe('useMacroRegimeDecisions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useMacroRegimeDecisions());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads normalized KR and US decisions from the provided query function', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      {
        id: '2026-05-04-US',
        run_date: '2026-05-04',
        market: 'US',
        regime: '리플레이션(reflation)',
        axis_assessments: {
          growth: { axis: 'neutral', rationale: '성장 중립', confidence: 0.69 },
          inflation: { axis: 'elevated', rationale: '물가 부담', confidence: 0.71 },
          monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.66 },
          liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.78 },
        },
      },
      {
        id: '2026-05-04-KR',
        run_date: '2026-05-04',
        market: 'KR',
        regime: '골디락스(goldilocks)',
        axis_assessments: {
          growth: { axis: 'expanding', rationale: '성장 확장', confidence: 0.82 },
          inflation: { axis: 'neutral', rationale: '물가 중립', confidence: 0.74 },
          monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.63 },
          liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.68 },
        },
      },
    ]);

    const { result } = renderHook(() => useMacroRegimeDecisions({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.decisions.map((decision) => decision.market)).toEqual(['KR', 'US']);
    expect(result.current.decisions.map((decision) => decision.regime)).toEqual([
      '골디락스(goldilocks)',
      '리플레이션(reflation)',
    ]);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useMacroRegimeDecisions({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
```

- [ ] **Step 2: hook 테스트가 실패하는지 확인**

Run: `rtk npm test -- src/macro-regime/useMacroRegimeDecisions.test.tsx`

Expected: FAIL with an import error for `./useMacroRegimeDecisions`.

- [ ] **Step 3: Supabase 조회 함수 작성**

Create `src/macro-regime/api.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import type { RawMacroRegimeRow } from './model';

const tableName = 'macro_regime_decisions';
const markets = ['KR', 'US'] as const;

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryMacroRegimeRows(): Promise<RawMacroRegimeRow[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey);

  const results = await Promise.all(
    markets.map(async (market) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('market', market)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      return data?.[0] ?? null;
    }),
  );

  return results.filter((row): row is RawMacroRegimeRow => row !== null);
}
```

- [ ] **Step 4: hook 구현 작성**

Create `src/macro-regime/useMacroRegimeDecisions.ts`:

```ts
import { useEffect, useState } from 'react';
import { queryMacroRegimeRows } from './api';
import {
  buildMacroRegimeDecisions,
  type MacroRegimeDecision,
  type RawMacroRegimeRow,
} from './model';

type MacroRegimeState =
  | { status: 'loading'; decisions: MacroRegimeDecision[]; error: null }
  | { status: 'success'; decisions: MacroRegimeDecision[]; error: null }
  | { status: 'error'; decisions: MacroRegimeDecision[]; error: string };

type UseMacroRegimeOptions = {
  queryRows?: () => Promise<RawMacroRegimeRow[]>;
};

export function useMacroRegimeDecisions(options: UseMacroRegimeOptions = {}): MacroRegimeState {
  const [state, setState] = useState<MacroRegimeState>({
    status: 'loading',
    decisions: [],
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryMacroRegimeRows;

    async function load() {
      setState({ status: 'loading', decisions: [], error: null });

      try {
        const rawRows = await loadRows();
        const decisions = buildMacroRegimeDecisions(rawRows);

        if (isMounted) {
          setState({ status: 'success', decisions, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            decisions: [],
            error: error instanceof Error ? error.message : '매크로 레짐 데이터를 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryRows]);

  return state;
}
```

- [ ] **Step 5: hook 테스트 통과 확인**

Run: `rtk npm test -- src/macro-regime/useMacroRegimeDecisions.test.tsx`

Expected: PASS.

- [ ] **Step 6: 조회 계층 커밋**

```bash
rtk git add src/macro-regime/api.ts src/macro-regime/useMacroRegimeDecisions.ts src/macro-regime/useMacroRegimeDecisions.test.tsx
rtk git commit -m "feat: 매크로 레짐 최신 판단 조회 추가"
```

---

### Task 3: 매크로 레짐 UI 컴포넌트

**Files:**
- Create: `src/components/MacroRegimePage.tsx`
- Create: `src/components/MacroRegimePage.test.tsx`

- [ ] **Step 1: 실패하는 컴포넌트 테스트 작성**

Create `src/components/MacroRegimePage.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MacroRegimePage } from './MacroRegimePage';
import type { RawMacroRegimeRow } from '../macro-regime/model';

const rows: RawMacroRegimeRow[] = [
  {
    id: '2026-05-04-KR',
    run_date: '2026-05-04',
    market: 'KR',
    regime: '골디락스(goldilocks)',
    summary: '한국은 성장축이 확장으로 판정되고 물가축은 중립으로 판정된다.',
    axis_assessments: {
      growth: { axis: 'expanding', rationale: '경기선행지수가 성장축을 강하게 지지한다.', confidence: 0.82 },
      inflation: { axis: 'neutral', rationale: '물가 압력이 평균 대비 높지 않다.', confidence: 0.74 },
      monetary: { axis: 'neutral', rationale: '금리 수준은 완만한 부담이나 추세는 중립이다.', confidence: 0.63 },
      liquidity: { axis: 'ample', rationale: 'KOSPI YoY가 유동성축을 보조한다.', confidence: 0.68 },
    },
    key_indicators: [],
    asset_implications: ['성장 확장과 물가 중립 조합은 위험자산에 우호적이다.'],
    risk_factors: ['물가 지표 추세가 up이므로 elevated로 이동할 위험이 있다.'],
    content_md: '# KR 전문\n한국 레짐 전문입니다.',
  },
  {
    id: '2026-05-04-US',
    run_date: '2026-05-04',
    market: 'US',
    regime: '리플레이션(reflation)',
    summary: '미국은 성장축이 중립, 물가축이 elevated로 판정된다.',
    axis_assessments: {
      growth: { axis: 'neutral', rationale: '성장 지표는 약한 음수이나 contracting으로 단정하기 어렵다.', confidence: 0.69 },
      inflation: { axis: 'elevated', rationale: '헤드라인 CPI의 레벨 부담과 상승 추세를 반영한다.', confidence: 0.71 },
      monetary: { axis: 'neutral', rationale: '연방기금금리 부담과 수익률곡선 개선이 상충된다.', confidence: 0.66 },
      liquidity: { axis: 'ample', rationale: 'M2와 HY spread가 유동성을 지지한다.', confidence: 0.78 },
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
    asset_implications: ['유동성 ample은 위험자산을 보조하지만, 물가축 elevated가 할인율 부담을 남길 수 있다.'],
    risk_factors: ['Core CPI는 하락 추세라 물가축 elevated 판정의 확신을 낮춘다.'],
    content_md: '# 2026-05-04 US 매크로 레짐: 리플레이션(reflation)\n\n## 요약 (TL;DR)\n미국 전문입니다.',
  },
];

describe('MacroRegimePage', () => {
  it('renders KR and US latest decision cards', async () => {
    render(<MacroRegimePage queryRows={async () => rows} />);

    expect(await screen.findByRole('heading', { name: '최신 매크로 레짐 판단' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /KR/ })).toHaveTextContent('골디락스(goldilocks)');
    expect(screen.getByRole('button', { name: /US/ })).toHaveTextContent('리플레이션(reflation)');
    expect(screen.getAllByText('2026.05.04')).not.toHaveLength(0);
    expect(screen.getByText('expanding')).toBeInTheDocument();
    expect(screen.getByText('elevated')).toBeInTheDocument();
  });

  it('opens a popup with actual US detail data and closes it', async () => {
    const user = userEvent.setup();
    render(<MacroRegimePage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /US/ }));

    const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });
    expect(within(dialog).getByText('2026.05.04')).toBeInTheDocument();
    expect(within(dialog).queryByText(/as of/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/updated_at 최신/)).not.toBeInTheDocument();
    expect(within(dialog).getByText(rows[1].summary as string)).toBeInTheDocument();
    expect(within(dialog).getByText('성장')).toBeInTheDocument();
    expect(within(dialog).getByText('판단 neutral')).toBeInTheDocument();
    expect(within(dialog).getByText('컨피던스 0.69')).toBeInTheDocument();
    expect(within(dialog).getByText('미국 CPI (YoY)')).toBeInTheDocument();
    expect(within(dialog).getByText('↑ 상승')).toBeInTheDocument();
    expect(within(dialog).getByText('↓ 하락')).toBeInTheDocument();
    expect(within(dialog).getByText(/유동성 ample은 위험자산을 보조/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Core CPI는 하락 추세/)).toBeInTheDocument();
    expect(within(dialog).getByText(/미국 전문입니다/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '상세 팝업 닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 컴포넌트 테스트가 실패하는지 확인**

Run: `rtk npm test -- src/components/MacroRegimePage.test.tsx`

Expected: FAIL with an import error for `./MacroRegimePage`.

- [ ] **Step 3: UI 컴포넌트 구현**

Create `src/components/MacroRegimePage.tsx`:

```tsx
import { useEffect, useId, useState } from 'react';
import type { RawMacroRegimeRow, MacroRegimeDecision, MacroKeyIndicator } from '../macro-regime/model';
import { useMacroRegimeDecisions } from '../macro-regime/useMacroRegimeDecisions';

type MacroRegimePageProps = {
  queryRows?: () => Promise<RawMacroRegimeRow[]>;
};

function renderMarkdownText(markdown: string) {
  return markdown
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^#{1,6}\s*/, '').replace(/^\|\s*/, '').replace(/\s*\|$/g, ''));
}

function IndicatorRow({ indicator }: { indicator: MacroKeyIndicator }) {
  return (
    <div className="macro-indicator-row">
      <strong>{indicator.label}</strong>
      <span>{indicator.valueLabel}</span>
      <span className={`macro-trend macro-trend-${indicator.trendTone}`}>{indicator.trendLabel}</span>
      <span>{indicator.source}</span>
      <span>{indicator.interpretation}</span>
    </div>
  );
}

function DecisionCard({ decision, onOpen }: { decision: MacroRegimeDecision; onOpen: () => void }) {
  return (
    <button className="macro-regime-card" type="button" onClick={onOpen}>
      <div className="macro-card-meta">
        <span className="macro-market-chip">{decision.market}</span>
        <time>{decision.dateLabel}</time>
      </div>
      <strong>{decision.regime}</strong>
      <p>{decision.axisSummary}</p>
      <div className="macro-axis-mini-grid">
        {decision.axisAssessments.map((axis) => (
          <span className="macro-axis-mini" key={axis.key}>
            <small>{axis.label}</small>
            <b>{axis.judgment}</b>
          </span>
        ))}
      </div>
    </button>
  );
}

function DetailDialog({ decision, onClose }: { decision: MacroRegimeDecision; onClose: () => void }) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="macro-modal-backdrop" onClick={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="macro-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="macro-modal-header">
          <div>
            <div className="macro-modal-meta">
              <span>{decision.market}</span>
              <time>{decision.dateLabel}</time>
            </div>
            <h3 id={titleId}>{decision.regime}</h3>
          </div>
          <button className="macro-modal-close" type="button" aria-label="상세 팝업 닫기" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="macro-modal-body">
          <aside className="macro-modal-nav" aria-label="매크로 레짐 상세 목차">
            {['요약', '4개 축 판단', '핵심 지표', '자산 영향', '리스크', '전문'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </aside>
          <main className="macro-modal-content">
            <section className="macro-popup-panel">
              <span className="macro-panel-kicker">TL;DR</span>
              <p>{decision.summary}</p>
            </section>
            <section className="macro-popup-panel">
              <h4>4개 축 판단</h4>
              <div className="macro-axis-list">
                {decision.axisAssessments.map((axis) => (
                  <article className="macro-axis-block" key={axis.key}>
                    <div className="macro-axis-row">
                      <h5>{axis.label}</h5>
                      <span>판단 {axis.judgment}</span>
                      <span>{axis.confidenceLabel}</span>
                    </div>
                    <p>{axis.rationale}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="macro-popup-panel">
              <h4>핵심 지표</h4>
              <div className="macro-indicator-table">
                {decision.keyIndicators.map((indicator) => (
                  <IndicatorRow indicator={indicator} key={`${indicator.label}-${indicator.source}`} />
                ))}
              </div>
            </section>
            <section className="macro-popup-panel">
              <h4>자산 영향</h4>
              <ul>
                {decision.assetImplications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="macro-popup-panel">
              <h4>리스크</h4>
              <ul>
                {decision.riskFactors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="macro-popup-panel">
              <h4>전문</h4>
              {renderMarkdownText(decision.contentMarkdown).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}

export function MacroRegimePage({ queryRows }: MacroRegimePageProps) {
  const state = useMacroRegimeDecisions({ queryRows });
  const [selectedDecision, setSelectedDecision] = useState<MacroRegimeDecision | null>(null);

  const statusContent =
    state.status === 'loading' ? (
      <div className="state-panel">매크로 레짐 데이터를 불러오는 중입니다.</div>
    ) : state.status === 'error' ? (
      <div className="state-panel error">{state.error}</div>
    ) : state.decisions.length === 0 ? (
      <div className="state-panel">표시할 매크로 레짐 데이터가 없습니다.</div>
    ) : null;

  return (
    <section className="dashboard-section macro-regime-section" id="macro-regime" aria-labelledby="macro-regime-title">
      <div className="section-heading">
        <span>Macro Regime</span>
        <h2 id="macro-regime-title">최신 매크로 레짐 판단</h2>
      </div>
      <p className="macro-regime-copy">
        국가별 최신 레짐 판단을 먼저 확인하고, 카드를 선택하면 화면 전환 없이 상세 설명을 모두 읽습니다.
      </p>
      {statusContent}
      {state.status === 'success' && state.decisions.length > 0 ? (
        <div className="macro-regime-grid">
          {state.decisions.map((decision) => (
            <DecisionCard decision={decision} key={decision.id} onOpen={() => setSelectedDecision(decision)} />
          ))}
        </div>
      ) : null}
      {selectedDecision ? <DetailDialog decision={selectedDecision} onClose={() => setSelectedDecision(null)} /> : null}
    </section>
  );
}
```

- [ ] **Step 4: 컴포넌트 테스트 통과 확인**

Run: `rtk npm test -- src/components/MacroRegimePage.test.tsx`

Expected: PASS.

- [ ] **Step 5: UI 컴포넌트 커밋**

```bash
rtk git add src/components/MacroRegimePage.tsx src/components/MacroRegimePage.test.tsx
rtk git commit -m "feat: 매크로 레짐 카드와 팝업 추가"
```

---

### Task 4: 앱 연결과 내비게이션

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/content.ts`

- [ ] **Step 1: 실패하는 앱 테스트 수정**

Modify `src/App.test.tsx` by adding macro rows and expectations:

```tsx
const macroRows = [
  {
    id: '2026-05-04-KR',
    run_date: '2026-05-04',
    market: 'KR',
    regime: '골디락스(goldilocks)',
    axis_assessments: {
      growth: { axis: 'expanding', rationale: '성장 확장', confidence: 0.82 },
      inflation: { axis: 'neutral', rationale: '물가 중립', confidence: 0.74 },
      monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.63 },
      liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.68 },
    },
  },
  {
    id: '2026-05-04-US',
    run_date: '2026-05-04',
    market: 'US',
    regime: '리플레이션(reflation)',
    summary: '미국은 성장축이 중립, 물가축이 elevated로 판정된다.',
    axis_assessments: {
      growth: { axis: 'neutral', rationale: '성장 중립', confidence: 0.69 },
      inflation: { axis: 'elevated', rationale: '물가 부담', confidence: 0.71 },
      monetary: { axis: 'neutral', rationale: '통화 중립', confidence: 0.66 },
      liquidity: { axis: 'ample', rationale: '유동성 우호', confidence: 0.78 },
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
    ],
    asset_implications: ['유동성 ample은 위험자산을 보조한다.'],
    risk_factors: ['성장축이 contracting으로 약화될 위험이 있다.'],
    content_md: '# US 전문\n미국 전문입니다.',
  },
];
```

Update the first render call:

```tsx
const { container } = render(<App queryRows={async () => rows} queryMacroRows={async () => macroRows} />);
```

Add assertions in the first test:

```tsx
const macroLinks = screen.getAllByRole('link', { name: '매크로 레짐' });
expect(macroLinks).toHaveLength(2);
macroLinks.forEach((link) => expect(link).toHaveAttribute('href', '#macro-regime'));
expect(await screen.findByRole('heading', { name: '최신 매크로 레짐 판단' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /KR/ })).toHaveTextContent('골디락스(goldilocks)');
expect(screen.getByRole('button', { name: /US/ })).toHaveTextContent('리플레이션(reflation)');
```

Add a new interaction test:

```tsx
it('opens the macro regime popup from the app shell', async () => {
  const user = userEvent.setup();
  render(<App queryRows={async () => rows} queryMacroRows={async () => macroRows} />);

  await user.click(await screen.findByRole('button', { name: /US/ }));

  expect(screen.getByRole('dialog', { name: '리플레이션(reflation)' })).toBeInTheDocument();
  expect(screen.getByText('미국 CPI (YoY)')).toBeInTheDocument();
  expect(screen.getByText('↑ 상승')).toBeInTheDocument();
});
```

- [ ] **Step 2: 앱 테스트가 실패하는지 확인**

Run: `rtk npm test -- src/App.test.tsx`

Expected: FAIL because `queryMacroRows` prop and `매크로 레짐` nav are not implemented.

- [ ] **Step 3: 내비게이션 추가**

Modify `src/content.ts`:

```ts
export const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: '매크로 레짐', href: '#macro-regime' },
  { label: '컨센서스 괴리율 랭킹', href: '#consensus' },
  { label: 'Work', href: '#work' },
  { label: 'Writing', href: '#writing' },
  { label: 'Stack', href: '#stack' },
  { label: 'Contact', href: '#contact' },
];
```

- [ ] **Step 4: App 연결**

Modify `src/App.tsx` imports and props:

```tsx
import type { RawMacroRegimeRow } from './macro-regime/model';
import { MacroRegimePage } from './components/MacroRegimePage';

type AppProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryMacroRows?: () => Promise<RawMacroRegimeRow[]>;
};
```

Insert the section before `ConsensusRankingPage`:

```tsx
<MacroRegimePage queryRows={queryMacroRows} />
<ConsensusRankingPage queryRows={queryRows} />
```

- [ ] **Step 5: 앱 테스트 통과 확인**

Run: `rtk npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: 앱 연결 커밋**

```bash
rtk git add src/App.tsx src/App.test.tsx src/content.ts
rtk git commit -m "feat: 매크로 레짐 섹션 연결"
```

---

### Task 5: 스타일과 반응형 완성

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 스타일 검증 테스트를 먼저 실행해 현재 UI 테스트 기준 확인**

Run: `rtk npm test -- src/components/MacroRegimePage.test.tsx src/App.test.tsx`

Expected: PASS. 이 단계는 스타일 적용 전 기존 동작 기준선을 확인한다.

- [ ] **Step 2: 매크로 레짐 스타일 추가**

Append to `src/styles.css` before the first `@media` block:

```css
.macro-regime-copy {
  max-width: 760px;
  margin-bottom: 20px;
  color: #d7d0c5;
}

.macro-regime-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.macro-regime-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(185, 177, 164, 0.18);
  border-radius: 8px;
  background: rgba(10, 10, 9, 0.36);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.macro-regime-card:hover {
  border-color: rgba(45, 212, 191, 0.34);
  background: rgba(10, 10, 9, 0.48);
}

.macro-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  color: #b9b1a4;
  font-size: 12px;
}

.macro-market-chip {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 0 9px;
  border: 1px solid rgba(45, 212, 191, 0.32);
  border-radius: 8px;
  background: rgba(45, 212, 191, 0.12);
  color: #99f6e4;
  font-size: 12px;
  font-weight: 800;
}

.macro-regime-card > strong {
  display: block;
  margin-bottom: 8px;
  color: #fffaf0;
  font-size: 25px;
  line-height: 1.12;
}

.macro-regime-card > p {
  margin-bottom: 16px;
  color: #d7d0c5;
}

.macro-axis-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.macro-axis-mini,
.macro-popup-panel,
.macro-axis-block {
  border: 1px solid rgba(185, 177, 164, 0.18);
  border-radius: 8px;
  background: rgba(10, 10, 9, 0.28);
}

.macro-axis-mini {
  min-width: 0;
  padding: 10px;
}

.macro-axis-mini small {
  display: block;
  color: #b9b1a4;
  font-size: 11px;
  font-weight: 700;
}

.macro-axis-mini b {
  display: block;
  overflow-wrap: anywhere;
  margin-top: 4px;
  color: #f3efe6;
  font-size: 13px;
}

.macro-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 30px;
  background: rgba(0, 0, 0, 0.58);
}

.macro-modal {
  display: grid;
  grid-template-rows: auto 1fr;
  width: min(980px, 100%);
  max-height: min(780px, calc(100vh - 60px));
  overflow: hidden;
  border: 1px solid rgba(185, 177, 164, 0.22);
  border-radius: 8px;
  background: #1f1d1b;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
}

.macro-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(185, 177, 164, 0.16);
  background: rgba(10, 10, 9, 0.42);
}

.macro-modal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  color: #b9b1a4;
  font-size: 12px;
}

.macro-modal-meta span:first-child {
  color: #2dd4bf;
  font-weight: 800;
}

.macro-modal-header h3 {
  margin: 0;
  color: #fffaf0;
  font-size: 28px;
  line-height: 1.16;
}

.macro-modal-close {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(185, 177, 164, 0.24);
  border-radius: 8px;
  background: rgba(10, 10, 9, 0.36);
  color: #f3efe6;
  cursor: pointer;
  font-size: 20px;
}

.macro-modal-body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  min-height: 0;
}

.macro-modal-nav {
  padding: 16px;
  border-right: 1px solid rgba(185, 177, 164, 0.14);
  background: rgba(10, 10, 9, 0.22);
}

.macro-modal-nav span {
  display: block;
  padding: 9px 10px;
  border-radius: 8px;
  color: #d7d0c5;
  font-size: 13px;
}

.macro-modal-nav span:first-child {
  background: rgba(45, 212, 191, 0.13);
  color: #99f6e4;
  font-weight: 800;
}

.macro-modal-content {
  min-height: 0;
  overflow: auto;
  padding: 22px 26px 30px;
}

.macro-popup-panel {
  margin-bottom: 14px;
  padding: 16px;
}

.macro-popup-panel h4 {
  margin: 0 0 12px;
  color: #fffaf0;
  font-size: 16px;
}

.macro-popup-panel p,
.macro-popup-panel li {
  color: #d7d0c5;
  line-height: 1.65;
}

.macro-popup-panel p {
  margin: 0 0 10px;
}

.macro-popup-panel p:last-child {
  margin-bottom: 0;
}

.macro-panel-kicker {
  display: block;
  margin-bottom: 8px;
  color: #2dd4bf;
  font-size: 12px;
  font-weight: 800;
}

.macro-axis-list {
  display: grid;
  gap: 10px;
}

.macro-axis-block {
  padding: 16px;
}

.macro-axis-row {
  display: grid;
  grid-template-columns: minmax(90px, 0.8fr) minmax(130px, 1fr) minmax(120px, 0.9fr);
  gap: 12px;
  align-items: baseline;
  margin-bottom: 10px;
}

.macro-axis-row h5 {
  margin: 0;
  color: #fffaf0;
  font-size: 16px;
  line-height: 1.3;
}

.macro-axis-row span:nth-child(2) {
  color: #99f6e4;
  font-size: 13px;
  font-weight: 800;
}

.macro-axis-row span:nth-child(3) {
  color: #b9b1a4;
  font-size: 12px;
  font-weight: 800;
  text-align: right;
}

.macro-indicator-table {
  display: grid;
  color: #d7d0c5;
  font-size: 13px;
}

.macro-indicator-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 78px 72px 64px minmax(220px, 1.35fr);
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(185, 177, 164, 0.12);
}

.macro-indicator-row:last-child {
  border-bottom: 0;
}

.macro-indicator-row strong {
  color: #f3efe6;
}

.macro-trend {
  font-weight: 900;
}

.macro-trend-up {
  color: #99f6e4;
}

.macro-trend-down {
  color: #fca5a5;
}

.macro-trend-flat {
  color: #f9dfa0;
}

.macro-trend-neutral {
  color: #d7d0c5;
}
```

- [ ] **Step 3: 반응형 스타일 추가**

Inside the existing `@media (max-width: 900px)` block, add:

```css
  .macro-regime-grid,
  .macro-modal-body {
    grid-template-columns: 1fr;
  }

  .macro-modal-nav {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(185, 177, 164, 0.14);
  }

  .macro-modal-nav span {
    flex: 0 0 auto;
  }
```

Inside the existing `@media (max-width: 560px)` block, add:

```css
  .macro-modal-backdrop {
    align-items: end;
    padding: 0;
  }

  .macro-modal {
    width: 100%;
    max-height: calc(100vh - 18px);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 8px 8px 0 0;
  }

  .macro-modal-header,
  .macro-modal-content {
    padding: 16px;
  }

  .macro-axis-mini-grid,
  .macro-axis-row,
  .macro-indicator-row {
    grid-template-columns: 1fr;
  }

  .macro-axis-row span:nth-child(3) {
    text-align: left;
  }
```

- [ ] **Step 4: 스타일 후 테스트 확인**

Run: `rtk npm test -- src/components/MacroRegimePage.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: 스타일 커밋**

```bash
rtk git add src/styles.css
rtk git commit -m "style: 매크로 레짐 팝업 스타일 추가"
```

---

### Task 6: 최종 검증

**Files:**
- Modify only if verification finds a concrete issue.

- [ ] **Step 1: 전체 테스트 실행**

Run: `rtk npm test`

Expected: all test files pass.

- [ ] **Step 2: 프로덕션 빌드 실행**

Run: `rtk npm run build`

Expected: TypeScript build and Vite build both succeed.

- [ ] **Step 3: 변경 상태 확인**

Run: `rtk git status --short --branch`

Expected: working tree is clean on `feature/macro-regime-cards`.

- [ ] **Step 4: 최종 상태 확인**

Run: `rtk git log --oneline -5`

Expected: Task 1부터 Task 5까지의 커밋이 최근 기록에 보이고, 검증 과정에서 추가 수정이 없으면 새 커밋을 만들지 않는다.

---

## 자체 검토

- 설계서의 데이터 조회 기준은 Task 2에서 `market`별 `updated_at` 내림차순 1건 조회로 반영한다.
- KR/US 절반 폭 카드와 기존 어두운 스타일은 Task 3, Task 5에서 반영한다.
- 팝업 상단 날짜만 노출하는 조건은 Task 3 테스트와 구현에 반영한다.
- 4축 판단의 `축명 - 판단 - 컨피던스` 순서는 Task 3, Task 5에서 반영한다.
- 핵심 지표 추세의 `↑ 상승`, `↓ 하락`, `→ 보합` 및 텍스트 색상만 적용하는 요구는 Task 1, Task 3, Task 5에서 반영한다.
- 자산 영향, 리스크, 전문 표시 요구는 Task 3에서 반영한다.
- 로딩, 빈 상태, 오류 상태는 Task 2와 Task 3에서 반영한다.
- 접근성 요구는 Task 3의 버튼, dialog, 닫기 동작으로 반영한다.
- 전체 테스트와 프로덕션 빌드는 Task 6에서 검증한다.
