import type { RawConsensusRow } from '../consensus/model';
import { useConsensusRanking } from '../consensus/useConsensusRanking';
import { ConsensusTable } from './ConsensusTable';
import { SummaryCards } from './SummaryCards';

type ConsensusRankingPageProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
};

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Ranking', href: '#ranking' },
  { label: 'Method', href: '#method' },
  { label: 'Status', href: '#status' },
];

export function ConsensusRankingPage({ queryRows }: ConsensusRankingPageProps) {
  const state = useConsensusRanking({ queryRows });
  const statusContent =
    state.status === 'loading' ? (
      <div className="state-panel">컨센서스 데이터를 불러오는 중입니다.</div>
    ) : state.status === 'error' ? (
      <div className="state-panel error">{state.error}</div>
    ) : state.rows.length === 0 ? (
      <div className="state-panel">표시할 컨센서스 데이터가 없습니다.</div>
    ) : null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Consensus dashboard home">
          <span className="brand-mark">S</span>
          <span>
            <strong>Sunghyun</strong>
            <small>Portfolio</small>
          </span>
        </a>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <header className="top-nav">
        <a className="brand" href="#overview" aria-label="Consensus dashboard home">
          <span className="brand-mark">S</span>
          <span>
            <strong>Sunghyun</strong>
            <small>Portfolio</small>
          </span>
        </a>
        <nav className="mobile-links" aria-label="Mobile">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="dashboard">
        <section className="hero-section consensus-hero" id="overview" aria-labelledby="overview-title">
          <div className="eyebrow">KRX FnGuide</div>
          <div className="hero-grid">
            <div>
              <h1 id="overview-title">컨센서스 괴리율 랭킹</h1>
              <p className="hero-copy">
                현재가와 적정주가의 갭이 큰 종목부터 정렬하고, row 확장으로 컨센서스 가격 흐름을 확인합니다.
              </p>
            </div>
            <div className="status-panel" aria-label="데이터 출처">
              <span>Data source</span>
              <strong>KRX FnGuide Consensus</strong>
              <p>Supabase `krx_fnguide_consensus` 테이블에서 조회한 공개 컨센서스 데이터입니다.</p>
            </div>
          </div>
        </section>

        <section className="dashboard-section" id="status" aria-live="polite">
          {statusContent}
          {state.status === 'success' && state.rows.length > 0 ? <SummaryCards rows={state.rows} /> : null}
        </section>

        {state.status === 'success' && state.rows.length > 0 ? (
          <section className="dashboard-section ranking-section" id="ranking" aria-labelledby="ranking-title">
            <div className="section-heading">
              <span>Ranking</span>
              <h2 id="ranking-title">괴리율 순위</h2>
            </div>
            <ConsensusTable rows={state.rows} />
          </section>
        ) : null}

        <section className="dashboard-section method-section" id="method" aria-labelledby="method-title">
          <div className="section-heading">
            <span>Method</span>
            <h2 id="method-title">표기 기준</h2>
          </div>
          <p>
            괴리율은 현재가 대비 적정주가 차이로 계산하며, 컨센서스 증감은 현재 컨센서스를 지난 1개월
            컨센서스와 비교해 표시합니다.
          </p>
        </section>
      </main>
    </div>
  );
}
