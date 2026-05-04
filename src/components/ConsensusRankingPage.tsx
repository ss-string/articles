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
