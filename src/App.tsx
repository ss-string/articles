import { useEffect, useState } from 'react';
import type { RawConsensusRow, RawSummaryReportRow } from './consensus/model';
import type { RawHotNewsReportRow } from './hot-news/model';
import type { RawMacroRegimeRow } from './macro-regime/model';
import type { RawRealEstateTables } from './real-estate/model';
import { AiAnalysisReportsPage } from './components/AiAnalysisReportsPage';
import { AppShell } from './components/AppShell';
import { ConsensusRankingPage } from './components/ConsensusRankingPage';
import { HotNewsReportsPage } from './components/HotNewsReportsPage';
import { MacroRegimePage } from './components/MacroRegimePage';
import { RealEstateTransactionsPage } from './components/RealEstateTransactionsPage';
import { getActiveRouteForLocation, navigateToPath } from './navigation';
import './styles.css';

type AppProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryHotNewsRows?: () => Promise<RawHotNewsReportRow[]>;
  queryMacroRows?: () => Promise<RawMacroRegimeRow[]>;
  queryReports?: () => Promise<RawSummaryReportRow[]>;
  queryRealEstateTables?: () => Promise<RawRealEstateTables>;
};

export default function App({
  queryRows,
  queryHotNewsRows,
  queryMacroRows,
  queryReports,
  queryRealEstateTables,
}: AppProps) {
  const [activeRoute, setActiveRoute] = useState(() =>
    getActiveRouteForLocation(window.location.pathname, window.location.search),
  );

  useEffect(() => {
    function handlePopState() {
      setActiveRoute(getActiveRouteForLocation(window.location.pathname, window.location.search));
    }

    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleNavigate(path: string) {
    navigateToPath(path);
  }

  const page =
    activeRoute.path === '/main/macro-regime' ? (
      <MacroRegimePage queryRows={queryMacroRows} />
    ) : activeRoute.path === '/finance/hot-news' ? (
      <HotNewsReportsPage queryRows={queryHotNewsRows} />
    ) : activeRoute.path === '/finance/consensus' ? (
      <ConsensusRankingPage queryRows={queryRows} queryReports={queryReports} />
    ) : activeRoute.path === '/real-estate/transactions' ? (
      <RealEstateTransactionsPage queryTables={queryRealEstateTables} />
    ) : (
      <AiAnalysisReportsPage />
    );

  return (
    <AppShell activeRoute={activeRoute} onNavigate={handleNavigate}>
      {page}
    </AppShell>
  );
}
