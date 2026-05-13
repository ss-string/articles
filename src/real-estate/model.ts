export type RawRealEstateRow = Record<string, unknown>;

export type RawRealEstateTables = {
  interestTargets: RawRealEstateRow[];
  complexes: RawRealEstateRow[];
  pyeongOptions: RawRealEstateRow[];
  articles: RawRealEstateRow[];
  priceMetrics: RawRealEstateRow[];
};

export type RealEstateChartPoint = {
  tradeDate: string;
  dealPrice: number;
};

export type RealEstateActiveListingRange = {
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export type RealEstateChartData = {
  series: RealEstateChartPoint[];
  activeListingRange: RealEstateActiveListingRange | null;
};

export type RealEstatePriceMetric = {
  complexId: string;
  pyeongType: string;
  tradeType: string | null;
  windowMonths: number | null;
  metricDate: string | null;
  actualAveragePrice: number | null;
  askingAveragePrice: number | null;
  actualMedianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  chartData: RealEstateChartData | null;
};

export type RealEstateArticle = {
  articleNo: string;
  articleName: string | null;
  articleUrl: string | null;
  complexId: string;
  pyeongType: string;
  tradeType: string | null;
  price: number;
  buildingName: string | null;
  floorInfo: string | null;
  priceGapFromMedian: number | null;
  priceGapPercentFromMedian: number | null;
};

export type RealEstateInterestTarget = {
  id: string;
  complexId: string;
  pyeongType: string;
  sortOrder: number;
  complexName: string;
  complexUrl: string | null;
  pyeongName: string | null;
  households: number | null;
  approvedAt: string | null;
  currentArticles: RealEstateArticle[];
  belowMedianArticles: RealEstateArticle[];
  metricsSeries: RealEstatePriceMetric[];
  latestMetric: RealEstatePriceMetric | null;
  chartSeries: RealEstateChartPoint[];
  latestRealPrice: number | null;
  highestRealPrice: number | null;
  activeListingRange: RealEstateActiveListingRange | null;
  updatedAt: string | null;
};

export type RealEstateDashboard = {
  targets: RealEstateInterestTarget[];
};

const emptyDashboard: RealEstateDashboard = { targets: [] };

const columnCandidates = {
  id: ['id', 'target_id'],
  complexId: ['complex_id', 'complexId'],
  pyeongType: ['pyeong_type', 'pyeongType'],
  sortOrder: ['sort_order', 'sortOrder', 'display_order'],
  complexName: ['complex_name', 'name'],
  complexUrl: ['complex_url', 'complexUrl'],
  households: ['households', 'household_count', 'total_household_number'],
  approvedAt: ['use_approved_at', 'use_approved_date', 'use_approval_date', 'approval_date'],
  pyeongName: ['display_pyeong_name', 'pyeong_name'],
  exclusiveSpace: ['exclusive_space', 'exclusiveSpace'],
  articleNo: ['article_number', 'article_no', 'articleNo', 'id'],
  articleName: ['article_name', 'articleName'],
  articleUrl: ['article_url', 'articleUrl'],
  tradeType: ['trade_type', 'tradeType', 'trade_type_name'],
  price: ['price', 'deal_price', 'deal_or_warrant_prc', 'asking_price'],
  buildingName: ['building_name', 'buildingName', 'dong_name'],
  floorInfo: ['floor_info', 'floorInfo', 'floor'],
  windowMonths: ['window_months', 'windowMonths'],
  metricDate: ['metric_date', 'collected_at', 'last_seen_at', 'updated_at', 'created_at'],
  actualAveragePrice: ['actual_average_price', 'actual_avg_price', 'trade_average_price', 'average_price'],
  askingAveragePrice: ['asking_average_price', 'asking_avg_price', 'article_average_price'],
  actualMedianPrice: ['actual_median_price', 'median_deal_price', 'median_price', 'trade_median_price'],
  minPrice: ['min_price', 'min_deal_price', 'actual_min_price', 'asking_min_price'],
  maxPrice: ['max_price', 'max_deal_price', 'actual_max_price', 'asking_max_price'],
  isActive: ['is_active', 'isActive'],
  removedAt: ['removed_at', 'removedAt'],
} as const;

function readValue(row: RawRealEstateRow, candidates: readonly string[]) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
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

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (normalized.length === 0) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1 ? true : value === 0 ? false : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 't', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', 'f', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function parseComplexId(row: RawRealEstateRow): string | null {
  return parseText(readValue(row, columnCandidates.complexId));
}

function parsePyeongType(row: RawRealEstateRow): string | null {
  return parseText(readValue(row, columnCandidates.pyeongType));
}

function tableKey(complexId: string | null, pyeongType: string | null) {
  return complexId && pyeongType ? `${complexId}:${pyeongType}` : null;
}

function buildNaverComplexUrl(complexId: string) {
  return `https://fin.land.naver.com/complexes/${encodeURIComponent(complexId)}?tab=article`;
}

function buildNaverArticleUrl(articleNo: string) {
  return `https://fin.land.naver.com/articles/${encodeURIComponent(articleNo)}`;
}

function mergeKey(complexId: string | null) {
  if (!complexId) {
    return null;
  }

  return complexId;
}

function sortByMetricDateAsc(left: RealEstatePriceMetric, right: RealEstatePriceMetric) {
  return (left.metricDate ?? '').localeCompare(right.metricDate ?? '');
}

function sortChartPointAsc(left: RealEstateChartPoint, right: RealEstateChartPoint) {
  const dateOrder = left.tradeDate.localeCompare(right.tradeDate);
  return dateOrder !== 0 ? dateOrder : left.dealPrice - right.dealPrice;
}

function isSaleTradeType(value: string | null) {
  if (value === null) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ['매매', 'sale', 'a1'].includes(normalized);
}

function averageNumbers(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return numbers.length === 0 ? null : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function minNumber(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return numbers.length === 0 ? null : Math.min(...numbers);
}

function maxNumber(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return numbers.length === 0 ? null : Math.max(...numbers);
}

function parseRawRealPriceAverage(row: RawRealEstateRow): number | null {
  const rawRealPrice = row.raw_real_price;

  if (!rawRealPrice || typeof rawRealPrice !== 'object' || !('records' in rawRealPrice)) {
    return null;
  }

  const records = (rawRealPrice as { records?: unknown }).records;
  if (!Array.isArray(records)) {
    return null;
  }

  return averageNumbers(
    records.map((record) => {
      if (!record || typeof record !== 'object') {
        return null;
      }

      return parseNumber((record as { dealPrice?: unknown; deal_price?: unknown }).dealPrice ?? (record as { deal_price?: unknown }).deal_price);
    }),
  );
}

function normalizeChartPoint(value: unknown): RealEstateChartPoint | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const row = value as Record<string, unknown>;
  const tradeDate = parseText(row.tradeDate ?? row.trade_date);
  const dealPrice = parseNumber(row.dealPrice ?? row.deal_price);

  return tradeDate && dealPrice !== null ? { tradeDate, dealPrice } : null;
}

function normalizeActiveListingRange(value: unknown): RealEstateActiveListingRange | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const row = value as Record<string, unknown>;
  const count = parseNumber(row.count);
  const minPrice = parseNumber(row.minDealPrice ?? row.min_deal_price ?? row.minPrice ?? row.min_price);
  const maxPrice = parseNumber(row.maxDealPrice ?? row.max_deal_price ?? row.maxPrice ?? row.max_price);

  if (count === null && minPrice === null && maxPrice === null) {
    return null;
  }

  return {
    count: count ?? 0,
    minPrice,
    maxPrice,
  };
}

function normalizeChartData(value: unknown): RealEstateChartData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const row = value as Record<string, unknown>;
  const rawSeries = Array.isArray(row.series) ? row.series : [];
  const series = rawSeries.map(normalizeChartPoint).filter((point): point is RealEstateChartPoint => point !== null);
  const activeListingRange = normalizeActiveListingRange(row.activeListingRange ?? row.active_listing_range);

  if (series.length === 0 && activeListingRange === null) {
    return null;
  }

  return { series, activeListingRange };
}

function normalizeMetric(row: RawRealEstateRow): RealEstatePriceMetric | null {
  const complexId = parseComplexId(row);
  const pyeongType = parsePyeongType(row);
  const actualMedianPrice = parseNumber(readValue(row, columnCandidates.actualMedianPrice));

  if (!complexId || !pyeongType) {
    return null;
  }

  return {
    complexId,
    pyeongType,
    tradeType: parseText(readValue(row, columnCandidates.tradeType)),
    windowMonths: parseNumber(readValue(row, columnCandidates.windowMonths)),
    metricDate: parseText(readValue(row, columnCandidates.metricDate)),
    actualAveragePrice:
      parseNumber(readValue(row, columnCandidates.actualAveragePrice)) ?? parseRawRealPriceAverage(row) ?? actualMedianPrice,
    askingAveragePrice: parseNumber(readValue(row, columnCandidates.askingAveragePrice)),
    actualMedianPrice,
    minPrice: parseNumber(readValue(row, columnCandidates.minPrice)),
    maxPrice: parseNumber(readValue(row, columnCandidates.maxPrice)),
    chartData: normalizeChartData(row.chart_data ?? row.chartData),
  };
}

function selectTargetMetrics(metrics: RealEstatePriceMetric[]) {
  const saleMetrics = metrics.filter((metric) => {
    if (metric.tradeType === null) {
      return true;
    }

    return isSaleTradeType(metric.tradeType);
  });
  const source = saleMetrics.length > 0 ? saleMetrics : metrics;
  const windowedSource = (() => {
    if (source.some((metric) => metric.windowMonths === 3)) {
      return source.filter((metric) => metric.windowMonths === 3);
    }

    const windowValues = source
      .map((metric) => metric.windowMonths)
      .filter((value): value is number => value !== null);

    if (windowValues.length === 0) {
      return source;
    }

    const shortestWindow = Math.min(...windowValues);
    return source.filter((metric) => metric.windowMonths === shortestWindow);
  })();

  return [...windowedSource].sort(sortByMetricDateAsc);
}

function aggregateMetrics(metrics: RealEstatePriceMetric[]): RealEstatePriceMetric[] {
  const grouped = groupByKey(
    metrics,
    (metric) => `${metric.metricDate ?? ''}:${metric.tradeType ?? ''}:${metric.windowMonths ?? ''}`,
  );

  return Array.from(grouped.values())
    .map((items) => {
      const first = items[0]!;

      return {
        complexId: first.complexId,
        pyeongType: first.pyeongType,
        tradeType: first.tradeType,
        windowMonths: first.windowMonths,
        metricDate: first.metricDate,
        actualAveragePrice: averageNumbers(items.map((item) => item.actualAveragePrice)),
        askingAveragePrice: averageNumbers(items.map((item) => item.askingAveragePrice)),
        actualMedianPrice: averageNumbers(items.map((item) => item.actualMedianPrice)),
        minPrice: minNumber(items.map((item) => item.minPrice)),
        maxPrice: maxNumber(items.map((item) => item.maxPrice)),
        chartData: mergeChartData(items.map((item) => item.chartData)),
      };
    })
    .sort(sortByMetricDateAsc);
}

function normalizeArticle(row: RawRealEstateRow, latestMedianPrice: number | null): RealEstateArticle | null {
  const complexId = parseComplexId(row);
  const pyeongType = parsePyeongType(row);
  const price = parseNumber(readValue(row, columnCandidates.price));
  const tradeType = parseText(readValue(row, columnCandidates.tradeType));

  const isActive = parseBoolean(readValue(row, columnCandidates.isActive));
  const removedAt = parseText(readValue(row, columnCandidates.removedAt));

  if (
    !complexId ||
    !pyeongType ||
    price === null ||
    !isSaleTradeType(tradeType) ||
    isActive !== true ||
    removedAt !== null
  ) {
    return null;
  }

  const priceGapFromMedian = latestMedianPrice === null ? null : price - latestMedianPrice;

  const articleNo = parseText(readValue(row, columnCandidates.articleNo)) ?? `${complexId}:${pyeongType}:${price}`;

  return {
    articleNo,
    articleName: parseText(readValue(row, columnCandidates.articleName)),
    articleUrl: parseText(readValue(row, columnCandidates.articleUrl)) ?? buildNaverArticleUrl(articleNo),
    complexId,
    pyeongType,
    tradeType,
    price,
    buildingName: parseText(readValue(row, columnCandidates.buildingName)),
    floorInfo: parseText(readValue(row, columnCandidates.floorInfo)),
    priceGapFromMedian,
    priceGapPercentFromMedian:
      latestMedianPrice === null || latestMedianPrice <= 0 ? null : (priceGapFromMedian! / latestMedianPrice) * 100,
  };
}

function groupByKey<T>(items: T[], getKey: (item: T) => string | null) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    if (!key) {
      continue;
    }

    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return grouped;
}

function mapByKey<T>(items: T[], getKey: (item: T) => string | null) {
  const mapped = new Map<string, T>();

  for (const item of items) {
    const key = getKey(item);
    if (key) {
      mapped.set(key, item);
    }
  }

  return mapped;
}

function mergeChartData(chartDataItems: Array<RealEstateChartData | null>): RealEstateChartData | null {
  const pointByKey = new Map<string, RealEstateChartPoint>();
  const ranges: RealEstateActiveListingRange[] = [];

  for (const chartData of chartDataItems) {
    if (!chartData) {
      continue;
    }

    for (const point of chartData.series) {
      pointByKey.set(`${point.tradeDate}:${point.dealPrice}`, point);
    }

    if (chartData.activeListingRange) {
      ranges.push(chartData.activeListingRange);
    }
  }

  const series = Array.from(pointByKey.values()).sort(sortChartPointAsc);
  const activeListingRange = mergeActiveListingRanges([], ranges);

  if (series.length === 0 && activeListingRange === null) {
    return null;
  }

  return { series, activeListingRange };
}

function mergeChartSeries(metrics: RealEstatePriceMetric[]) {
  const pointByKey = new Map<string, RealEstateChartPoint>();

  for (const metric of metrics) {
    for (const point of metric.chartData?.series ?? []) {
      pointByKey.set(`${point.tradeDate}:${point.dealPrice}`, point);
    }
  }

  return Array.from(pointByKey.values()).sort(sortChartPointAsc);
}

function getLatestRealPrice(series: RealEstateChartPoint[]) {
  const latest = [...series].sort((left, right) => {
    const dateOrder = right.tradeDate.localeCompare(left.tradeDate);
    return dateOrder !== 0 ? dateOrder : right.dealPrice - left.dealPrice;
  })[0];

  return latest?.dealPrice ?? null;
}

function getHighestRealPrice(series: RealEstateChartPoint[]) {
  return maxNumber(series.map((point) => point.dealPrice));
}

function mergeActiveListingRanges(
  articles: RealEstateArticle[],
  chartRanges: Array<RealEstateActiveListingRange | null>,
): RealEstateActiveListingRange | null {
  const ranges = chartRanges.filter((range): range is RealEstateActiveListingRange => range !== null);

  if (articles.length > 0) {
    return {
      count: articles.length,
      minPrice: minNumber([...articles.map((article) => article.price), ...ranges.map((range) => range.minPrice)]),
      maxPrice: maxNumber([...articles.map((article) => article.price), ...ranges.map((range) => range.maxPrice)]),
    };
  }

  if (ranges.length === 0) {
    return null;
  }

  return {
    count: ranges.reduce((sum, range) => sum + range.count, 0),
    minPrice: minNumber(ranges.map((range) => range.minPrice)),
    maxPrice: maxNumber(ranges.map((range) => range.maxPrice)),
  };
}

function latestText(values: Array<string | null>) {
  const texts = values.filter((value): value is string => value !== null);
  const sortedTexts = [...texts].sort();
  return sortedTexts.length === 0 ? null : sortedTexts[sortedTexts.length - 1] ?? null;
}

export function buildRealEstateDashboard(tables: RawRealEstateTables): RealEstateDashboard {
  const complexesById = mapByKey(tables.complexes, parseComplexId);
  const pyeongOptionsByKey = mapByKey(tables.pyeongOptions, (row) => tableKey(parseComplexId(row), parsePyeongType(row)));
  const metricsByKey = groupByKey(
    tables.priceMetrics.map(normalizeMetric).filter((metric): metric is RealEstatePriceMetric => metric !== null),
    (metric) => tableKey(metric.complexId, metric.pyeongType),
  );
  const targetGroups = groupByKey(
    tables.interestTargets
      .map((row) => {
        const complexId = parseComplexId(row);
        const pyeongType = parsePyeongType(row);
        const key = tableKey(complexId, pyeongType);
        const pyeongOption = key ? pyeongOptionsByKey.get(key) : undefined;

        if (!complexId || !pyeongType || !key) {
          return null;
        }

        return {
          row,
          complexId,
          pyeongType,
          key,
          pyeongOption,
          sortOrder: parseNumber(readValue(row, columnCandidates.sortOrder)) ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .filter(
        (
          target,
        ): target is {
          row: RawRealEstateRow;
          complexId: string;
          pyeongType: string;
          key: string;
          pyeongOption: RawRealEstateRow | undefined;
          sortOrder: number;
        } => target !== null,
      ),
    (target) => mergeKey(target.complexId),
  );

  const targets = Array.from(targetGroups.entries())
    .map(([groupKey, groupedTargets]): RealEstateInterestTarget | null => {
      const sortedTargets = [...groupedTargets].sort((left, right) => left.sortOrder - right.sortOrder);
      const firstTarget = sortedTargets[0];
      if (!firstTarget) {
        return null;
      }

      const { complexId } = firstTarget;
      const pyeongTypes = new Set(sortedTargets.map((target) => target.pyeongType));
      const complex = complexesById.get(complexId);
      const rawMetrics = sortedTargets.flatMap((target) => metricsByKey.get(target.key) ?? []);
      const metricsSeries = aggregateMetrics(selectTargetMetrics(rawMetrics));
      const latestMetricWithoutAsking = metricsSeries.length > 0 ? metricsSeries[metricsSeries.length - 1] : null;
      const latestMedianPrice = latestMetricWithoutAsking?.actualMedianPrice ?? null;
      const currentArticles = tables.articles
        .map((article) => normalizeArticle(article, latestMedianPrice))
        .filter(
          (article): article is RealEstateArticle =>
            article !== null && article.complexId === complexId && pyeongTypes.has(article.pyeongType),
        )
        .sort((left, right) => left.price - right.price);
      const articleAskingAverage = averageNumbers(currentArticles.map((article) => article.price));
      const metricsSeriesWithAsking = metricsSeries.map((metric) => ({
        ...metric,
        askingAveragePrice: metric.askingAveragePrice ?? articleAskingAverage,
      }));
      const latestMetric = metricsSeriesWithAsking.length > 0 ? metricsSeriesWithAsking[metricsSeriesWithAsking.length - 1] : null;
      const chartSeries = mergeChartSeries(metricsSeriesWithAsking);
      const activeListingRange = mergeActiveListingRanges(
        currentArticles,
        metricsSeriesWithAsking.map((metric) => metric.chartData?.activeListingRange ?? null),
      );
      const pyeongNames = sortedTargets
        .map(
          (target) =>
            parseText(readValue(target.row, columnCandidates.pyeongName)) ??
            parseText(target.pyeongOption ? readValue(target.pyeongOption, columnCandidates.pyeongName) : null) ??
            target.pyeongType,
        )
        .filter((name, index, names) => names.indexOf(name) === index);

      return {
        id: groupKey,
        complexId,
        pyeongType: sortedTargets.map((target) => target.pyeongType).join(','),
        sortOrder: firstTarget.sortOrder,
        complexName:
          parseText(readValue(firstTarget.row, columnCandidates.complexName)) ??
          parseText(complex ? readValue(complex, columnCandidates.complexName) : null) ??
          complexId,
        complexUrl:
          parseText(readValue(firstTarget.row, columnCandidates.complexUrl)) ??
          parseText(complex ? readValue(complex, columnCandidates.complexUrl) : null) ??
          buildNaverComplexUrl(complexId),
        pyeongName: pyeongNames.join(' / '),
        households: parseNumber(complex ? readValue(complex, columnCandidates.households) : null),
        approvedAt: parseText(complex ? readValue(complex, columnCandidates.approvedAt) : null),
        currentArticles,
        belowMedianArticles:
          latestMedianPrice === null
            ? []
            : currentArticles.filter((article) => article.price <= latestMedianPrice).sort((left, right) => left.price - right.price),
        metricsSeries: metricsSeriesWithAsking,
        latestMetric,
        chartSeries,
        latestRealPrice: getLatestRealPrice(chartSeries),
        highestRealPrice: getHighestRealPrice(chartSeries),
        activeListingRange,
        updatedAt: latestText(metricsSeriesWithAsking.map((metric) => metric.metricDate)),
      };
    })
    .filter((target): target is RealEstateInterestTarget => target !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return { targets };
}

export function formatKoreanHousePrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  const eok = Math.floor(value / 100000000);
  const man = Math.round((value % 100000000) / 10000);
  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${eok.toLocaleString('ko-KR')}억`);
  }

  if (man > 0) {
    parts.push(`${man.toLocaleString('ko-KR')}만`);
  }

  return parts.length > 0 ? parts.join(' ') : '0';
}

export { emptyDashboard };
