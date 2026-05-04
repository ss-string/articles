# KRX FnGuide 컨센서스 랭킹 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase의 `krx_fnguide_consensus` 테이블을 조회해 현재가 대비 적정주가 괴리율이 큰 종목부터 보여주는 확장 row 기반 랭킹 지면을 만든다.

**Architecture:** Vite React TypeScript SPA로 구현한다. Supabase 조회 계층, row 정규화/계산 계층, UI component 계층을 분리하고, 정규화와 정렬 로직은 순수 함수로 테스트한다. 화면은 로딩/빈 상태/오류 상태를 포함하며, row 확장 시 가격 비교와 체크포인트 가격이 붙은 선 그래프를 보여준다.

**Tech Stack:** React, TypeScript, Vite, Supabase JS, Vitest, React Testing Library, CSS.

---

## File Structure

- Create `package.json`: Vite, React, Supabase, test scripts와 의존성 정의.
- Create `index.html`: Vite HTML entry.
- Create `vite.config.ts`: React plugin, `/articles/` base, Vitest jsdom 설정.
- Create `tsconfig.json`, `tsconfig.node.json`: TypeScript strict 설정.
- Create `src/main.tsx`: React root bootstrap.
- Create `src/setupTests.ts`: Testing Library matcher 설정.
- Create `src/consensus/model.ts`: raw row 정규화, 숫자 parsing, 괴리율/증가율 계산, 정렬 함수.
- Create `src/consensus/model.test.ts`: 정규화와 계산 단위 테스트.
- Create `src/consensus/api.ts`: Supabase client 생성과 table query 함수.
- Create `src/consensus/useConsensusRanking.ts`: 조회 상태 관리 hook.
- Create `src/consensus/useConsensusRanking.test.tsx`: hook loading/success/error 테스트.
- Create `src/components/ConsensusRankingPage.tsx`: 지면 composition.
- Create `src/components/ConsensusTable.tsx`: 랭킹 table과 확장 row.
- Create `src/components/ConsensusTrendLine.tsx`: 체크포인트 가격 label이 있는 선 그래프.
- Create `src/components/SummaryCards.tsx`: 요약 카드.
- Create `src/App.tsx`: 앱 entry component.
- Create `src/App.test.tsx`: 주요 렌더링과 확장 동작 테스트.
- Create `src/styles.css`: 금융 dashboard 스타일과 반응형 레이아웃.
- Modify `README.md`: 개발, 테스트, 빌드, 환경변수 설명.

## Task 1: Vite React 앱 스캐폴드

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/setupTests.ts`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: 프로젝트 설정 파일 작성**

Create `package.json`:

```json
{
  "name": "articles",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Vite entry 파일 작성**

Create `index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KRX FnGuide Consensus Ranking</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/setupTests.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Create minimal `src/App.tsx`:

```tsx
export default function App() {
  return <main>컨센서스 괴리율 랭킹</main>;
}
```

Create minimal `src/styles.css`:

```css
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #172033;
  background: #f5f7fb;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: #f5f7fb;
}
```

- [ ] **Step 3: TypeScript와 Vite 설정 작성**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/articles/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: 의존성 설치**

Run:

```bash
rtk npm install
```

Expected: `node_modules/`와 `package-lock.json`가 생성되고 install이 실패하지 않는다.

- [ ] **Step 5: 기본 build 확인**

Run:

```bash
rtk npm run build
```

Expected: TypeScript compile과 Vite build가 통과하고 `dist/`가 생성된다.

- [ ] **Step 6: 스캐폴드 커밋**

Run:

```bash
rtk git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/setupTests.ts src/App.tsx src/styles.css
rtk git commit -m "chore: scaffold consensus ranking app"
```

## Task 2: 컨센서스 row 정규화와 계산 로직

**Files:**
- Create: `src/consensus/model.ts`
- Create: `src/consensus/model.test.ts`

- [ ] **Step 1: 실패하는 단위 테스트 작성**

Create `src/consensus/model.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run:

```bash
rtk npm test -- src/consensus/model.test.ts
```

Expected: FAIL because `src/consensus/model.ts` does not exist.

- [ ] **Step 3: 정규화와 계산 구현**

Create `src/consensus/model.ts`:

```ts
export type RawConsensusRow = Record<string, unknown>;

export type ConsensusCheckpoint = {
  label: '지난 6개월' | '지난 3개월' | '지난 1개월' | '현재 컨센서스';
  price: number | null;
  changePercent: number | null;
};

export type ConsensusRankingRow = {
  id: string;
  name: string;
  code: string | null;
  currentPrice: number;
  fairPrice: number;
  gapAmount: number;
  gapPercent: number;
  oneMonthConsensusPrice: number | null;
  oneMonthConsensusChangePercent: number | null;
  threeMonthConsensusPrice: number | null;
  sixMonthConsensusPrice: number | null;
  checkpoints: ConsensusCheckpoint[];
};

const columnCandidates = {
  name: ['stock_name', 'name', 'isu_nm', 'isu_abbrv', 'corp_name', '종목명'],
  code: ['stock_code', 'code', 'isu_srt_cd', 'ticker', '종목코드'],
  currentPrice: ['current_price', 'close_price', 'price', 'now_price', '현재가'],
  fairPrice: ['target_price', 'fair_price', 'consensus_price', '목표주가', '적정주가'],
  consensus1m: ['consensus_1m', 'target_price_1m', 'consensus_price_1m', '1개월컨센서스'],
  consensus3m: ['consensus_3m', 'target_price_3m', 'consensus_price_3m', '3개월컨센서스'],
  consensus6m: ['consensus_6m', 'target_price_6m', 'consensus_price_6m', '6개월컨센서스'],
} as const;

function readValue(row: RawConsensusRow, candidates: readonly string[]) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replaceAll(',', '').replace('%', '').trim();
    if (normalized.length === 0) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function calculateChangePercent(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

export function normalizeConsensusRow(row: RawConsensusRow): ConsensusRankingRow | null {
  const name = parseText(readValue(row, columnCandidates.name));
  const code = parseText(readValue(row, columnCandidates.code));
  const currentPrice = parseNumber(readValue(row, columnCandidates.currentPrice));
  const fairPrice = parseNumber(readValue(row, columnCandidates.fairPrice));
  const oneMonthConsensusPrice = parseNumber(readValue(row, columnCandidates.consensus1m));
  const threeMonthConsensusPrice = parseNumber(readValue(row, columnCandidates.consensus3m));
  const sixMonthConsensusPrice = parseNumber(readValue(row, columnCandidates.consensus6m));

  if (!name || currentPrice === null || currentPrice <= 0 || fairPrice === null || fairPrice <= 0) {
    return null;
  }

  const gapAmount = fairPrice - currentPrice;
  const gapPercent = (gapAmount / currentPrice) * 100;

  const checkpoints: ConsensusCheckpoint[] = [
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
    id: code ?? name,
    name,
    code,
    currentPrice,
    fairPrice,
    gapAmount,
    gapPercent,
    oneMonthConsensusPrice,
    oneMonthConsensusChangePercent: calculateChangePercent(fairPrice, oneMonthConsensusPrice),
    threeMonthConsensusPrice,
    sixMonthConsensusPrice,
    checkpoints,
  };
}

export function buildRankingRows(rows: RawConsensusRow[]): ConsensusRankingRow[] {
  return rows
    .map(normalizeConsensusRow)
    .filter((row): row is ConsensusRankingRow => row !== null)
    .sort((a, b) => b.gapPercent - a.gapPercent);
}

export function formatWon(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run:

```bash
rtk npm test -- src/consensus/model.test.ts
```

Expected: PASS.

- [ ] **Step 5: 정규화 로직 커밋**

Run:

```bash
rtk git add src/consensus/model.ts src/consensus/model.test.ts
rtk git commit -m "feat: add consensus ranking model"
```

## Task 3: Supabase 조회 hook

**Files:**
- Create: `src/consensus/api.ts`
- Create: `src/consensus/useConsensusRanking.ts`
- Create: `src/consensus/useConsensusRanking.test.tsx`

- [ ] **Step 1: 실패하는 hook 테스트 작성**

Create `src/consensus/useConsensusRanking.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useConsensusRanking } from './useConsensusRanking';

describe('useConsensusRanking', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns an environment error when Supabase variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { result } = renderHook(() => useConsensusRanking());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Supabase 환경변수가 설정되지 않았습니다.');
  });

  it('loads and ranks rows from the provided query function', async () => {
    const queryRows = vi.fn().mockResolvedValue([
      { stock_name: 'A', current_price: 10000, target_price: 12000, consensus_1m: 11000 },
      { stock_name: 'B', current_price: 10000, target_price: 15000, consensus_1m: 12000 },
    ]);

    const { result } = renderHook(() => useConsensusRanking({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.rows.map((row) => row.name)).toEqual(['B', 'A']);
  });

  it('returns an error when the query fails', async () => {
    const queryRows = vi.fn().mockRejectedValue(new Error('network failed'));

    const { result } = renderHook(() => useConsensusRanking({ queryRows }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network failed');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run:

```bash
rtk npm test -- src/consensus/useConsensusRanking.test.tsx
```

Expected: FAIL because `useConsensusRanking.ts` does not exist.

- [ ] **Step 3: Supabase query 함수 작성**

Create `src/consensus/api.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import type { RawConsensusRow } from './model';

const tableName = 'krx_fnguide_consensus';

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export async function queryConsensusRows(): Promise<RawConsensusRow[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createClient(url, publishableKey);
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
```

- [ ] **Step 4: hook 구현**

Create `src/consensus/useConsensusRanking.ts`:

```ts
import { useEffect, useState } from 'react';
import { queryConsensusRows } from './api';
import { buildRankingRows, type ConsensusRankingRow, type RawConsensusRow } from './model';

type RankingState =
  | { status: 'loading'; rows: ConsensusRankingRow[]; error: null }
  | { status: 'success'; rows: ConsensusRankingRow[]; error: null }
  | { status: 'error'; rows: ConsensusRankingRow[]; error: string };

type UseConsensusRankingOptions = {
  queryRows?: () => Promise<RawConsensusRow[]>;
};

export function useConsensusRanking(options: UseConsensusRankingOptions = {}): RankingState {
  const [state, setState] = useState<RankingState>({
    status: 'loading',
    rows: [],
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryConsensusRows;

    async function load() {
      setState({ status: 'loading', rows: [], error: null });

      try {
        const rawRows = await loadRows();
        const rows = buildRankingRows(rawRows);

        if (isMounted) {
          setState({ status: 'success', rows, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            rows: [],
            error: error instanceof Error ? error.message : '컨센서스 데이터를 불러오지 못했습니다.',
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

Run:

```bash
rtk npm test -- src/consensus/useConsensusRanking.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Supabase 조회 계층 커밋**

Run:

```bash
rtk git add src/consensus/api.ts src/consensus/useConsensusRanking.ts src/consensus/useConsensusRanking.test.tsx
rtk git commit -m "feat: load consensus rows from Supabase"
```

## Task 4: 랭킹 UI와 확장 row

**Files:**
- Create: `src/components/ConsensusRankingPage.tsx`
- Create: `src/components/ConsensusTable.tsx`
- Create: `src/components/ConsensusTrendLine.tsx`
- Create: `src/components/SummaryCards.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: 실패하는 렌더링 테스트 작성**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const rows = [
  {
    stock_name: '삼성전자',
    stock_code: '005930',
    current_price: 72400,
    target_price: 100200,
    consensus_1m: 93800,
    consensus_3m: 96300,
    consensus_6m: 91300,
  },
  {
    stock_name: '현대차',
    stock_code: '005380',
    current_price: 244000,
    target_price: 318000,
    consensus_1m: 303400,
    consensus_3m: 296600,
    consensus_6m: 307200,
  },
];

describe('App', () => {
  it('renders ranked consensus rows with required fields', async () => {
    render(<App queryRows={async () => rows} />);

    expect(await screen.findByRole('heading', { name: '컨센서스 괴리율 랭킹' })).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText('72,400원')).toBeInTheDocument();
    expect(screen.getByText('100,200원')).toBeInTheDocument();
    expect(screen.getByText('+38.4%')).toBeInTheDocument();
    expect(screen.getByText('지난 1개월 대비 컨센서스 증가')).toBeInTheDocument();
  });

  it('expands a row and shows checkpoint prices on the line chart', async () => {
    const user = userEvent.setup();
    render(<App queryRows={async () => rows} />);

    const samsungSummary = await screen.findByRole('button', { name: /삼성전자 상세 열기/i });
    await user.click(samsungSummary);

    expect(screen.getByText('컨센서스 가격 변화')).toBeInTheDocument();
    expect(screen.getByText('91,300원')).toBeInTheDocument();
    expect(screen.getByText('96,300원')).toBeInTheDocument();
    expect(screen.getByText('93,800원')).toBeInTheDocument();
    expect(screen.getByText('현재 컨센서스')).toBeInTheDocument();
  });

  it('renders an empty state when there are no valid rows', async () => {
    render(<App queryRows={async () => []} />);

    expect(await screen.findByText('표시할 컨센서스 데이터가 없습니다.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run:

```bash
rtk npm test -- src/App.test.tsx
```

Expected: FAIL because components and `App` props are not implemented.

- [ ] **Step 3: 요약 카드 component 작성**

Create `src/components/SummaryCards.tsx`:

```tsx
import { formatPercent, type ConsensusRankingRow } from '../consensus/model';

type SummaryCardsProps = {
  rows: ConsensusRankingRow[];
};

export function SummaryCards({ rows }: SummaryCardsProps) {
  const maxGap = rows[0]?.gapPercent ?? null;
  const averageGap =
    rows.length === 0 ? null : rows.reduce((sum, row) => sum + row.gapPercent, 0) / rows.length;
  const oneMonthUpCount = rows.filter(
    (row) => row.oneMonthConsensusChangePercent !== null && row.oneMonthConsensusChangePercent > 0,
  ).length;

  return (
    <section className="summary-grid" aria-label="컨센서스 요약">
      <article className="summary-card">
        <span>최대 상승 여력</span>
        <strong>{formatPercent(maxGap)}</strong>
      </article>
      <article className="summary-card">
        <span>평균 괴리율</span>
        <strong>{formatPercent(averageGap)}</strong>
      </article>
      <article className="summary-card">
        <span>1개월 상향 종목</span>
        <strong>{oneMonthUpCount.toLocaleString('ko-KR')}</strong>
      </article>
      <article className="summary-card">
        <span>표시 종목</span>
        <strong>{rows.length.toLocaleString('ko-KR')}</strong>
      </article>
    </section>
  );
}
```

- [ ] **Step 4: 선 그래프 component 작성**

Create `src/components/ConsensusTrendLine.tsx`:

```tsx
import { formatPercent, formatWon, type ConsensusCheckpoint } from '../consensus/model';

type ConsensusTrendLineProps = {
  checkpoints: ConsensusCheckpoint[];
};

function buildPoints(checkpoints: ConsensusCheckpoint[]) {
  const validPrices = checkpoints
    .map((checkpoint) => checkpoint.price)
    .filter((price): price is number => price !== null);
  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  const range = max - min || 1;

  return checkpoints.map((checkpoint, index) => {
    const x = 36 + index * 168;
    const price = checkpoint.price ?? min;
    const y = 154 - ((price - min) / range) * 106;
    return { ...checkpoint, x, y };
  });
}

export function ConsensusTrendLine({ checkpoints }: ConsensusTrendLineProps) {
  const points = buildPoints(checkpoints);
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="trend-card">
      <div className="line-chart" aria-label="컨센서스 가격 선 그래프">
        <svg viewBox="0 0 560 190" role="img" aria-hidden="true">
          <path d="M0 154 L560 154" className="chart-grid" />
          <path d="M0 104 L560 104" className="chart-grid" />
          <path d="M0 54 L560 54" className="chart-grid" />
          <path d={path} className="chart-line" />
          {points.map((point) => (
            <g key={point.label}>
              <line x1={point.x} x2={point.x} y1={point.y} y2="174" className="chart-guide" />
              <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            </g>
          ))}
        </svg>
        {points.map((point) => (
          <span
            className="point-label"
            key={point.label}
            style={{ left: `${(point.x / 560) * 100}%`, top: `${point.y}px` }}
          >
            <small>{point.label}</small>
            {formatWon(point.price)}
          </span>
        ))}
      </div>
      <div className="checkpoint-row">
        {checkpoints.map((checkpoint) => (
          <div className="checkpoint" key={checkpoint.label}>
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

- [ ] **Step 5: 랭킹 table component 작성**

Create `src/components/ConsensusTable.tsx`:

```tsx
import { formatPercent, formatWon, type ConsensusRankingRow } from '../consensus/model';
import { ConsensusTrendLine } from './ConsensusTrendLine';

type ConsensusTableProps = {
  rows: ConsensusRankingRow[];
};

export function ConsensusTable({ rows }: ConsensusTableProps) {
  return (
    <section className="table-shell" aria-label="컨센서스 랭킹 테이블">
      <div className="table-head">
        <div>종목</div>
        <div>현재가</div>
        <div>적정주가</div>
        <div>갭</div>
        <div>지난 1개월 대비 컨센서스 증가</div>
        <div />
      </div>
      {rows.map((row) => (
        <details className="rank-detail" key={row.id}>
          <summary className="summary-row" aria-label={`${row.name} 상세 열기`}>
            <div>
              <div className="stock-name">{row.name}</div>
              {row.code ? <div className="stock-code">{row.code}</div> : null}
            </div>
            <div className="price">{formatWon(row.currentPrice)}</div>
            <div>
              <div className="price">{formatWon(row.fairPrice)}</div>
              <div className="muted">갭 {formatWon(row.gapAmount)}</div>
            </div>
            <div className="gap-positive">{formatPercent(row.gapPercent)}</div>
            <div>
              <div className="gap-bar">
                <span style={{ width: `${Math.min(Math.max(row.gapPercent, 0), 100)}%` }} />
              </div>
              <span className="consensus-badge">
                ▲ {formatPercent(row.oneMonthConsensusChangePercent)}
              </span>
            </div>
            <div className="chevron" aria-hidden="true">⌄</div>
          </summary>
          <div className="expanded-row">
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
              <p className="muted">현재가가 적정주가 대비 {formatWon(row.gapAmount)} 낮습니다.</p>
            </article>
            <article className="detail-card">
              <h3>
                컨센서스 가격 변화
                <span className="consensus-badge">{formatPercent(row.oneMonthConsensusChangePercent)}</span>
              </h3>
              <ConsensusTrendLine checkpoints={row.checkpoints} />
            </article>
          </div>
        </details>
      ))}
    </section>
  );
}
```

- [ ] **Step 6: page와 App 연결**

Create `src/components/ConsensusRankingPage.tsx`:

```tsx
import type { RawConsensusRow } from '../consensus/model';
import { useConsensusRanking } from '../consensus/useConsensusRanking';
import { ConsensusTable } from './ConsensusTable';
import { SummaryCards } from './SummaryCards';

type ConsensusRankingPageProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
};

export function ConsensusRankingPage({ queryRows }: ConsensusRankingPageProps) {
  const state = useConsensusRanking({ queryRows });

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>컨센서스 괴리율 랭킹</h1>
          <p>현재가와 적정주가의 갭이 큰 종목부터 정렬하고, row 확장으로 컨센서스 가격 흐름을 확인합니다.</p>
        </div>
        <span className="source-chip">KRX FnGuide Consensus</span>
      </header>

      {state.status === 'loading' ? <div className="state-panel">컨센서스 데이터를 불러오는 중입니다.</div> : null}
      {state.status === 'error' ? <div className="state-panel error">{state.error}</div> : null}
      {state.status === 'success' && state.rows.length === 0 ? (
        <div className="state-panel">표시할 컨센서스 데이터가 없습니다.</div>
      ) : null}
      {state.status === 'success' && state.rows.length > 0 ? (
        <>
          <SummaryCards rows={state.rows} />
          <ConsensusTable rows={state.rows} />
        </>
      ) : null}
    </main>
  );
}
```

Modify `src/App.tsx`:

```tsx
import type { RawConsensusRow } from './consensus/model';
import { ConsensusRankingPage } from './components/ConsensusRankingPage';

type AppProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
};

export default function App({ queryRows }: AppProps) {
  return <ConsensusRankingPage queryRows={queryRows} />;
}
```

- [ ] **Step 7: 렌더링 테스트 통과 확인**

Run:

```bash
rtk npm test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: UI component 커밋**

Run:

```bash
rtk git add src/components src/App.tsx src/App.test.tsx
rtk git commit -m "feat: render expandable consensus ranking"
```

## Task 5: 반응형 스타일 완성

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 완성 CSS 작성**

Replace `src/styles.css` with:

```css
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #172033;
  background: #f5f7fb;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: #f5f7fb;
}

button,
summary {
  font: inherit;
}

.page-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 18px 48px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  padding: 24px;
  color: #f8fafc;
  background: #111827;
  border-radius: 8px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 26px;
  letter-spacing: 0;
}

.page-header p {
  margin: 0;
  color: #b8c4d6;
  font-size: 14px;
}

.source-chip,
.consensus-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  white-space: nowrap;
  font-weight: 900;
}

.source-chip {
  padding: 8px 11px;
  background: #192336;
  border: 1px solid #344154;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.summary-card,
.table-shell,
.detail-card,
.state-panel {
  background: #fff;
  border: 1px solid #e3ebf6;
  border-radius: 8px;
}

.summary-card {
  padding: 14px;
}

.summary-card span,
.price-tile span,
.checkpoint span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 6px;
}

.summary-card strong {
  color: #0f172a;
  font-size: 20px;
}

.state-panel {
  margin-top: 16px;
  padding: 24px;
  color: #475569;
}

.state-panel.error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff7f7;
}

.table-shell {
  overflow: hidden;
}

.table-head,
.summary-row {
  display: grid;
  grid-template-columns: minmax(150px, 1.35fr) .9fr .9fr .7fr 1.05fr 34px;
  gap: 12px;
  align-items: center;
}

.table-head {
  padding: 11px 14px;
  color: #526071;
  background: #eef3f9;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.rank-detail {
  border-top: 1px solid #e5edf7;
}

.summary-row {
  min-height: 68px;
  padding: 14px;
  list-style: none;
  cursor: pointer;
}

.summary-row::-webkit-details-marker {
  display: none;
}

.rank-detail[open] .summary-row {
  background: #f8fbff;
}

.stock-name,
.price {
  color: #111827;
  font-weight: 900;
}

.stock-code,
.muted {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.gap-positive {
  color: #dc2626;
  font-size: 18px;
  font-weight: 950;
}

.gap-bar {
  height: 9px;
  margin-bottom: 6px;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 999px;
}

.gap-bar.large {
  height: 11px;
}

.gap-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #f97316, #dc2626);
  border-radius: inherit;
}

.consensus-badge {
  gap: 4px;
  padding: 5px 8px;
  color: #15803d;
  background: #dcfce7;
  font-size: 12px;
}

.chevron {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #2563eb;
  background: #eef2ff;
  border-radius: 8px;
  font-weight: 900;
}

.rank-detail[open] .chevron {
  transform: rotate(180deg);
}

.expanded-row {
  display: grid;
  grid-template-columns: .9fr 1.1fr;
  gap: 14px;
  padding: 16px 14px 18px;
  background: #fbfdff;
  border-top: 1px solid #e5edf7;
}

.detail-card {
  padding: 14px;
}

.detail-card h3 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  color: #0f172a;
  font-size: 14px;
}

.price-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.price-tile {
  padding: 11px;
  background: #f8fafc;
  border: 1px solid #e5edf7;
  border-radius: 8px;
}

.price-tile strong {
  color: #0f172a;
  font-size: 20px;
}

.trend-card {
  overflow: hidden;
  border: 1px solid #e5edf7;
  border-radius: 8px;
}

.line-chart {
  position: relative;
  height: 190px;
  background:
    linear-gradient(180deg, rgba(37, 99, 235, .08), rgba(255, 255, 255, 0)),
    repeating-linear-gradient(0deg, #fff, #fff 38px, #edf2f7 39px);
}

.line-chart svg {
  display: block;
  width: 100%;
  height: 100%;
}

.chart-grid {
  stroke: #e2e8f0;
  stroke-width: 1;
}

.chart-guide {
  stroke: #cbd5e1;
  stroke-dasharray: 4 4;
}

.chart-line {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-point {
  fill: #fff;
  stroke: #2563eb;
  stroke-width: 3;
}

.point-label {
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 6px 7px;
  color: #fff;
  background: #111827;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .18);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
}

.point-label small {
  display: block;
  margin-bottom: 2px;
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 800;
}

.checkpoint-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: #f8fafc;
  border-top: 1px solid #e5edf7;
}

.checkpoint {
  padding: 10px;
  border-left: 1px solid #e5edf7;
}

.checkpoint:first-child {
  border-left: 0;
}

.checkpoint strong,
.checkpoint em {
  display: block;
}

.checkpoint strong {
  color: #0f172a;
  font-size: 15px;
}

.checkpoint em {
  margin-top: 3px;
  color: #15803d;
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
}

@media (max-width: 920px) {
  .page-header,
  .summary-grid,
  .expanded-row,
  .checkpoint-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .table-head {
    display: none;
  }

  .summary-row {
    grid-template-columns: 1fr 1fr;
  }

  .summary-row > div:nth-child(5) {
    grid-column: 1 / -1;
  }

  .chevron {
    justify-self: end;
  }

  .checkpoint {
    border-top: 1px solid #e5edf7;
    border-left: 0;
  }

  .checkpoint:first-child {
    border-top: 0;
  }
}

@media (max-width: 560px) {
  .page-shell {
    padding: 14px 10px 32px;
  }

  .page-header {
    padding: 18px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .summary-row {
    grid-template-columns: 1fr;
  }

  .chevron {
    justify-self: start;
  }

  .price-compare {
    grid-template-columns: 1fr;
  }

  .point-label {
    font-size: 10px;
    padding: 5px 6px;
  }
}
```

- [ ] **Step 2: 전체 테스트와 build 확인**

Run:

```bash
rtk npm test
rtk npm run build
```

Expected: all tests PASS and Vite build succeeds.

- [ ] **Step 3: 스타일 커밋**

Run:

```bash
rtk git add src/styles.css
rtk git commit -m "style: finish consensus ranking layout"
```

## Task 6: README와 최종 검증

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README 작성**

Replace `README.md` with:

```md
# articles

KRX FnGuide 컨센서스 데이터를 Supabase에서 조회해 현재가 대비 적정주가 괴리율 랭킹을 보여주는 Vite React 앱입니다.

## 환경변수

Vite 앱은 다음 환경변수를 사용합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

GitHub Pages 배포 환경에서는 GitHub variables 또는 secrets를 통해 위 값을 제공해야 합니다.

## 개발

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
```

## 빌드

```bash
npm run build
```

Vite base는 `/articles/`로 설정되어 GitHub Pages의 `/articles/` 경로에서 asset이 정상적으로 로드됩니다.
```

- [ ] **Step 2: 최종 검증 실행**

Run:

```bash
rtk npm test
rtk npm run build
```

Expected: tests PASS and production build succeeds.

- [ ] **Step 3: README 커밋**

Run:

```bash
rtk git add README.md
rtk git commit -m "docs: document consensus ranking app"
```

## Self-Review

- Spec coverage: Supabase 환경변수, `krx_fnguide_consensus` 조회, 괴리율 정렬, row 필드, 확장 row, 체크포인트 가격 포함 선 그래프, 로딩/빈 상태/오류 상태, 반응형 동작, 테스트와 build 검증을 Task 1-6에 배치했다.
- Placeholder scan: 계획 문서에는 미정 항목이나 나중에 채우라는 지시가 없다.
- Type consistency: `RawConsensusRow`, `ConsensusRankingRow`, `ConsensusCheckpoint`, `useConsensusRanking`, `ConsensusRankingPage`, `ConsensusTable`, `ConsensusTrendLine`, `SummaryCards` 이름이 task 간 일관된다.
