# 랭킹 상세 팝업 설계서

## 목적

기존 컨센서스 괴리율 랭킹 지면은 행을 선택하면 같은 테이블 구조 안에서 상세 행이 확장된다. 이 변경은 행 내부 확장을 제거하고, Toss Invest 피드 상세처럼 행과 분리된 전역 팝업 지면으로 상세정보를 랜딩한다.

팝업은 기존 가격 비교와 컨센서스 가격 변화 정보를 유지하면서 `ai_consensus_summary_reports`의 AI 분석 리포트를 함께 보여준다. 사용자는 랭킹 목록의 밀도를 잃지 않고, 선택한 종목의 가격 근거와 AI 요약을 별도 상세 지면에서 확인한다.

## 데이터 조회 결과

2026-05-04 기준 로컬 `.env.local`로 Supabase를 조회한 결과는 다음과 같다.

- `krx_fnguide_consensus`: 53건
- `ai_consensus_summary_reports`: 54건
- `ai_consensus_summary_reports` 컬럼: `gicode`, `co_nm`, `analysis`, `updated_at`
- `krx_fnguide_consensus`에는 `gicode` 컬럼이 없고 `fnguide_code` 컬럼이 있다.
- `ai_consensus_summary_reports.gicode`와 `krx_fnguide_consensus.fnguide_code`를 같은 키로 매칭한다.

상위 행인 한미약품은 `fnguide_code=A128940`이고, `ai_consensus_summary_reports.gicode=A128940` 리포트와 정상 매칭된다.

## 데이터 모델

`ConsensusRankingRow`에는 내부 표준 키로 `gicode`를 추가한다.

- `gicode`: `krx_fnguide_consensus.fnguide_code`에서 읽는다.
- `summaryReport`: `ai_consensus_summary_reports.gicode`로 매칭되는 최신 AI 분석 리포트이다.
- AI 리포트가 없으면 `summaryReport`는 `null`이며, 팝업에는 리포트 없음 상태를 표시한다.

AI 리포트는 현재 테이블 정책상 `gicode`가 유니크이고 항상 최신 리포트라고 간주한다. 따라서 프론트엔드에서 최신순 정렬이나 중복 해소를 하지 않는다.

`analysis` JSON은 다음 필드를 우선 사용한다. JSON 키 이름은 데이터 스키마이므로 원문을 유지한다.

- `tl;dr`: AI 컨센서스 요약 본문
- `keyKeywords`: 키워드 칩
- `risks`: 주요 리스크
- `targetPriceRange.min`, `targetPriceRange.median`, `targetPriceRange.max`: 목표주가 범위
- `securitiesFirms`: 증권사별 목표가, 의견, 리포트 수
- `securitiesFirmCount`: 참여 증권사 수

누락 필드는 `-` 또는 빈 상태로 표시한다. 숫자 가격은 원화 포맷으로 표기한다.

## 화면 구조

랭킹 테이블 행은 더 이상 상세 콘텐츠를 소유하지 않는다. 행은 선택 이벤트만 발생시키는 진입점 역할을 한다.

`ConsensusRankingPage`는 선택된 행 상태를 관리하고, 선택된 행이 있을 때 테이블 밖 전역 위치에 `ConsensusDetailModal`을 렌더링한다. 이 구조는 행 높이, 행 그룹, 테이블 스크롤 구조와 상세 지면을 분리한다.

기본 구조는 다음과 같다.

- `ConsensusRankingPage`
- `SummaryCards`
- `ConsensusTable`
  - `rows`
  - `onSelect(선택 행)`
- `ConsensusDetailModal`
  - `선택 행`
  - `onClose()`

팝업은 페이지 전역 덮개로 뜨며, 배경 어둡힘과 흐림 효과를 적용한다. 닫기 버튼, ESC, 배경 클릭으로 닫을 수 있어야 한다.

## URL 상태

레퍼런스인 Toss Invest 피드는 `contentType`, `contentParams`, `contentPrev`, `sectionName` query로 전역 콘텐츠 모달 상태를 표현한다. 이 프로젝트도 같은 방향으로 선택 상태를 URL에 반영할 수 있게 설계한다.

행 선택 시 URL에는 다음 상태를 반영한다.

- `contentType=consensus`
- `contentParams={"gicode":"A128940"}` 형태의 JSON 문자열

닫을 때는 `contentType`과 `contentParams`를 제거한다. 단, 목업 피드백에 따라 실제 UI에는 URL 상태 예시 문구를 노출하지 않는다.

초기 진입 시 URL에 `contentType=consensus`와 유효한 `contentParams.gicode`가 있으면, 데이터 로딩 완료 후 해당 행의 팝업을 바로 연다. 매칭 행이 없으면 팝업을 열지 않고 목록만 표시한다.

## 팝업 콘텐츠

팝업 헤더에는 종목명, 종목코드, `gicode`, 컨센서스 리포트 수, AI 리포트 업데이트 시각을 표시한다. 헤더 문구는 기존 리포트 출처명을 강조하지 않고 `컨센서스 리포트`로 표기한다.

상단 상세 영역은 두 컬럼이다.

- 좌측: 가격 비교
- 우측: 컨센서스 가격 변화

가격 비교 박스에는 현재 가격, 적정주가, 괴리 금액, 괴리율 막대를 표시한다. 목표주가 범위는 별도 박스가 아니라 가격 비교 박스 아래에 포함한다.

목표주가 범위는 다음 값을 보여준다.

- 최저 목표주가
- 중앙값 목표주가
- 최고 목표주가

컨센서스 가격 변화는 기존 체크포인트를 유지하되 현재가격을 추가한다.

- 현재 가격
- 지난 6개월
- 지난 3개월
- 지난 1개월
- 현재 컨센서스

차트 마지막에는 `targetPriceRange`의 최저, 중앙, 최고 값을 점도표 형태로 표시한다. 현재가격은 차트와 체크포인트에서 붉은 계통으로 강조하되, 가격 비교 박스의 현재 가격 타일은 기존 기본 톤을 유지한다.

AI 분석 영역은 좌우 2컬럼이다.

- 좌측 상단: AI 컨센서스 요약
- 좌측 하단: 주요 리스크
- 우측: 증권사별 목표가

주요 리스크는 붉은 계통의 배경, 테두리, 텍스트로 표시한다. 증권사별 목표가는 우측에 길게 배치하되, 각 항목은 `증권사명 | 목표가 | 의견/건수`를 하나의 행으로 표시한다.

## 스타일

기존 앱 톤을 유지한다.

- 어두운 반투명 `dashboard-section` 계열 패널
- 8px 모서리 반경
- 청록 포인트 색상 `#2dd4bf`
- 모래색과 회색 계열 보조 텍스트
- 기존 `summary-row`, `detail-card`, `consensus-badge`, `gap-bar`와 유사한 밀도와 간격

팝업은 밝은 별도 페이지처럼 보이지 않고, 현재 대시보드 위에 올라오는 전역 상세 지면처럼 보여야 한다.

## 오류와 빈 상태

두 테이블 중 하나의 조회가 실패하면 지면의 기존 오류 상태를 사용한다.

`ai_consensus_summary_reports`에 매칭 리포트가 없으면 팝업은 정상적으로 열고, AI 분석 영역에 리포트 없음 상태를 표시한다. 가격 비교와 컨센서스 가격 변화는 계속 표시한다.

`gicode`가 없는 컨센서스 행은 랭킹에는 유지하되 AI 리포트 매칭 없이 표시한다. URL 직접 진입 대상에서는 제외한다.

## 테스트 범위

단위 테스트는 다음을 확인한다.

- `fnguide_code`를 내부 `gicode`로 정규화한다.
- `ai_consensus_summary_reports.gicode`와 랭킹 행을 병합한다.
- 매칭 리포트가 없을 때 `summaryReport`가 `null`이 된다.
- `analysis.tl;dr`, `keyKeywords`, `risks`, `targetPriceRange`, `securitiesFirms`를 표시 가능한 모델로 읽는다.

컴포넌트 테스트는 다음을 확인한다.

- 행 클릭 시 내부 확장 행이 생기지 않는다.
- 행 클릭 시 전역 팝업이 열린다.
- 닫기 버튼으로 팝업이 닫힌다.
- 팝업에 가격 비교, 목표주가 범위, 현재가격 포함 컨센서스 변화, AI 요약, 리스크, 증권사별 목표가가 표시된다.
- 주요 리스크 영역은 붉은 계통 스타일 클래스를 가진다.
- URL 질의값이 있는 초기 진입 시 해당 행 팝업이 열린다.

빌드 검증은 `npm test`와 `npm run build`로 수행한다.
