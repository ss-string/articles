# 컨센서스 디자인 마이그레이션 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 작업 단위로 구현할 때는 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [ ]`)로 관리한다.

**목표:** 기존 포트폴리오 페이지를 유지하면서 `컨센서스 괴리율 랭킹` 탭으로 컨센서스 지면에 접근하게 한다.

**아키텍처:** `App`은 기존 포트폴리오 앱 셸과 섹션을 렌더링한다. `ConsensusRankingPage`는 별도 앱 셸 없이 `dashboard-section` 기반의 컨센서스 섹션만 렌더링하며, `SummaryCards`와 `ConsensusTable`의 기능은 유지한다.

**기술 스택:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS.

---

### 작업 1: 앱 셸 구조 테스트와 구현

**파일:**
- 수정: `src/App.test.tsx`
- 수정: `src/components/ConsensusRankingPage.tsx`
- 수정: `src/styles.css`

- [x] **1단계: 실패 테스트 작성**

`src/App.test.tsx`에 기존 `Portfolio Dashboard`가 유지되고, `컨센서스 괴리율 랭킹` 내비게이션 링크가 `#consensus`로 연결되며, 컨센서스 섹션 안에 `.status-panel`이 없는지 확인하는 단언을 추가한다.

- [x] **2단계: 실패 확인**

실행: `rtk npm test -- src/App.test.tsx`

기대 결과: 기존 구현이 포트폴리오 페이지를 대체하므로 실패한다.

- [x] **3단계: 최소 구현**

`App`에 기존 포트폴리오 페이지를 복원하고, `ConsensusRankingPage`는 별도 앱 셸 없이 컨센서스 섹션만 렌더링하도록 변경한다.

- [x] **4단계: 통과 확인**

실행: `rtk npm test -- src/App.test.tsx src/components/ConsensusTable.test.tsx src/components/ConsensusTrendLine.test.tsx`

기대 결과: 앱 셸 구조와 기존 테이블/차트 동작이 모두 통과한다.

### 작업 2: 기존 디자인 토큰으로 CSS 마이그레이션

**파일:**
- 수정: `src/styles.css`

- [x] **1단계: 밝은 페이지 셸 제거**

기존 컨센서스 전용 밝은 배경, 흰색 카드, 별도 헤더 스타일을 제거하고 기존 포트폴리오 대시보드의 어두운 배경과 패널 스타일을 기본값으로 사용한다.

- [x] **2단계: 컨센서스 전용 컴포넌트 재스타일링**

테이블 헤더, 요약 row, 확장 row, 상세 카드, 배지, 선 그래프, 모바일 카드 row를 기존 패널 팔레트에 맞게 조정한다.

- [x] **3단계: 집중 테스트 실행**

실행: `rtk npm test -- src/App.test.tsx src/components/ConsensusTable.test.tsx src/components/ConsensusTrendLine.test.tsx`

기대 결과: 통과한다.

### 작업 3: 전체 검증과 PR 갱신

**파일:**
- 추가: `docs/superpowers/specs/2026-05-04-consensus-design-migration-design.md`
- 추가: `docs/superpowers/plans/2026-05-04-consensus-design-migration.md`
- 수정: `src/App.test.tsx`
- 수정: `src/components/ConsensusRankingPage.tsx`
- 수정: `src/styles.css`

- [x] **1단계: 전체 테스트 실행**

실행: `rtk npm test`

기대 결과: 전체 테스트가 통과한다.

- [x] **2단계: 프로덕션 빌드 실행**

실행: `rtk npm run build`

기대 결과: TypeScript 빌드와 Vite production build가 통과한다.

- [x] **3단계: 커밋과 푸시**

실행:

```bash
rtk git add docs/superpowers/specs/2026-05-04-consensus-design-migration-design.md docs/superpowers/plans/2026-05-04-consensus-design-migration.md src/App.test.tsx src/components/ConsensusRankingPage.tsx src/styles.css
rtk git commit -m "style: align consensus page with existing dashboard"
rtk git push
```
