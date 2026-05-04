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

function buildRowSelectionKey(row: ConsensusRankingRow) {
  return row.gicode ? `gicode:${row.gicode}` : `row:${row.id}`;
}

export function ConsensusRankingPage({ queryRows, queryReports }: ConsensusRankingPageProps) {
  const state = useConsensusRanking({ queryRows, queryReports });
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(() => {
    const gicode = readSelectedGicodeFromUrl();
    return gicode ? `gicode:${gicode}` : null;
  });
  const selectedRow = useMemo(
    () => state.rows.find((row) => buildRowSelectionKey(row) === selectedRowKey) ?? null,
    [state.rows, selectedRowKey],
  );
  const statusContent =
    state.status === 'loading' ? (
      <div className="state-panel">컨센서스 데이터를 불러오는 중입니다.</div>
    ) : state.status === 'error' ? (
      <div className="state-panel error">{state.error}</div>
    ) : state.rows.length === 0 ? (
      <div className="state-panel">표시할 컨센서스 데이터가 없습니다.</div>
    ) : null;

  useEffect(() => {
    function handlePopState() {
      const gicode = readSelectedGicodeFromUrl();
      setSelectedRowKey(gicode ? `gicode:${gicode}` : null);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleSelect(row: ConsensusRankingRow) {
    setSelectedRowKey(buildRowSelectionKey(row));
    if (row.gicode) {
      writeSelectedGicodeToUrl(row.gicode);
    } else {
      clearSelectedGicodeFromUrl();
    }
  }

  function handleCloseDetail() {
    setSelectedRowKey(null);
    clearSelectedGicodeFromUrl();
  }

  return (
    <>
      <section className="dashboard-section consensus-section" id="consensus" aria-labelledby="consensus-title">
        <div className="section-heading consensus-heading">
          <span className="consensus-source">KRX 컨센서스 괴리율 랭킹</span>
          <h2 className="consensus-title" id="consensus-title">
            컨센서스 괴리율 랭킹
          </h2>
        </div>
        <p className="consensus-copy">
          <strong>TL;DR</strong> 컨센서스 대비 현재 주가가 낮게 반영된 종목의 갭을 큰 순서로 확인합니다.
        </p>

        {statusContent}
        {state.status === 'success' && state.rows.length > 0 ? <SummaryCards rows={state.rows} /> : null}
      </section>

      {state.status === 'success' && state.rows.length > 0 ? (
        <section className="dashboard-section ranking-section" id="ranking" aria-labelledby="ranking-title">
          <div className="section-heading">
            <span>Ranking</span>
            <h2 id="ranking-title">괴리율 순위</h2>
          </div>
          <ConsensusTable rows={state.rows} onSelect={handleSelect} />
        </section>
      ) : null}

      {selectedRow ? <ConsensusDetailModal row={selectedRow} onClose={handleCloseDetail} /> : null}

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
    </>
  );
}
