export type RawRealEstateRow = Record<string, unknown>;

export type RawRealEstateTables = {
  interestTargets: RawRealEstateRow[];
  complexes: RawRealEstateRow[];
  pyeongOptions: RawRealEstateRow[];
  articles: RawRealEstateRow[];
  priceMetrics: RawRealEstateRow[];
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
};

export type RealEstateArticle = {
  articleNo: string;
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
  pyeongName: string | null;
  households: number | null;
  approvedAt: string | null;
  currentArticles: RealEstateArticle[];
  belowMedianArticles: RealEstateArticle[];
  metricsSeries: RealEstatePriceMetric[];
  latestMetric: RealEstatePriceMetric | null;
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
  households: ['households', 'household_count', 'total_household_number'],
  approvedAt: ['use_approved_at', 'use_approved_date', 'use_approval_date', 'approval_date'],
  pyeongName: ['display_pyeong_name', 'pyeong_name'],
  exclusiveSpace: ['exclusive_space', 'exclusiveSpace'],
  articleNo: ['article_number', 'article_no', 'articleNo', 'id'],
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

function parseComplexId(row: RawRealEstateRow): string | null {
  return parseText(readValue(row, columnCandidates.complexId));
}

function parsePyeongType(row: RawRealEstateRow): string | null {
  return parseText(readValue(row, columnCandidates.pyeongType));
}

function tableKey(complexId: string | null, pyeongType: string | null) {
  return complexId && pyeongType ? `${complexId}:${pyeongType}` : null;
}

function parseExclusiveSpace(row: RawRealEstateRow | null | undefined): number | null {
  return row ? parseNumber(readValue(row, columnCandidates.exclusiveSpace)) : null;
}

function mergeKey(complexId: string | null, pyeongType: string | null, pyeongOption: RawRealEstateRow | undefined) {
  if (!complexId || !pyeongType) {
    return null;
  }

  const exclusiveSpace = parseExclusiveSpace(pyeongOption);
  return exclusiveSpace === null ? tableKey(complexId, pyeongType) : `${complexId}:exclusive:${exclusiveSpace.toFixed(2)}`;
}

function sortByMetricDateAsc(left: RealEstatePriceMetric, right: RealEstatePriceMetric) {
  return (left.metricDate ?? '').localeCompare(right.metricDate ?? '');
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
      };
    })
    .sort(sortByMetricDateAsc);
}

function normalizeArticle(row: RawRealEstateRow, latestMedianPrice: number | null): RealEstateArticle | null {
  const complexId = parseComplexId(row);
  const pyeongType = parsePyeongType(row);
  const price = parseNumber(readValue(row, columnCandidates.price));
  const tradeType = parseText(readValue(row, columnCandidates.tradeType));

  if (!complexId || !pyeongType || price === null || !isSaleTradeType(tradeType)) {
    return null;
  }

  const priceGapFromMedian = latestMedianPrice === null ? null : price - latestMedianPrice;

  return {
    articleNo: parseText(readValue(row, columnCandidates.articleNo)) ?? `${complexId}:${pyeongType}:${price}`,
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
    (target) => mergeKey(target.complexId, target.pyeongType, target.pyeongOption),
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
