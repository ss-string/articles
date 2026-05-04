# 랭킹 상세 팝업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 컨센서스 괴리율 랭킹 행 선택 시 내부 확장 행 대신 전역 상세 팝업을 열고, `ai_consensus_summary_reports`의 AI 분석 리포트를 함께 표시한다.

**Architecture:** 데이터 계층은 `krx_fnguide_consensus.fnguide_code`를 내부 `gicode`로 정규화하고, `ai_consensus_summary_reports.gicode`로 AI 리포트를 병합한다. UI 계층은 `ConsensusTable`을 선택 이벤트만 발생시키는 목록 컴포넌트로 바꾸고, `ConsensusRankingPage`가 URL 질의값과 선택 행 상태를 관리해 테이블 밖에서 `ConsensusDetailModal`을 렌더링한다.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Supabase JS

---

## 파일 구조

- 수정: `src/consensus/model.ts`
  - `gicode`, AI 리포트 타입, 목표주가 범위, 병합 함수, 현재가격 포함 체크포인트 모델을 책임진다.
- 수정: `src/consensus/api.ts`
  - 기존 컨센서스 테이블과 신규 AI 리포트 테이블 조회를 책임진다.
- 수정: `src/consensus/useConsensusRanking.ts`
  - 두 테이블 조회 결과를 받아 병합된 랭킹 상태를 만든다.
- 수정: `src/App.tsx`
  - 테스트 주입용 조회 함수 props를 컨센서스 행과 AI 리포트 행으로 확장한다.
- 수정: `src/components/ConsensusTable.tsx`
  - 행 선택 이벤트만 발생시키고 내부 확장 상세를 제거한다.
- 생성: `src/components/ConsensusDetailModal.tsx`
  - 가격 비교, 목표주가 범위, 컨센서스 가격 변화, AI 요약, 리스크, 증권사별 목표가를 전역 팝업으로 표시한다.
- 수정: `src/components/ConsensusTrendLine.tsx`
  - 현재가격 체크포인트와 목표주가 범위 점도표를 표시한다.
- 수정: `src/styles.css`
  - 전역 팝업, 리스크, 목표가 행, 차트 범위 점 스타일을 기존 어두운 톤에 맞춰 추가한다.
- 수정 테스트:
  - `src/consensus/model.test.ts`
  - `src/consensus/useConsensusRanking.test.tsx`
  - `src/components/ConsensusTable.test.tsx`
  - `src/components/ConsensusTrendLine.test.tsx`
  - `src/components/ConsensusDetailModal.test.tsx`
  - `src/App.test.tsx`

---

### Task 1: 데이터 모델과 병합 로직

**Files:**
- Modify: `src/consensus/model.ts`
- Test: `src/consensus/model.test.ts`

- [ ] **Step 1: 실패하는 모델 테스트 추가**

`src/consensus/model.test.ts`의 import에 `buildRankingRowsWithReports`를 추가하고, `describe('consensus model', ...)` 안에 아래 테스트를 추가한다.

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `rtk npm test -- src/consensus/model.test.ts`

Expected: FAIL. `buildRankingRowsWithReports`가 export되지 않았다는 오류와 `gicode`/`summaryReport` 필드 누락 오류가 보여야 한다.

- [ ] **Step 3: 모델 구현**

`src/consensus/model.ts`를 아래 구조로 갱신한다. 기존 함수 이름은 유지하고 새 타입과 병합 함수를 추가한다.

```ts
export type RawConsensusRow = Record<string, unknown>;
export type RawSummaryReportRow = Record<string, unknown>;

export type ConsensusCheckpoint = {
  label: '현재 가격' | '지난 6개월' | '지난 3개월' | '지난 1개월' | '현재 컨센서스';
  price: number | null;
  changePercent: number | null;
};

export type TargetPriceRange = {
  min: number | null;
  median: number | null;
  max: number | null;
};

export type SecuritiesFirmSummary = {
  name: string;
  reportCount: number;
  targetPrices: number[];
  recommendations: string[];
};

export type ConsensusSummaryReport = {
  gicode: string;
  companyName: string | null;
  updatedAt: string | null;
  tlDr: string | null;
  keyKeywords: string[];
  risks: string[];
  targetPriceRange: TargetPriceRange;
  securitiesFirmCount: number | null;
  securitiesFirms: SecuritiesFirmSummary[];
};

export type ConsensusRankingRow = {
  id: string;
  name: string;
  code: string | null;
  gicode: string | null;
  currentPrice: number;
  fairPrice: number;
  gapAmount: number;
  gapPercent: number;
  reportCount: number | null;
  oneMonthConsensusPrice: number | null;
  oneMonthConsensusChangePercent: number | null;
  threeMonthConsensusPrice: number | null;
  sixMonthConsensusPrice: number | null;
  checkpoints: ConsensusCheckpoint[];
  summaryReport: ConsensusSummaryReport | null;
};
```

기존 `columnCandidates`에 `gicode`와 `reportCount`를 추가한다.

```ts
const columnCandidates = {
  name: ['stock_name', 'name', 'isu_nm', 'isu_abbrv', 'corp_name', '종목명'],
  code: ['stock_code', 'code', 'isu_srt_cd', 'ticker', '종목코드'],
  gicode: ['gicode', 'fnguide_code'],
  reportCount: ['report_count', 'reportCount', '리포트수'],
  currentPrice: ['current_price_value', 'current_price', 'close_price', 'price', 'now_price', '현재가'],
  fairPrice: ['target_price_value', 'target_price', 'fair_price', 'consensus_price', '목표주가', '적정주가'],
  consensus1m: ['consensus_1m', 'target_price_1m', 'consensus_price_1m', '1개월컨센서스'],
  consensus3m: ['consensus_3m', 'target_price_3m', 'consensus_price_3m', '3개월컨센서스'],
  consensus6m: ['consensus_6m', 'target_price_6m', 'consensus_price_6m', '6개월컨센서스'],
} as const;
```

아래 helper를 추가한다.

```ts
function parseTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(parseText).filter((item): item is string => item !== null)
    : [];
}

function parseNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(parseNumber).filter((item): item is number => item !== null)
    : [];
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseSecuritiesFirms(value: unknown): SecuritiesFirmSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = parseRecord(item);
    const name = parseText(record?.name);

    if (!record || !name) {
      return [];
    }

    return [
      {
        name,
        reportCount: parseNumber(record.reportCount) ?? 0,
        targetPrices: parseNumberArray(record.targetPrices),
        recommendations: parseTextArray(record.recommendations),
      },
    ];
  });
}

export function normalizeSummaryReport(row: RawSummaryReportRow): ConsensusSummaryReport | null {
  const gicode = parseText(row.gicode);
  const analysis = parseRecord(row.analysis);

  if (!gicode) {
    return null;
  }

  const targetPriceRange = parseRecord(analysis?.targetPriceRange);

  return {
    gicode,
    companyName: parseText(row.co_nm) ?? parseText(analysis?.stockName),
    updatedAt: parseText(row.updated_at),
    tlDr: parseText(analysis?.['tl;dr']),
    keyKeywords: parseTextArray(analysis?.keyKeywords),
    risks: parseTextArray(analysis?.risks),
    targetPriceRange: {
      min: parseNumber(targetPriceRange?.min),
      median: parseNumber(targetPriceRange?.median),
      max: parseNumber(targetPriceRange?.max),
    },
    securitiesFirmCount: parseNumber(analysis?.securitiesFirmCount),
    securitiesFirms: parseSecuritiesFirms(analysis?.securitiesFirms),
  };
}
```

`normalizeConsensusRow`는 `gicode`, `reportCount`, 현재 가격 체크포인트, `summaryReport: null`을 반환하게 수정한다.

```ts
const gicode = parseText(readValue(row, columnCandidates.gicode));
const reportCount = parseNumber(readValue(row, columnCandidates.reportCount));

const checkpoints: ConsensusCheckpoint[] = [
  {
    label: '현재 가격',
    price: currentPrice,
    changePercent: null,
  },
  {
    label: '지난 6개월',
    price: sixMonthConsensusPrice,
    changePercent: calculateChangePercent(fairPrice, sixMonthConsensusPrice),
  },
  {
    label: '지난 3개월',
    price: threeMonthConsensusPrice,
    changePercent: calculateChangePercent(fairPrice, threeMonthConsensusPrice),
  },
  {
    label: '지난 1개월',
    price: oneMonthConsensusPrice,
    changePercent: calculateChangePercent(fairPrice, oneMonthConsensusPrice),
  },
  {
    label: '현재 컨센서스',
    price: fairPrice,
    changePercent: 0,
  },
];

return {
  id: gicode ?? code ?? name,
  name,
  code,
  gicode,
  currentPrice,
  fairPrice,
  gapAmount,
  gapPercent,
  reportCount,
  oneMonthConsensusPrice,
  oneMonthConsensusChangePercent: calculateChangePercent(fairPrice, oneMonthConsensusPrice),
  threeMonthConsensusPrice,
  sixMonthConsensusPrice,
  checkpoints,
  summaryReport: null,
};
```

새 병합 함수를 추가한다.

```ts
export function buildRankingRowsWithReports(
  rows: RawConsensusRow[],
  reportRows: RawSummaryReportRow[],
): ConsensusRankingRow[] {
  const reportsByGicode = new Map(
    reportRows
      .map(normalizeSummaryReport)
      .filter((report): report is ConsensusSummaryReport => report !== null)
      .map((report) => [report.gicode, report]),
  );

  return buildRankingRows(rows).map((row) => ({
    ...row,
    summaryReport: row.gicode ? reportsByGicode.get(row.gicode) ?? null : null,
  }));
}
```

- [ ] **Step 4: 모델 테스트 통과 확인**

Run: `rtk npm test -- src/consensus/model.test.ts`

Expected: PASS. 기존 체크포인트 기대값은 현재 가격 체크포인트 추가에 맞춰 갱신되어야 한다.

- [ ] **Step 5: 커밋**

```bash
rtk git add src/consensus/model.ts src/consensus/model.test.ts
rtk git commit -m "feat: 컨센서스 AI 리포트 모델 추가"
```

---

### Task 2: Supabase 조회와 hook 병합

**Files:**
- Modify: `src/consensus/api.ts`
- Modify: `src/consensus/useConsensusRanking.ts`
- Modify: `src/consensus/useConsensusRanking.test.tsx`
- Modify: `src/App.tsx`
- Test: `src/consensus/useConsensusRanking.test.tsx`

- [ ] **Step 1: 실패하는 hook 테스트 추가**

`src/consensus/useConsensusRanking.test.tsx`의 성공 테스트를 아래처럼 바꾼다.

```ts
it('loads consensus rows and AI reports from the provided query functions', async () => {
  const queryRows = vi.fn().mockResolvedValue([
    { stock_name: 'A', current_price: 10000, target_price: 12000, consensus_1m: 11000, fnguide_code: 'A000001' },
    { stock_name: 'B', current_price: 10000, target_price: 15000, consensus_1m: 12000, fnguide_code: 'A000002' },
  ]);
  const queryReports = vi.fn().mockResolvedValue([
    {
      gicode: 'A000002',
      co_nm: 'B',
      analysis: {
        'tl;dr': 'B 리포트 요약',
        targetPriceRange: { min: 14000, median: 15000, max: 16000 },
      },
      updated_at: '2026-05-04T08:24:38.946123+00:00',
    },
  ]);

  const { result } = renderHook(() => useConsensusRanking({ queryRows, queryReports }));

  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(result.current.rows.map((row) => row.name)).toEqual(['B', 'A']);
  expect(result.current.rows[0]?.summaryReport?.tlDr).toBe('B 리포트 요약');
  expect(queryRows).toHaveBeenCalledTimes(1);
  expect(queryReports).toHaveBeenCalledTimes(1);
});
```

실패 테스트도 아래처럼 queryReports 실패를 확인하도록 추가한다.

```ts
it('returns an error when the AI report query fails', async () => {
  const queryRows = vi.fn().mockResolvedValue([
    { stock_name: 'A', current_price: 10000, target_price: 12000 },
  ]);
  const queryReports = vi.fn().mockRejectedValue(new Error('report query failed'));

  const { result } = renderHook(() => useConsensusRanking({ queryRows, queryReports }));

  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.error).toBe('report query failed');
});
```

- [ ] **Step 2: 실패 확인**

Run: `rtk npm test -- src/consensus/useConsensusRanking.test.tsx`

Expected: FAIL. `queryReports` 옵션이 타입에 없거나 호출되지 않아야 한다.

- [ ] **Step 3: API 조회 함수 추가**

`src/consensus/api.ts`를 수정한다.

```ts
import { createClient } from '@supabase/supabase-js';
import type { RawConsensusRow, RawSummaryReportRow } from './model';

const consensusTableName = 'krx_fnguide_consensus';
const summaryReportsTableName = 'ai_consensus_summary_reports';
```

기존 `queryConsensusRows`는 `consensusTableName`을 사용하게 바꾸고, 아래 함수를 추가한다.

```ts
export async function querySummaryReportRows(): Promise<RawSummaryReportRow[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase.from(summaryReportsTableName).select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
```

- [ ] **Step 4: hook 병합 구현**

`src/consensus/useConsensusRanking.ts`를 수정한다.

```ts
import { queryConsensusRows, querySummaryReportRows } from './api';
import {
  buildRankingRowsWithReports,
  type ConsensusRankingRow,
  type RawConsensusRow,
  type RawSummaryReportRow,
} from './model';

type UseConsensusRankingOptions = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryReports?: () => Promise<RawSummaryReportRow[]>;
};
```

`load` 안의 조회 로직을 아래처럼 바꾼다.

```ts
const loadRows = options.queryRows ?? queryConsensusRows;
const loadReports = options.queryReports ?? querySummaryReportRows;

const [rawRows, rawReports] = await Promise.all([loadRows(), loadReports()]);
const rows = buildRankingRowsWithReports(rawRows, rawReports);
```

- [ ] **Step 5: App props 확장**

`src/App.tsx`의 타입과 호출부를 바꾼다.

```ts
import type { RawConsensusRow, RawSummaryReportRow } from './consensus/model';

type AppProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryReports?: () => Promise<RawSummaryReportRow[]>;
};

export default function App({ queryRows, queryReports }: AppProps) {
  // ...
  <ConsensusRankingPage queryRows={queryRows} queryReports={queryReports} />
  // ...
}
```

`src/components/ConsensusRankingPage.tsx`도 props를 확장한다.

```ts
import type { RawConsensusRow, RawSummaryReportRow } from '../consensus/model';

type ConsensusRankingPageProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryReports?: () => Promise<RawSummaryReportRow[]>;
};

export function ConsensusRankingPage({ queryRows, queryReports }: ConsensusRankingPageProps) {
  const state = useConsensusRanking({ queryRows, queryReports });
  // ...
}
```

- [ ] **Step 6: hook 테스트 통과 확인**

Run: `rtk npm test -- src/consensus/useConsensusRanking.test.tsx`

Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
rtk git add src/consensus/api.ts src/consensus/useConsensusRanking.ts src/consensus/useConsensusRanking.test.tsx src/App.tsx src/components/ConsensusRankingPage.tsx
rtk git commit -m "feat: AI 리포트 조회 병합"
```

---

### Task 3: 테이블을 선택 트리거로 전환

**Files:**
- Modify: `src/components/ConsensusTable.tsx`
- Modify: `src/components/ConsensusTable.test.tsx`
- Test: `src/components/ConsensusTable.test.tsx`

- [ ] **Step 1: 실패하는 테이블 테스트로 교체**

`src/components/ConsensusTable.test.tsx`에서 내부 확장 관련 테스트를 제거하고 아래 테스트를 추가한다. `makeRow`에는 `gicode`, `reportCount`, `summaryReport` 기본값을 추가한다.

```ts
it('calls onSelect when a row is clicked without rendering inline detail content', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const row = makeRow();

  render(<ConsensusTable rows={[row]} onSelect={onSelect} />);

  await user.click(screen.getByRole('row', { name: /삼성전자/ }));

  expect(onSelect).toHaveBeenCalledWith(row);
  expect(screen.queryByText('가격 비교')).not.toBeInTheDocument();
  expect(screen.queryByText('컨센서스 가격 변화')).not.toBeInTheDocument();
});

it('calls onSelect when Enter or Space is pressed on a row', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const row = makeRow();

  render(<ConsensusTable rows={[row]} onSelect={onSelect} />);

  const summaryRow = screen.getByRole('row', { name: /삼성전자/ });
  summaryRow.focus();
  await user.keyboard('{Enter}');
  await user.keyboard(' ');

  expect(onSelect).toHaveBeenCalledTimes(2);
});
```

`makeRow` 반환값에 아래 필드를 추가한다.

```ts
gicode: overrides.gicode ?? 'A005930',
reportCount: overrides.reportCount ?? 11,
summaryReport: overrides.summaryReport ?? null,
```

- [ ] **Step 2: 실패 확인**

Run: `rtk npm test -- src/components/ConsensusTable.test.tsx`

Expected: FAIL. `onSelect` prop이 없고 기존 내부 확장 상세가 렌더링된다.

- [ ] **Step 3: 테이블 구현 변경**

`src/components/ConsensusTable.tsx`에서 `useState`, `ConsensusTrendLine`, 내부 확장 렌더링을 제거한다.

props 타입을 바꾼다.

```ts
type ConsensusTableProps = {
  rows: ConsensusRankingRow[];
  onSelect: (row: ConsensusRankingRow) => void;
};
```

컴포넌트 시그니처와 행 이벤트를 바꾼다.

```tsx
export function ConsensusTable({ rows, onSelect }: ConsensusTableProps) {
  return (
    <section className="table-shell" role="table" aria-label="컨센서스 랭킹 테이블">
      <div className="table-head" role="row">
        <div role="columnheader">종목</div>
        <div role="columnheader">현재가</div>
        <div role="columnheader">적정주가</div>
        <div role="columnheader">갭</div>
        <div role="columnheader">지난 1개월 대비 컨센서스 증가</div>
      </div>
      {rows.map((row, index) => {
        const rowKey = `${row.id}-${index}`;

        return (
          <div className="rank-detail" key={rowKey} role="rowgroup">
            <div
              className="summary-row"
              role="row"
              tabIndex={0}
              onClick={() => onSelect(row)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(row);
                }
              }}
            >
              <div role="cell">
                <div className="stock-name">{row.name}</div>
                {row.code ? <div className="stock-code">{row.code}</div> : null}
              </div>
              <div className="price" role="cell">
                {formatWon(row.currentPrice)}
              </div>
              <div role="cell">
                <div className="price">{formatWon(row.fairPrice)}</div>
                <div className="muted">갭 {formatWon(row.gapAmount)}</div>
              </div>
              <div className={getGapClassName(row.gapPercent)} role="cell">
                {formatPercent(row.gapPercent)}
              </div>
              <div role="cell">
                <div className="gap-bar">
                  <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
                </div>
                <span className="consensus-badge">{formatOneMonthBadge(row.oneMonthConsensusChangePercent)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
```

렌더링에서 `aria-expanded`, `aria-controls`는 제거한다. 이 두 속성은 내부 확장 행을 제어할 때만 필요하며, 전역 팝업에서는 선택 이벤트만 필요하다.

- [ ] **Step 4: 테이블 테스트 통과 확인**

Run: `rtk npm test -- src/components/ConsensusTable.test.tsx`

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
rtk git add src/components/ConsensusTable.tsx src/components/ConsensusTable.test.tsx
rtk git commit -m "refactor: 랭킹 행 선택 이벤트 분리"
```

---

### Task 4: 전역 상세 팝업 컴포넌트

**Files:**
- Create: `src/components/ConsensusDetailModal.tsx`
- Create: `src/components/ConsensusDetailModal.test.tsx`
- Modify: `src/components/ConsensusTrendLine.tsx`
- Modify: `src/components/ConsensusTrendLine.test.tsx`
- Modify: `src/styles.css`
- Test: `src/components/ConsensusDetailModal.test.tsx`, `src/components/ConsensusTrendLine.test.tsx`

- [ ] **Step 1: 실패하는 팝업 테스트 작성**

`src/components/ConsensusDetailModal.test.tsx`를 만든다.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ConsensusRankingRow } from '../consensus/model';
import { ConsensusDetailModal } from './ConsensusDetailModal';

function makeRow(overrides: Partial<ConsensusRankingRow> = {}): ConsensusRankingRow {
  return {
    id: 'A128940',
    name: '한미약품',
    code: '128940',
    gicode: 'A128940',
    currentPrice: 445000,
    fairPrice: 657857,
    gapAmount: 212857,
    gapPercent: 47.8,
    reportCount: 11,
    oneMonthConsensusPrice: 620000,
    oneMonthConsensusChangePercent: 6.1,
    threeMonthConsensusPrice: 538333,
    sixMonthConsensusPrice: 477500,
    checkpoints: [
      { label: '현재 가격', price: 445000, changePercent: null },
      { label: '지난 6개월', price: 477500, changePercent: 37.8 },
      { label: '지난 3개월', price: 538333, changePercent: 22.2 },
      { label: '지난 1개월', price: 620000, changePercent: 6.1 },
      { label: '현재 컨센서스', price: 657857, changePercent: 0 },
    ],
    summaryReport: {
      gicode: 'A128940',
      companyName: '한미약품',
      updatedAt: '2026-05-04T08:24:38.946123+00:00',
      tlDr: '한미약품에 대한 컨센서스는 대부분 BUY 또는 매수로 우호적이다.',
      keyKeywords: ['R&D 모멘텀', 'MASH', '기술이전'],
      risks: ['1Q26 실적이 시장 기대치를 하회할 가능성'],
      targetPriceRange: { min: 560000, median: 660000, max: 720000 },
      securitiesFirmCount: 10,
      securitiesFirms: [
        { name: '메리츠증권', reportCount: 1, targetPrices: [620000], recommendations: ['BUY'] },
        { name: '다올투자증권', reportCount: 1, targetPrices: [720000], recommendations: ['BUY'] },
      ],
    },
    ...overrides,
  };
}

describe('ConsensusDetailModal', () => {
  it('renders price comparison, target range, trend, AI summary, risks, and firm targets', () => {
    render(<ConsensusDetailModal row={makeRow()} onClose={() => undefined} />);

    expect(screen.getByRole('dialog', { name: '한미약품 상세 분석' })).toBeInTheDocument();
    expect(screen.getByText(/컨센서스 리포트 11개 기반/)).toBeInTheDocument();
    expect(screen.queryByText(/FnGuide 리포트/)).not.toBeInTheDocument();
    expect(screen.getByText('가격 비교')).toBeInTheDocument();
    expect(screen.getByText('현재 가격')).toBeInTheDocument();
    expect(screen.getByText('목표주가 범위')).toBeInTheDocument();
    expect(screen.getByText('560,000원')).toBeInTheDocument();
    expect(screen.getByText('660,000원')).toBeInTheDocument();
    expect(screen.getByText('720,000원')).toBeInTheDocument();
    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
    expect(screen.getByText('AI 컨센서스 요약')).toBeInTheDocument();
    expect(screen.getByText(/대부분 BUY/)).toBeInTheDocument();
    expect(screen.getByText('R&D 모멘텀')).toBeInTheDocument();
    expect(screen.getByText('주요 리스크').closest('.detail-card')).toHaveClass('risk-card');
    expect(screen.getByText(/1Q26 실적/)).toBeInTheDocument();
    expect(screen.getByText('증권사별 목표가')).toBeInTheDocument();
    expect(screen.getByText('메리츠증권')).toBeInTheDocument();
    expect(screen.getByText('BUY · 1건')).toBeInTheDocument();
  });

  it('calls onClose from the close button and backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ConsensusDetailModal row={makeRow()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('detail-modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows an empty AI report state when no report is matched', () => {
    render(<ConsensusDetailModal row={makeRow({ summaryReport: null })} onClose={() => undefined} />);

    expect(screen.getByText('AI 분석 리포트가 없습니다.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `rtk npm test -- src/components/ConsensusDetailModal.test.tsx`

Expected: FAIL. `ConsensusDetailModal.tsx`가 없다.

- [ ] **Step 3: 팝업 컴포넌트 구현**

`src/components/ConsensusDetailModal.tsx`를 만든다.

```tsx
import { useEffect } from 'react';
import { formatPercent, formatWon, type ConsensusRankingRow, type SecuritiesFirmSummary } from '../consensus/model';
import { ConsensusTrendLine } from './ConsensusTrendLine';

type ConsensusDetailModalProps = {
  row: ConsensusRankingRow;
  onClose: () => void;
};

function formatGapDescription(gapAmount: number) {
  if (gapAmount > 0) {
    return `현재가가 적정주가 대비 ${formatWon(gapAmount)} 낮습니다.`;
  }

  if (gapAmount < 0) {
    return `현재가가 적정주가 대비 ${formatWon(Math.abs(gapAmount))} 높습니다.`;
  }

  return '현재가와 적정주가가 같습니다.';
}

function formatRecommendation(firm: SecuritiesFirmSummary) {
  const recommendation = firm.recommendations.find((item) => item.length > 0) ?? '-';
  return `${recommendation} · ${firm.reportCount.toLocaleString('ko-KR')}건`;
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ConsensusDetailModal({ row, onClose }: ConsensusDetailModalProps) {
  const report = row.summaryReport;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-layer" data-testid="detail-modal-backdrop" role="presentation" onClick={onClose}>
      <article
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">Content modal · {row.gicode ?? row.code ?? row.name}</span>
            <h2 id="detail-modal-title">{row.name} 상세 분석</h2>
            <p>
              {row.code ?? '-'} · 컨센서스 리포트 {row.reportCount?.toLocaleString('ko-KR') ?? '-'}개 기반 · AI 리포트
              업데이트 {formatUpdatedAt(report?.updatedAt ?? null)}
            </p>
          </div>
          <button className="close-button" type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="detail-grid">
            <article className="detail-card">
              <h3>가격 비교</h3>
              <div className="price-compare">
                <div className="price-tile">
                  <span>현재 가격</span>
                  <strong>{formatWon(row.currentPrice)}</strong>
                </div>
                <div className="price-tile">
                  <span>적정주가</span>
                  <strong>{formatWon(row.fairPrice)}</strong>
                </div>
              </div>
              <div className="gap-bar large">
                <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
              </div>
              <p className="muted">{formatGapDescription(row.gapAmount)}</p>
              <div className="target-range-inline">
                <h3>목표주가 범위</h3>
                <div className="range-grid">
                  <div>
                    <span>최저</span>
                    <strong>{formatWon(report?.targetPriceRange.min ?? null)}</strong>
                  </div>
                  <div>
                    <span>중앙값</span>
                    <strong>{formatWon(report?.targetPriceRange.median ?? null)}</strong>
                  </div>
                  <div>
                    <span>최고</span>
                    <strong>{formatWon(report?.targetPriceRange.max ?? null)}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h3>
                컨센서스 가격 변화
                <span className="consensus-badge">{formatPercent(row.oneMonthConsensusChangePercent)}</span>
              </h3>
              <ConsensusTrendLine checkpoints={row.checkpoints} targetPriceRange={report?.targetPriceRange ?? null} />
            </article>
          </div>

          {report ? (
            <div className="ai-grid">
              <div className="ai-left">
                <article className="detail-card ai-report">
                  <h3>AI 컨센서스 요약</h3>
                  <p>{report.tlDr ?? 'AI 컨센서스 요약이 없습니다.'}</p>
                  <div className="keyword-row">
                    {report.keyKeywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                </article>

                <article className="detail-card risk-card">
                  <h3>주요 리스크</h3>
                  <ul className="risk-list">
                    {report.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <article className="detail-card">
                <h3>증권사별 목표가</h3>
                <div className="firm-list">
                  {report.securitiesFirms.map((firm) => (
                    <div className="firm-row" key={firm.name}>
                      <span>{firm.name}</span>
                      <strong>{formatWon(firm.targetPrices[0] ?? null)}</strong>
                      <em>{formatRecommendation(firm)}</em>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <article className="detail-card ai-report">
              <h3>AI 컨센서스 요약</h3>
              <p>AI 분석 리포트가 없습니다.</p>
            </article>
          )}
        </div>
      </article>
    </div>
  );
}
```

- [ ] **Step 4: 차트 테스트 추가**

`src/components/ConsensusTrendLine.test.tsx`에 목표주가 범위와 현재가격 강조 테스트를 추가한다.

```tsx
it('renders current price checkpoint and target price range dots', () => {
  render(
    <ConsensusTrendLine
      checkpoints={[
        { label: '현재 가격', price: 445000, changePercent: null },
        { label: '지난 6개월', price: 477500, changePercent: 37.8 },
        { label: '지난 3개월', price: 538333, changePercent: 22.2 },
        { label: '지난 1개월', price: 620000, changePercent: 6.1 },
        { label: '현재 컨센서스', price: 657857, changePercent: 0 },
      ]}
      targetPriceRange={{ min: 560000, median: 660000, max: 720000 }}
    />,
  );

  expect(screen.getByText('현재 가격')).toBeInTheDocument();
  expect(screen.getByText('목표 범위')).toBeInTheDocument();
  expect(document.querySelectorAll('.range-dot')).toHaveLength(3);
  expect(document.querySelector('.current-price-checkpoint')).toBeInTheDocument();
});
```

- [ ] **Step 5: 차트 구현 변경**

`src/components/ConsensusTrendLine.tsx` props를 확장한다.

```ts
import { formatPercent, formatWon, type ConsensusCheckpoint, type TargetPriceRange } from '../consensus/model';

type ConsensusTrendLineProps = {
  checkpoints: ConsensusCheckpoint[];
  targetPriceRange?: TargetPriceRange | null;
};
```

`buildPoints`와 컴포넌트 내부 계산을 아래처럼 바꾼다.

```tsx
function getRangePrices(targetPriceRange: TargetPriceRange | null | undefined) {
  if (!targetPriceRange) {
    return [];
  }

  return [targetPriceRange.min, targetPriceRange.median, targetPriceRange.max].filter(
    (price): price is number => price !== null,
  );
}

function buildChartScale(checkpoints: ConsensusCheckpoint[], targetPriceRange: TargetPriceRange | null | undefined) {
  const validPrices = [
    ...checkpoints.map((checkpoint) => checkpoint.price),
    ...getRangePrices(targetPriceRange),
  ].filter((price): price is number => price !== null);
  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  const range = max - min || 1;

  return {
    toY(price: number) {
      return 174 - ((price - min) / range) * 126;
    },
  };
}

function buildPoints(checkpoints: ConsensusCheckpoint[], targetPriceRange: TargetPriceRange | null | undefined) {
  const scale = buildChartScale(checkpoints, targetPriceRange);
  const xByLabel: Record<ConsensusCheckpoint['label'], number> = {
    '현재 가격': 36,
    '지난 6개월': 158,
    '지난 3개월': 280,
    '지난 1개월': 402,
    '현재 컨센서스': 486,
  };

  return checkpoints.flatMap((checkpoint) => {
    if (checkpoint.price === null) {
      return [];
    }

    return [{ ...checkpoint, x: xByLabel[checkpoint.label], y: scale.toY(checkpoint.price) }];
  });
}
```

`ConsensusTrendLine` 본문은 아래 핵심 구조를 사용한다.

```tsx
export function ConsensusTrendLine({ checkpoints, targetPriceRange = null }: ConsensusTrendLineProps) {
  const points = buildPoints(checkpoints, targetPriceRange);
  const currentPoint = points.find((point) => point.label === '현재 가격') ?? null;
  const consensusPoints = points.filter((point) => point.label !== '현재 가격');
  const path = consensusPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const scale = buildChartScale(checkpoints, targetPriceRange);
  const rangeDots = targetPriceRange
    ? [
        { label: '최저', price: targetPriceRange.min },
        { label: '중앙', price: targetPriceRange.median },
        { label: '최고', price: targetPriceRange.max },
      ].filter((item): item is { label: string; price: number } => item.price !== null)
    : [];

  return (
    <div className="trend-card">
      <div className="line-chart" role="img" aria-label="컨센서스 가격 선 그래프">
        <svg viewBox="0 0 560 232" aria-hidden="true">
          <path d="M0 174 L560 174" className="chart-grid" />
          <path d="M0 124 L560 124" className="chart-grid" />
          <path d="M0 74 L560 74" className="chart-grid" />
          {currentPoint ? <path d={`M0 ${currentPoint.y} L560 ${currentPoint.y}`} className="current-line" /> : null}
          {consensusPoints.length >= 2 ? <path d={path} className="chart-line" /> : null}
          {currentPoint ? <circle cx={currentPoint.x} cy={currentPoint.y} r="5" className="current-point" /> : null}
          {consensusPoints.map((point) => (
            <g key={point.label}>
              <line x1={point.x} x2={point.x} y1={point.y} y2="204" className="chart-guide" />
              <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            </g>
          ))}
          {rangeDots.length > 0 ? (
            <g>
              <line
                x1="530"
                x2="530"
                y1={Math.min(...rangeDots.map((dot) => scale.toY(dot.price)))}
                y2={Math.max(...rangeDots.map((dot) => scale.toY(dot.price)))}
                className="range-stem"
              />
              {rangeDots.map((dot) => (
                <circle className="range-dot" cx="530" cy={scale.toY(dot.price)} key={dot.label} r="5" />
              ))}
            </g>
          ) : null}
          {rangeDots.length > 0 ? (
            <text className="chart-label" x="530" y="222" textAnchor="middle">
              목표 범위
            </text>
          ) : null}
        </svg>
      </div>
      <div className="checkpoint-row">
        {checkpoints.map((checkpoint) => (
          <div
            className={`checkpoint${checkpoint.label === '현재 가격' ? ' current-price-checkpoint' : ''}`}
            key={checkpoint.label}
          >
            <span>{checkpoint.label}</span>
            <strong>{formatWon(checkpoint.price)}</strong>
            <em>{checkpoint.label === '현재 컨센서스' ? '기준값' : formatPercent(checkpoint.changePercent)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 스타일 추가**

`src/styles.css`에 목업에서 확정한 클래스들을 추가한다.

```css
.modal-layer {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 28px;
  background: rgba(0, 0, 0, 0.54);
  backdrop-filter: blur(10px);
}

.detail-modal {
  width: min(980px, 100%);
  max-height: calc(100vh - 56px);
  overflow: auto;
  border: 1px solid rgba(185, 177, 164, 0.22);
  border-radius: 8px;
  background: rgba(31, 29, 27, 0.98);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.5);
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid rgba(185, 177, 164, 0.16);
  background: rgba(31, 29, 27, 0.96);
}

.modal-header h2 {
  margin: 4px 0 8px;
  color: #fffaf0;
  font-size: 1.55rem;
}

.modal-header p {
  margin: 0;
  color: #b9b1a4;
}

.close-button {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(185, 177, 164, 0.22);
  border-radius: 8px;
  background: rgba(10, 10, 9, 0.36);
  color: #f3efe6;
  cursor: pointer;
}

.modal-body,
.ai-left,
.firm-list {
  display: grid;
  gap: 12px;
}

.modal-body {
  padding: 20px 24px 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.76fr) minmax(440px, 1.24fr);
  gap: 12px;
}

.target-range-inline {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(185, 177, 164, 0.16);
}

.range-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.range-grid div,
.firm-row {
  border: 1px solid rgba(185, 177, 164, 0.18);
  border-radius: 8px;
  background: rgba(10, 10, 9, 0.24);
  padding: 10px;
}

.range-grid span,
.firm-row span,
.firm-row em {
  display: block;
  color: #b9b1a4;
  font-size: 11px;
  font-style: normal;
}

.range-grid strong,
.firm-row strong {
  display: block;
  color: #fffaf0;
  font-size: 13px;
  white-space: nowrap;
}

.ai-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.52fr);
  gap: 12px;
  align-items: start;
}

.ai-report {
  border-color: rgba(45, 212, 191, 0.26);
  background: rgba(45, 212, 191, 0.07);
}

.ai-report p {
  color: #d7d0c5;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.keyword-row span {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(246, 196, 83, 0.12);
  color: #f9dfa0;
  font-size: 0.78rem;
}

.risk-card {
  border-color: rgba(248, 113, 113, 0.34);
  background: rgba(127, 29, 29, 0.18);
}

.risk-card h3,
.risk-list {
  color: #fecaca;
}

.risk-list {
  margin: 0;
  padding-left: 18px;
}

.risk-list li + li {
  margin-top: 6px;
}

.risk-list li::marker {
  color: #f87171;
}

.firm-list {
  max-height: 520px;
  overflow: auto;
  padding-right: 2px;
  gap: 8px;
}

.firm-row {
  display: grid;
  grid-template-columns: minmax(82px, 0.9fr) minmax(92px, 0.9fr) minmax(68px, 0.62fr);
  gap: 6px;
  align-items: center;
}

.firm-row em {
  text-align: right;
  white-space: nowrap;
}

.current-line {
  fill: none;
  stroke: #f87171;
  stroke-dasharray: 5 6;
  stroke-linecap: round;
  stroke-width: 2;
}

.current-point {
  fill: #151413;
  stroke: #f87171;
  stroke-width: 3;
}

.range-stem {
  stroke: #f9dfa0;
  stroke-linecap: round;
  stroke-width: 3;
}

.range-dot {
  fill: #151413;
  stroke: #f9dfa0;
  stroke-width: 3;
}

.current-price-checkpoint {
  border-color: rgba(248, 113, 113, 0.34);
  background: rgba(127, 29, 29, 0.18);
}

.current-price-checkpoint strong,
.current-price-checkpoint span,
.current-price-checkpoint em {
  color: #fecaca;
}

@media (max-width: 900px) {
  .modal-layer {
    align-items: end;
    padding: 0;
  }

  .detail-modal {
    max-height: 90vh;
    border-radius: 8px 8px 0 0;
  }

  .detail-grid,
  .ai-grid,
  .range-grid {
    grid-template-columns: 1fr;
  }

  .firm-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: 팝업과 차트 테스트 통과 확인**

Run:

```bash
rtk npm test -- src/components/ConsensusDetailModal.test.tsx src/components/ConsensusTrendLine.test.tsx
```

Expected: PASS.

- [ ] **Step 8: 커밋**

```bash
rtk git add src/components/ConsensusDetailModal.tsx src/components/ConsensusDetailModal.test.tsx src/components/ConsensusTrendLine.tsx src/components/ConsensusTrendLine.test.tsx src/styles.css
rtk git commit -m "feat: 랭킹 상세 전역 팝업 추가"
```

---

### Task 5: 페이지 상태, URL 질의값, 앱 통합

**Files:**
- Modify: `src/components/ConsensusRankingPage.tsx`
- Modify: `src/App.test.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: 실패하는 앱 통합 테스트 작성**

`src/App.test.tsx`의 rows에 `fnguide_code`를 추가하고, `reports` fixture를 추가한다.

```ts
const reports = [
  {
    gicode: 'A005930',
    co_nm: '삼성전자',
    updated_at: '2026-05-04T08:24:38.946123+00:00',
    analysis: {
      'tl;dr': '삼성전자 컨센서스는 우호적이다.',
      keyKeywords: ['메모리', 'AI'],
      risks: ['업황 둔화 가능성'],
      targetPriceRange: { min: 90000, median: 100200, max: 110000 },
      securitiesFirmCount: 2,
      securitiesFirms: [
        { name: '테스트증권', reportCount: 1, targetPrices: [100200], recommendations: ['BUY'] },
      ],
    },
  },
];
```

기존 확장 테스트를 전역 팝업 테스트로 바꾼다.

```ts
it('opens a global detail popup with AI report data when a ranking row is selected', async () => {
  const user = userEvent.setup();
  render(<App queryRows={async () => rows} queryReports={async () => reports} />);

  await screen.findByText('삼성전자');
  await user.click(screen.getByRole('row', { name: /삼성전자/ }));

  expect(screen.getByRole('dialog', { name: '삼성전자 상세 분석' })).toBeInTheDocument();
  expect(screen.getByText('가격 비교')).toBeInTheDocument();
  expect(screen.getByText('목표주가 범위')).toBeInTheDocument();
  expect(screen.getByText('AI 컨센서스 요약')).toBeInTheDocument();
  expect(screen.getByText('삼성전자 컨센서스는 우호적이다.')).toBeInTheDocument();
  expect(screen.getByText('주요 리스크').closest('.detail-card')).toHaveClass('risk-card');
  expect(screen.queryByText(/URL 상태 예시/)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '닫기' }));
  expect(screen.queryByRole('dialog', { name: '삼성전자 상세 분석' })).not.toBeInTheDocument();
});

it('opens the matching detail popup from URL query parameters', async () => {
  window.history.pushState(
    {},
    '',
    '/?contentType=consensus&contentParams=%7B%22gicode%22%3A%22A005930%22%7D',
  );

  render(<App queryRows={async () => rows} queryReports={async () => reports} />);

  expect(await screen.findByRole('dialog', { name: '삼성전자 상세 분석' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

Run: `rtk npm test -- src/App.test.tsx`

Expected: FAIL. `ConsensusRankingPage`가 선택 상태와 팝업을 아직 관리하지 않는다.

- [ ] **Step 3: 페이지 상태 구현**

`src/components/ConsensusRankingPage.tsx`를 수정한다.

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { ConsensusRankingRow, RawConsensusRow, RawSummaryReportRow } from '../consensus/model';
import { useConsensusRanking } from '../consensus/useConsensusRanking';
import { ConsensusDetailModal } from './ConsensusDetailModal';
import { ConsensusTable } from './ConsensusTable';
import { SummaryCards } from './SummaryCards';

type ConsensusRankingPageProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryReports?: () => Promise<RawSummaryReportRow[]>;
};

function readSelectedGicodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('contentType') !== 'consensus') {
    return null;
  }

  const contentParams = params.get('contentParams');
  if (!contentParams) {
    return null;
  }

  try {
    const parsed = JSON.parse(contentParams) as { gicode?: unknown };
    return typeof parsed.gicode === 'string' ? parsed.gicode : null;
  } catch {
    return null;
  }
}

function writeSelectedGicodeToUrl(gicode: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('contentType', 'consensus');
  url.searchParams.set('contentParams', JSON.stringify({ gicode }));
  window.history.pushState({}, '', url);
}

function clearSelectedGicodeFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('contentType');
  url.searchParams.delete('contentParams');
  window.history.replaceState({}, '', url);
}
```

컴포넌트 내부에 선택 상태를 추가한다.

```tsx
const [selectedGicode, setSelectedGicode] = useState<string | null>(() => readSelectedGicodeFromUrl());
const selectedRow = useMemo(
  () => state.rows.find((row) => row.gicode === selectedGicode) ?? null,
  [state.rows, selectedGicode],
);

useEffect(() => {
  function handlePopState() {
    setSelectedGicode(readSelectedGicodeFromUrl());
  }

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);

function handleSelect(row: ConsensusRankingRow) {
  if (!row.gicode) {
    setSelectedGicode(null);
    return;
  }

  setSelectedGicode(row.gicode);
  writeSelectedGicodeToUrl(row.gicode);
}

function handleCloseDetail() {
  setSelectedGicode(null);
  clearSelectedGicodeFromUrl();
}
```

`ConsensusTable` 호출과 팝업 렌더링을 바꾼다.

```tsx
<ConsensusTable rows={state.rows} onSelect={handleSelect} />
{selectedRow ? <ConsensusDetailModal row={selectedRow} onClose={handleCloseDetail} /> : null}
```

- [ ] **Step 4: 앱 통합 테스트 통과 확인**

Run: `rtk npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
rtk git add src/components/ConsensusRankingPage.tsx src/App.test.tsx
rtk git commit -m "feat: 랭킹 상세 팝업 상태 연결"
```

---

### Task 6: 전체 검증과 문서 정리

**Files:**
- Modify: `README.md`
- Test: 전체 테스트와 빌드

- [ ] **Step 1: README에 AI 리포트 테이블 설명 추가**

`README.md`의 데이터 설명에 아래 내용을 추가한다.

```md
랭킹 상세 팝업은 `krx_fnguide_consensus.fnguide_code`와 `ai_consensus_summary_reports.gicode`를 매칭해 AI 컨센서스 요약, 주요 리스크, 목표주가 범위, 증권사별 목표가를 함께 표시합니다.
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `rtk npm test`

Expected: PASS. 모든 테스트 파일이 통과해야 한다.

- [ ] **Step 3: 빌드 실행**

Run: `rtk npm run build`

Expected: PASS. TypeScript 빌드와 Vite 빌드가 모두 성공해야 한다.

- [ ] **Step 4: git 상태 확인**

Run: `rtk git status --short`

Expected: README 변경만 남아 있거나, 모든 구현 파일이 이전 task 커밋에 포함되어 있어야 한다.

- [ ] **Step 5: 커밋**

```bash
rtk git add README.md
rtk git commit -m "docs: 랭킹 상세 AI 리포트 설명 추가"
```

- [ ] **Step 6: 최종 상태 확인**

Run:

```bash
rtk git status --short --branch
rtk git log --oneline -6
```

Expected: 작업 브랜치가 `feature/ranking-popup-details`이고, 구현 커밋들이 최신 로그에 보인다.

---

## 자체 검토

- 설계 범위 대응: 데이터 조회와 병합은 Task 1-2, 행 내부 확장 제거는 Task 3, 전역 팝업과 목업 확정 UI는 Task 4, URL 질의값 상태는 Task 5, 전체 검증은 Task 6에서 다룬다.
- 누락 방지: 리포트 없음 상태, 주요 리스크 붉은 계통 스타일, 증권사별 목표가 한 줄 행, 가격 비교 박스 안 목표주가 범위, 현재가격 체크포인트, 목표 범위 점도표가 모두 task에 포함되어 있다.
- 타입 일관성: 내부 키는 `gicode`, AI 리포트 모델은 `summaryReport`, 목표가 범위는 `targetPriceRange`, 증권사 목록은 `securitiesFirms`로 통일한다.
