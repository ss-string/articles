import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import {
  formatKoreanHousePrice,
  type RawRealEstateTables,
  type RealEstateArticle,
  type RealEstateChartPoint,
  type RealEstateInterestTarget,
} from '../real-estate/model';
import { useRealEstateTransactions } from '../real-estate/useRealEstateTransactions';

type RealEstateTransactionsPageProps = {
  queryTables?: () => Promise<RawRealEstateTables>;
};

type CompatibleActiveListingRange = NonNullable<RealEstateInterestTarget['activeListingRange']> & {
  minDealPrice?: number | null;
  maxDealPrice?: number | null;
};

type ChartViewPoint = {
  point: RealEstateChartPoint;
  x: number;
  y: number;
};

const chartSize = {
  width: 520,
  height: 242,
  paddingLeft: 42,
  paddingRight: 106,
  paddingTop: 58,
  paddingBottom: 34,
};

const dayMs = 24 * 60 * 60 * 1000;

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function getDisplayPyeongName(target: RealEstateInterestTarget) {
  return target.pyeongName ?? target.pyeongType;
}

function getArticleTitle(article: RealEstateArticle) {
  return article.articleName ?? `매물번호 ${article.articleNo}`;
}

function formatCount(value: number | null) {
  return value === null ? '-' : value.toLocaleString('ko-KR');
}

function formatEokPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  const eok = value / 100000000;
  return `${eok.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`;
}

function getRangeMin(range: RealEstateInterestTarget['activeListingRange']) {
  const compatibleRange = range as CompatibleActiveListingRange | null;
  return compatibleRange?.minPrice ?? compatibleRange?.minDealPrice ?? null;
}

function getRangeMax(range: RealEstateInterestTarget['activeListingRange']) {
  const compatibleRange = range as CompatibleActiveListingRange | null;
  return compatibleRange?.maxPrice ?? compatibleRange?.maxDealPrice ?? null;
}

function getActiveListingCount(target: RealEstateInterestTarget) {
  return target.currentArticles.length;
}

function hasActiveListingRange(target: RealEstateInterestTarget) {
  const count = target.activeListingRange?.count ?? 0;
  return count > 0 && getRangeMin(target.activeListingRange) !== null && getRangeMax(target.activeListingRange) !== null;
}

function formatActiveListingRange(target: RealEstateInterestTarget) {
  const minPrice = getRangeMin(target.activeListingRange);
  const maxPrice = getRangeMax(target.activeListingRange);

  if (getActiveListingCount(target) === 0 || minPrice === null || maxPrice === null) {
    return '현재 활성 매물 없음';
  }

  if (minPrice === maxPrice) {
    return formatEokPrice(minPrice);
  }

  return `${formatEokPrice(minPrice)}-${formatEokPrice(maxPrice)}`;
}

function formatRangeMarkerValue(target: RealEstateInterestTarget) {
  const minPrice = getRangeMin(target.activeListingRange);
  const maxPrice = getRangeMax(target.activeListingRange);

  if (!hasActiveListingRange(target) || minPrice === null || maxPrice === null) {
    return '현재 활성 매물 없음';
  }

  if (minPrice === maxPrice) {
    return formatEokPrice(minPrice);
  }

  return `${formatEokPrice(minPrice)}-${formatEokPrice(maxPrice)}`;
}

function parseDateMs(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortChartPointsByDate(points: RealEstateChartPoint[]) {
  return [...points].sort((left, right) => {
    const dateOrder = left.tradeDate.localeCompare(right.tradeDate);
    return dateOrder !== 0 ? dateOrder : left.dealPrice - right.dealPrice;
  });
}

function getLatestPoint(target: RealEstateInterestTarget) {
  const sortedPoints = sortChartPointsByDate(target.chartSeries);
  const pointsByRecentDate = [...sortedPoints].sort((left, right) => {
    const dateOrder = right.tradeDate.localeCompare(left.tradeDate);
    return dateOrder !== 0 ? dateOrder : right.dealPrice - left.dealPrice;
  });

  if (target.latestRealPrice !== null) {
    return pointsByRecentDate.find((point) => point.dealPrice === target.latestRealPrice) ?? pointsByRecentDate[0] ?? null;
  }

  return pointsByRecentDate[0] ?? null;
}

function getHighestPoint(target: RealEstateInterestTarget) {
  if (target.highestRealPrice !== null) {
    return (
      [...target.chartSeries]
        .filter((point) => point.dealPrice === target.highestRealPrice)
        .sort((left, right) => right.tradeDate.localeCompare(left.tradeDate))[0] ?? null
    );
  }

  return [...target.chartSeries].sort((left, right) => right.dealPrice - left.dealPrice)[0] ?? null;
}

function getReferenceDateMs(target: RealEstateInterestTarget, latestPoint: RealEstateChartPoint | null) {
  return parseDateMs(target.updatedAt) ?? parseDateMs(latestPoint?.tradeDate) ?? Date.now();
}

function getArticlePyeongName(target: RealEstateInterestTarget, article: RealEstateArticle) {
  const pyeongTypes = target.pyeongType.split(',');
  const pyeongNames = (target.pyeongName ?? '').split(' / ');
  const articleIndex = pyeongTypes.indexOf(article.pyeongType);

  return pyeongNames[articleIndex] ?? target.pyeongName ?? article.pyeongType;
}

function buildArticleMeta(target: RealEstateInterestTarget, article: RealEstateArticle) {
  return [getArticlePyeongName(target, article), article.buildingName, article.floorInfo].filter(Boolean).join(' · ');
}

function buildChartView(target: RealEstateInterestTarget) {
  const latestPoint = getLatestPoint(target);
  const referenceDateMs = getReferenceDateMs(target, latestPoint);
  const windowStartMs = referenceDateMs - 90 * dayMs;
  const plotWidth = chartSize.width - chartSize.paddingLeft - chartSize.paddingRight;
  const plotHeight = chartSize.height - chartSize.paddingTop - chartSize.paddingBottom;
  const rangeMin = getRangeMin(target.activeListingRange);
  const rangeMax = getRangeMax(target.activeListingRange);
  const domainValues = [
    ...target.chartSeries.map((point) => point.dealPrice),
    ...(rangeMin === null ? [] : [rangeMin]),
    ...(rangeMax === null ? [] : [rangeMax]),
  ].filter((value) => Number.isFinite(value));
  const rawMin = domainValues.length > 0 ? Math.min(...domainValues) : 0;
  const rawMax = domainValues.length > 0 ? Math.max(...domainValues) : 1;
  const rawRange = rawMax === rawMin ? Math.max(rawMax * 0.04, 1) : rawMax - rawMin;
  const domainMin = rawMin - rawRange * 0.12;
  const domainMax = rawMax + rawRange * 0.16;
  const domainRange = domainMax - domainMin;

  function getX(tradeDate: string) {
    const parsed = parseDateMs(tradeDate);
    if (parsed === null) {
      return chartSize.paddingLeft;
    }

    const ratio = (parsed - windowStartMs) / (referenceDateMs - windowStartMs);
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    return chartSize.paddingLeft + clampedRatio * plotWidth;
  }

  function getY(price: number) {
    return chartSize.height - chartSize.paddingBottom - ((price - domainMin) / domainRange) * plotHeight;
  }

  const viewPoints = sortChartPointsByDate(target.chartSeries).map((point) => ({
    point,
    x: getX(point.tradeDate),
    y: getY(point.dealPrice),
  }));
  const pointKey = (point: RealEstateChartPoint) => `${point.tradeDate}:${point.dealPrice}`;
  const viewPointByKey = new Map(viewPoints.map((viewPoint) => [pointKey(viewPoint.point), viewPoint]));
  const currentGuideX = chartSize.width - chartSize.paddingRight;
  const activeRangeExists = hasActiveListingRange(target);
  const activeRangeBox =
    activeRangeExists && rangeMin !== null && rangeMax !== null
      ? (() => {
          const topY = Math.min(getY(rangeMin), getY(rangeMax));
          const bottomY = Math.max(getY(rangeMin), getY(rangeMax));
          const height = Math.max(bottomY - topY, 42);
          const y = Math.min(chartSize.height - chartSize.paddingBottom - height, Math.max(chartSize.paddingTop + 2, topY));

          return {
            x: currentGuideX + 8,
            y,
            width: 88,
            height,
          };
        })()
      : null;

  return {
    viewPoints,
    polyline: viewPoints.map((point) => `${point.x},${point.y}`).join(' '),
    latestViewPoint: latestPoint ? viewPointByKey.get(pointKey(latestPoint)) ?? null : null,
    highestViewPoint: getHighestPoint(target) ? viewPointByKey.get(pointKey(getHighestPoint(target)!)) ?? null : null,
    currentGuideX,
    activeRangeBox,
  };
}

function buildChartDescription(target: RealEstateInterestTarget, chartView: ReturnType<typeof buildChartView>) {
  const parts = [
    chartView.latestViewPoint ? `최신 실거래 ${formatEokPrice(chartView.latestViewPoint.point.dealPrice)}` : '최근 90일 실거래 없음',
    chartView.highestViewPoint ? `최고 실거래 ${formatEokPrice(chartView.highestViewPoint.point.dealPrice)}` : null,
    hasActiveListingRange(target) ? `활성 매물 가격범위 ${formatRangeMarkerValue(target)}` : '현재 활성 매물 없음',
  ].filter((part): part is string => part !== null);

  return `${parts.join('. ')}.`;
}

function PriceChart({ target }: { target: RealEstateInterestTarget }) {
  const chartDescriptionId = useId();
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const chartView = useMemo(() => buildChartView(target), [target]);
  const displayPyeongName = getDisplayPyeongName(target);
  const activeViewPoint = activePointIndex === null ? null : chartView.viewPoints[activePointIndex] ?? null;
  const activeRangeExists = hasActiveListingRange(target);
  const emptyMessages = [
    chartView.viewPoints.length === 0 ? '최근 90일 실거래 없음' : null,
    chartView.viewPoints.length === 0 && !activeRangeExists ? '현재 활성 매물 없음' : null,
  ].filter((message): message is string => message !== null);

  return (
    <div
      className="real-estate-chart"
      aria-label={`${target.complexName} ${displayPyeongName} 최근 90일 실거래 그래프`}
      aria-describedby={chartDescriptionId}
      role="group"
    >
      <p id={chartDescriptionId} style={visuallyHiddenStyle}>
        {buildChartDescription(target, chartView)}
      </p>
      <svg aria-hidden="true" viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} focusable="false">
        <line className="real-estate-chart-grid" x1="24" x2="496" y1="58" y2="58" />
        <line className="real-estate-chart-grid" x1="24" x2="496" y1="133" y2="133" />
        <line className="real-estate-chart-grid" x1="24" x2="496" y1="208" y2="208" />
        <line
          className="real-estate-current-guide"
          x1={chartView.currentGuideX}
          x2={chartView.currentGuideX}
          y1={chartSize.paddingTop}
          y2={chartSize.height - chartSize.paddingBottom}
          stroke="#94a3b8"
          strokeDasharray="4 4"
        />
        {chartView.polyline ? <polyline className="real-estate-chart-line actual" points={chartView.polyline} /> : null}
        {chartView.viewPoints.map((viewPoint, index) => (
          <circle
            className="real-estate-chart-dot actual"
            cx={viewPoint.x}
            cy={viewPoint.y}
            key={`${viewPoint.point.tradeDate}-${viewPoint.point.dealPrice}-${index}`}
            r="4"
          />
        ))}
        {chartView.latestViewPoint ? (
          <g>
            <circle className="real-estate-chart-dot actual latest" cx={chartView.latestViewPoint.x} cy={chartView.latestViewPoint.y} r="6" />
            <text x={chartView.latestViewPoint.x + 8} y={Math.max(18, chartView.latestViewPoint.y - 8)} fill="#0f766e" fontSize="11" fontWeight="800">
              최신 {formatEokPrice(chartView.latestViewPoint.point.dealPrice)}
            </text>
          </g>
        ) : null}
        {chartView.highestViewPoint ? (
          <g>
            <circle className="real-estate-chart-dot actual highest" cx={chartView.highestViewPoint.x} cy={chartView.highestViewPoint.y} r="5" />
            <text
              x={chartView.highestViewPoint.x + 8}
              y={Math.min(chartSize.height - 12, chartView.highestViewPoint.y + 18)}
              fill="#047857"
              fontSize="11"
              fontWeight="800"
            >
              최고 {formatEokPrice(chartView.highestViewPoint.point.dealPrice)}
            </text>
          </g>
        ) : null}
        {chartView.activeRangeBox ? (
          <g>
            <rect
              className="real-estate-range-marker-box"
              fill="#dcfce7"
              height={chartView.activeRangeBox.height}
              rx="6"
              stroke="#16a34a"
              width={chartView.activeRangeBox.width}
              x={chartView.activeRangeBox.x}
              y={chartView.activeRangeBox.y}
            />
            <text
              className="real-estate-range-marker-label"
              fill="#166534"
              fontSize="8"
              fontWeight="850"
              x={chartView.activeRangeBox.x + 8}
              y={chartView.activeRangeBox.y + 17}
            >
              활성 매물 가격범위
            </text>
            <text
              className="real-estate-range-marker-value"
              fill="#14532d"
              fontSize="12"
              fontWeight="900"
              x={chartView.activeRangeBox.x + 8}
              y={chartView.activeRangeBox.y + 34}
            >
              {formatRangeMarkerValue(target)}
            </text>
          </g>
        ) : null}
      </svg>
      {emptyMessages.length > 0 ? (
        <div className="real-estate-chart-empty" style={{ position: 'absolute', inset: 0 }}>
          {emptyMessages.map((message) => (
            <span key={message}>{message}</span>
          ))}
        </div>
      ) : null}
      {chartView.viewPoints.map((viewPoint, index) => (
        <button
          aria-label={`${viewPoint.point.tradeDate} 실거래 보기`}
          className="real-estate-chart-hit-area"
          key={`${target.id}-hit-${viewPoint.point.tradeDate}-${viewPoint.point.dealPrice}-${index}`}
          style={{ left: `${(viewPoint.x / chartSize.width) * 100}%`, top: `${(viewPoint.y / chartSize.height) * 100}%` }}
          type="button"
          onBlur={() => setActivePointIndex(null)}
          onFocus={() => setActivePointIndex(index)}
          onMouseEnter={() => setActivePointIndex(index)}
          onMouseLeave={() => setActivePointIndex(null)}
        />
      ))}
      {activeViewPoint ? (
        <div
          aria-label={`${activeViewPoint.point.tradeDate} 실거래`}
          className="real-estate-chart-tooltip"
          role="status"
          style={{
            left: `${(activeViewPoint.x / chartSize.width) * 100}%`,
            top: `${(activeViewPoint.y / chartSize.height) * 100}%`,
          }}
        >
          <strong>{activeViewPoint.point.tradeDate}</strong>
          <span>실거래 {formatEokPrice(activeViewPoint.point.dealPrice)}</span>
          <span>구분 매매</span>
        </div>
      ) : null}
    </div>
  );
}

export function RealEstateTransactionsPage({ queryTables }: RealEstateTransactionsPageProps) {
  const state = useRealEstateTransactions({ queryTables });
  const targets = state.dashboard.targets;
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

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
  const visibleArticles = selectedTarget?.currentArticles ?? [];

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
              const activeListingCount = getActiveListingCount(target);

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
                    <span>활성 매물 {activeListingCount.toLocaleString('ko-KR')}건</span>
                    <em>{formatActiveListingRange(target)}</em>
                  </button>
                </article>
              );
            })}
          </aside>

          <div className="real-estate-main">
            <div className="summary-grid real-estate-summary-grid">
              <article className="summary-card">
                <span>최신 실거래</span>
                <strong>{formatEokPrice(selectedTarget.latestRealPrice)}</strong>
              </article>
              <article className="summary-card">
                <span>최고 실거래</span>
                <strong>{formatEokPrice(selectedTarget.highestRealPrice)}</strong>
              </article>
              <article className="summary-card">
                <span>현재 활성 매물</span>
                <strong>{getActiveListingCount(selectedTarget).toLocaleString('ko-KR')}건</strong>
              </article>
            </div>

            <section className="real-estate-panel">
              <header className="real-estate-panel-header">
                <div>
                  <span>최근 90일 · 매매</span>
                  <h3>{selectedTarget.complexName} {getDisplayPyeongName(selectedTarget)} 실거래 흐름</h3>
                </div>
                <div className="real-estate-chart-legend" aria-hidden="true">
                  <span className="actual">실거래</span>
                </div>
              </header>
              <PriceChart target={selectedTarget} />
            </section>

            <section className="real-estate-panel" aria-label="현재 활성 매물">
              <header className="real-estate-panel-header">
                <div>
                  <span>Active Listings</span>
                  <h3>현재 활성 매물</h3>
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
                        <span>{buildArticleMeta(selectedTarget, article)}</span>
                      </div>
                      <div>
                        <strong>{formatKoreanHousePrice(article.price)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="state-panel">현재 활성 매물 없음</div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </section>
  );
}
