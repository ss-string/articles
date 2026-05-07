import { useEffect, useMemo, useState } from 'react';
import {
  formatKoreanHousePrice,
  type RawRealEstateTables,
  type RealEstateInterestTarget,
  type RealEstateArticle,
  type RealEstatePriceMetric,
} from '../real-estate/model';
import { useRealEstateTransactions } from '../real-estate/useRealEstateTransactions';

type RealEstateTransactionsPageProps = {
  queryTables?: () => Promise<RawRealEstateTables>;
};

type ChartPoint = {
  x: number;
  actualY: number | null;
  askingY: number | null;
};

type ArticleFilter = 'belowMedian' | 'all';

function getDisplayPyeongName(target: RealEstateInterestTarget) {
  return target.pyeongName ?? target.pyeongType;
}

function getArticleTitle(article: RealEstateArticle) {
  return article.articleName ?? `매물번호 ${article.articleNo}`;
}

function formatCount(value: number | null) {
  return value === null ? '-' : value.toLocaleString('ko-KR');
}

function formatPercent(value: number | null) {
  return value === null || !Number.isFinite(value) ? '-' : `${value.toFixed(1)}%`;
}

function formatSignedPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatSignedKoreanHousePrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  if (value === 0) {
    return '0';
  }

  const sign = value > 0 ? '+' : '-';
  return `${sign}${formatKoreanHousePrice(Math.abs(value))}`;
}

function getMetricValues(metric: RealEstatePriceMetric) {
  return [metric.actualAveragePrice, metric.askingAveragePrice].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
}

function buildChartPoints(metrics: RealEstatePriceMetric[]): ChartPoint[] {
  const width = 520;
  const height = 220;
  const padding = 24;
  const values = metrics.flatMap(getMetricValues);

  if (metrics.length === 0 || values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? Math.max(max * 0.06, 1) : max - min;
  const domainMin = min - range * 0.12;
  const domainMax = max + range * 0.12;
  const domainRange = domainMax - domainMin;

  function getX(index: number) {
    if (metrics.length === 1) {
      return width / 2;
    }

    return padding + (index / (metrics.length - 1)) * (width - padding * 2);
  }

  function getY(value: number | null) {
    if (value === null) {
      return null;
    }

    return height - padding - ((value - domainMin) / domainRange) * (height - padding * 2);
  }

  return metrics.map((metric, index) => ({
    x: getX(index),
    actualY: getY(metric.actualAveragePrice),
    askingY: getY(metric.askingAveragePrice),
  }));
}

function pointsToPolyline(points: ChartPoint[], key: 'actualY' | 'askingY') {
  return points
    .filter((point) => point[key] !== null)
    .map((point) => `${point.x},${point[key]}`)
    .join(' ');
}

function PriceChart({ target }: { target: RealEstateInterestTarget }) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartPoints = useMemo(() => buildChartPoints(target.metricsSeries), [target.metricsSeries]);
  const actualPoints = pointsToPolyline(chartPoints, 'actualY');
  const askingPoints = pointsToPolyline(chartPoints, 'askingY');
  const displayPyeongName = getDisplayPyeongName(target);
  const activeMetric = activePointIndex === null ? null : target.metricsSeries[activePointIndex];
  const activePoint = activePointIndex === null ? null : chartPoints[activePointIndex];

  return (
    <div
      className="real-estate-chart"
      role="img"
      aria-label={`${target.complexName} ${displayPyeongName} 가격 비교 그래프`}
    >
      {chartPoints.length > 0 ? (
        <svg aria-hidden="true" viewBox="0 0 520 220" focusable="false">
          <line className="real-estate-chart-grid" x1="24" x2="496" y1="44" y2="44" />
          <line className="real-estate-chart-grid" x1="24" x2="496" y1="110" y2="110" />
          <line className="real-estate-chart-grid" x1="24" x2="496" y1="176" y2="176" />
          {actualPoints ? <polyline className="real-estate-chart-line actual" points={actualPoints} /> : null}
          {askingPoints ? <polyline className="real-estate-chart-line asking" points={askingPoints} /> : null}
          {chartPoints.map((point, index) => (
            <g key={`${target.id}-${index}`}>
              {point.actualY !== null ? <circle className="real-estate-chart-dot actual" cx={point.x} cy={point.actualY} r="4" /> : null}
              {point.askingY !== null ? <circle className="real-estate-chart-dot asking" cx={point.x} cy={point.askingY} r="4" /> : null}
            </g>
          ))}
        </svg>
      ) : (
        <div className="real-estate-chart-empty">표시할 가격 흐름이 없습니다.</div>
      )}
      {chartPoints.map((point, index) => {
        const metric = target.metricsSeries[index];
        const top = Math.min(point.actualY ?? 110, point.askingY ?? 110);

        return (
          <button
            aria-label={`${metric.metricDate ?? `${index + 1}번째`} 가격 보기`}
            className="real-estate-chart-hit-area"
            key={`${target.id}-hit-${index}`}
            style={{ left: `${(point.x / 520) * 100}%`, top: `${(top / 220) * 100}%` }}
            type="button"
            onBlur={() => setActivePointIndex(null)}
            onFocus={() => setActivePointIndex(index)}
            onMouseEnter={() => setActivePointIndex(index)}
            onMouseLeave={() => setActivePointIndex(null)}
          />
        );
      })}
      {activeMetric && activePoint ? (
        <div
          aria-label={`${activeMetric.metricDate ?? '선택 지점'} 가격`}
          className="real-estate-chart-tooltip"
          role="status"
          style={{
            left: `${(activePoint.x / 520) * 100}%`,
            top: `${(Math.min(activePoint.actualY ?? 110, activePoint.askingY ?? 110) / 220) * 100}%`,
          }}
        >
          <strong>{activeMetric.metricDate ?? '가격'}</strong>
          <span>실거래 {formatKoreanHousePrice(activeMetric.actualAveragePrice)}</span>
          <span>호가 {formatKoreanHousePrice(activeMetric.askingAveragePrice)}</span>
        </div>
      ) : null}
    </div>
  );
}

export function RealEstateTransactionsPage({ queryTables }: RealEstateTransactionsPageProps) {
  const state = useRealEstateTransactions({ queryTables });
  const targets = state.dashboard.targets;
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [articleFilter, setArticleFilter] = useState<ArticleFilter>('belowMedian');

  useEffect(() => {
    if (targets.length === 0) {
      setSelectedTargetId(null);
      return;
    }

    setSelectedTargetId((currentId) =>
      currentId && targets.some((target) => target.id === currentId) ? currentId : targets[0].id,
    );
  }, [targets]);

  const selectedTarget = targets.find((target) => target.id === selectedTargetId) ?? targets[0] ?? null;
  const visibleArticles =
    articleFilter === 'all' ? selectedTarget?.currentArticles ?? [] : selectedTarget?.belowMedianArticles ?? [];
  const articleSectionTitle = articleFilter === 'all' ? '전체 매물' : '중위값 이하 매물';
  const latestActualAverage = selectedTarget?.latestMetric?.actualAveragePrice ?? null;
  const latestAskingAverage = selectedTarget?.latestMetric?.askingAveragePrice ?? null;
  const askingGap =
    latestActualAverage === null || latestAskingAverage === null ? null : latestAskingAverage - latestActualAverage;
  const askingGapPercent =
    askingGap === null || latestActualAverage === null || latestActualAverage <= 0 ? null : (askingGap / latestActualAverage) * 100;

  return (
    <section className="dashboard-section real-estate-section" aria-labelledby="real-estate-title">
      <div className="section-heading">
        <span>Real Estate Transactions</span>
        <h2 id="real-estate-title">관심 단지 가격 흐름</h2>
      </div>

      {state.status === 'loading' ? <div className="state-panel">부동산 실거래정보를 불러오는 중입니다.</div> : null}
      {state.status === 'error' ? <div className="state-panel error">{state.error}</div> : null}
      {state.status === 'success' && targets.length === 0 ? (
        <div className="state-panel">표시할 관심 단지가 없습니다.</div>
      ) : null}

      {state.status === 'success' && selectedTarget ? (
        <div className="real-estate-layout">
          <aside className="real-estate-target-list" aria-label="관심 단지 목록">
            {targets.map((target) => {
              const displayPyeongName = getDisplayPyeongName(target);
              const isActive = selectedTarget.id === target.id;

              return (
                <article
                  className={['real-estate-target-card', isActive ? 'active' : ''].filter(Boolean).join(' ')}
                  key={target.id}
                >
                  <a
                    aria-label={`${target.complexName} 네이버 부동산 열기`}
                    className="real-estate-target-name"
                    href={target.complexUrl ?? undefined}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {target.complexName}
                  </a>
                  <button
                    aria-label={`${target.complexName} 관심 단지 선택`}
                    className={['real-estate-target-select', isActive ? 'active' : ''].filter(Boolean).join(' ')}
                    type="button"
                    onClick={() => setSelectedTargetId(target.id)}
                  >
                    <span className="real-estate-card-meta">{displayPyeongName}</span>
                    <span>{formatCount(target.households)}세대</span>
                    <span>사용승인 {target.approvedAt ?? '-'}</span>
                    <span>중위값 이하 {target.belowMedianArticles.length.toLocaleString('ko-KR')}건</span>
                    <span>전체 매물 {target.currentArticles.length.toLocaleString('ko-KR')}건</span>
                    <em>호가 {formatKoreanHousePrice(target.latestMetric?.askingAveragePrice ?? null)}</em>
                  </button>
                </article>
              );
            })}
          </aside>

          <div className="real-estate-main">
            <div className="summary-grid real-estate-summary-grid">
              <article className="summary-card">
                <span>실거래 평균</span>
                <strong>{formatKoreanHousePrice(selectedTarget.latestMetric?.actualAveragePrice ?? null)}</strong>
              </article>
              <article className="summary-card">
                <span>호가 평균</span>
                <strong>{formatKoreanHousePrice(selectedTarget.latestMetric?.askingAveragePrice ?? null)}</strong>
                <em className="real-estate-gap-label">
                  참고 갭 {formatSignedKoreanHousePrice(askingGap)} ({formatSignedPercent(askingGapPercent)})
                </em>
              </article>
              <article className="summary-card">
                <span>현재 매물</span>
                <strong>{selectedTarget.currentArticles.length.toLocaleString('ko-KR')}건</strong>
              </article>
            </div>

            <section className="real-estate-panel">
              <header className="real-estate-panel-header">
                <div>
                  <span>{getDisplayPyeongName(selectedTarget)}</span>
                  <h3>{selectedTarget.complexName} 가격 비교</h3>
                </div>
                <div className="real-estate-chart-legend" aria-hidden="true">
                  <span className="actual">실거래</span>
                  <span className="asking">호가</span>
                </div>
              </header>
              <PriceChart target={selectedTarget} />
            </section>

            <section className="real-estate-panel" aria-label={articleSectionTitle}>
              <header className="real-estate-panel-header">
                <div>
                  <span>{articleFilter === 'all' ? 'All Articles' : 'Below Median Articles'}</span>
                  <h3>{articleSectionTitle}</h3>
                </div>
                <div className="real-estate-article-filter" role="group" aria-label="매물 표시 범위">
                  <button
                    className={articleFilter === 'belowMedian' ? 'active' : ''}
                    type="button"
                    onClick={() => setArticleFilter('belowMedian')}
                  >
                    중위값 이하
                  </button>
                  <button
                    className={articleFilter === 'all' ? 'active' : ''}
                    type="button"
                    onClick={() => setArticleFilter('all')}
                  >
                    전체 매물
                  </button>
                </div>
              </header>
              {visibleArticles.length > 0 ? (
                <div className="real-estate-article-list">
                  {visibleArticles.map((article) => (
                    <article className="real-estate-article-row" key={article.articleNo}>
                      <div>
                        {article.articleUrl ? (
                          <a
                            aria-label={`${getArticleTitle(article)} 매물 ${article.articleNo} 네이버 부동산 열기`}
                            className="real-estate-article-link"
                            href={article.articleUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {getArticleTitle(article)}
                          </a>
                        ) : (
                          <strong>{getArticleTitle(article)}</strong>
                        )}
                        {article.articleName ? <span>매물번호 {article.articleNo}</span> : null}
                        {article.buildingName || article.floorInfo ? (
                          <span>
                            {[article.buildingName, article.floorInfo].filter(Boolean).join(' · ')}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <strong>{formatKoreanHousePrice(article.price)}</strong>
                        <em className={article.priceGapPercentFromMedian !== null && article.priceGapPercentFromMedian < 0 ? 'below-average' : ''}>
                          {formatPercent(article.priceGapPercentFromMedian)}
                        </em>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="state-panel">{articleSectionTitle}이 없습니다.</div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}
