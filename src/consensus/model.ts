export type RawConsensusRow = Record<string, unknown>;
export type RawSummaryReportRow = Record<string, unknown>;

export type ConsensusCheckpoint = {
  label: '현재 가격' | '지난 6개월' | '지난 3개월' | '지난 1개월' | '현재 컨센서스';
  price: number | null;
  changePercent: number | null;
};

export type TargetPriceRange = {
  min: number | null;
  median: number | null;
  max: number | null;
};

export type SecuritiesFirmSummary = {
  name: string;
  reportCount: number;
  targetPrices: number[];
  recommendations: string[];
};

export type ConsensusSummaryReport = {
  gicode: string;
  companyName: string | null;
  updatedAt: string | null;
  tlDr: string | null;
  keyKeywords: string[];
  risks: string[];
  targetPriceRange: TargetPriceRange;
  securitiesFirmCount: number | null;
  securitiesFirms: SecuritiesFirmSummary[];
};

export type ConsensusRankingRow = {
  id: string;
  name: string;
  code: string | null;
  gicode: string | null;
  currentPrice: number;
  fairPrice: number;
  gapAmount: number;
  gapPercent: number;
  reportCount: number | null;
  oneMonthConsensusPrice: number | null;
  oneMonthConsensusChangePercent: number | null;
  threeMonthConsensusPrice: number | null;
  sixMonthConsensusPrice: number | null;
  checkpoints: ConsensusCheckpoint[];
  summaryReport: ConsensusSummaryReport | null;
};

const columnCandidates = {
  name: ['stock_name', 'name', 'isu_nm', 'isu_abbrv', 'corp_name', '종목명'],
  code: ['stock_code', 'code', 'isu_srt_cd', 'ticker', '종목코드'],
  gicode: ['gicode', 'gi_code', 'fnguide_code', 'fn_guide_code'],
  reportCount: ['report_count', 'securities_firm_count', 'broker_count', '리포트수'],
  currentPrice: ['current_price_value', 'current_price', 'close_price', 'price', 'now_price', '현재가'],
  fairPrice: ['target_price_value', 'target_price', 'fair_price', 'consensus_price', '목표주가', '적정주가'],
  consensus1m: ['consensus_1m', 'target_price_1m', 'consensus_price_1m', '1개월컨센서스'],
  consensus3m: ['consensus_3m', 'target_price_3m', 'consensus_price_3m', '3개월컨센서스'],
  consensus6m: ['consensus_6m', 'target_price_6m', 'consensus_price_6m', '6개월컨센서스'],
} as const;

const trendValueCandidates = {
  consensus1m: ['month_ago', 'one_month_ago', '1m', 'D_2'],
  consensus3m: ['three_month_ago', '3m', 'D_3'],
  consensus6m: ['six_month_ago', '6m', 'D_4'],
  now: ['now', 'current', 'D_1'],
} as const;

function readValue(row: RawConsensusRow, candidates: readonly string[]) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }
  return null;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readObjectValue(value: unknown, candidates: readonly string[]) {
  const record = parseRecord(value);
  if (!record) {
    return null;
  }

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key];
    }
  }

  return null;
}

function readTrendValue(row: RawConsensusRow, candidates: readonly string[]) {
  return readObjectValue(row.consensus_trend_values, candidates);
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').replace(/%/g, '').trim();
    if (normalized.length === 0) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
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

function parseTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(parseText).filter((item): item is string => item !== null)
    : [];
}

function parseNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(parseNumber).filter((item): item is number => item !== null)
    : [];
}

function parseSecuritiesFirms(value: unknown): SecuritiesFirmSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = parseRecord(item);
    const name = parseText(record?.name);

    if (!record || !name) {
      return [];
    }

    return [
      {
        name,
        reportCount: parseNumber(record.reportCount) ?? 0,
        targetPrices: parseNumberArray(record.targetPrices),
        recommendations: parseTextArray(record.recommendations),
      },
    ];
  });
}

function calculateChangePercent(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

export function normalizeSummaryReport(row: RawSummaryReportRow): ConsensusSummaryReport | null {
  const gicode = parseText(row.gicode);
  const analysis = parseRecord(row.analysis);

  if (!gicode) {
    return null;
  }

  const targetPriceRange = parseRecord(analysis?.targetPriceRange);

  return {
    gicode,
    companyName: parseText(row.co_nm) ?? parseText(analysis?.companyName) ?? parseText(analysis?.stockName),
    updatedAt: parseText(row.updated_at),
    tlDr: parseText(analysis?.['tl;dr']) ?? parseText(analysis?.tlDr),
    keyKeywords: parseTextArray(analysis?.keyKeywords),
    risks: parseTextArray(analysis?.risks),
    targetPriceRange: {
      min: parseNumber(targetPriceRange?.min),
      median: parseNumber(targetPriceRange?.median),
      max: parseNumber(targetPriceRange?.max),
    },
    securitiesFirmCount: parseNumber(analysis?.securitiesFirmCount),
    securitiesFirms: parseSecuritiesFirms(analysis?.securitiesFirms),
  };
}

export function normalizeConsensusRow(row: RawConsensusRow): ConsensusRankingRow | null {
  const name = parseText(readValue(row, columnCandidates.name));
  const code = parseText(readValue(row, columnCandidates.code));
  const gicode = parseText(readValue(row, columnCandidates.gicode));
  const reportCount = parseNumber(readValue(row, columnCandidates.reportCount));
  const currentPrice = parseNumber(readValue(row, columnCandidates.currentPrice));
  const fairPrice =
    parseNumber(readValue(row, columnCandidates.fairPrice)) ??
    parseNumber(readTrendValue(row, trendValueCandidates.now));
  const oneMonthConsensusPrice =
    parseNumber(readValue(row, columnCandidates.consensus1m)) ??
    parseNumber(readTrendValue(row, trendValueCandidates.consensus1m));
  const threeMonthConsensusPrice =
    parseNumber(readValue(row, columnCandidates.consensus3m)) ??
    parseNumber(readTrendValue(row, trendValueCandidates.consensus3m));
  const sixMonthConsensusPrice =
    parseNumber(readValue(row, columnCandidates.consensus6m)) ??
    parseNumber(readTrendValue(row, trendValueCandidates.consensus6m));

  if (!name || currentPrice === null || currentPrice <= 0 || fairPrice === null || fairPrice <= 0) {
    return null;
  }

  const gapAmount = fairPrice - currentPrice;
  const gapPercent = (gapAmount / currentPrice) * 100;

  const checkpoints: ConsensusCheckpoint[] = [
    {
      label: '현재 가격',
      price: currentPrice,
      changePercent: null,
    },
    {
      label: '지난 6개월',
      price: sixMonthConsensusPrice,
      changePercent: calculateChangePercent(fairPrice, sixMonthConsensusPrice),
    },
    {
      label: '지난 3개월',
      price: threeMonthConsensusPrice,
      changePercent: calculateChangePercent(fairPrice, threeMonthConsensusPrice),
    },
    {
      label: '지난 1개월',
      price: oneMonthConsensusPrice,
      changePercent: calculateChangePercent(fairPrice, oneMonthConsensusPrice),
    },
    {
      label: '현재 컨센서스',
      price: fairPrice,
      changePercent: 0,
    },
  ];

  return {
    id: gicode ?? code ?? name,
    name,
    code,
    gicode,
    currentPrice,
    fairPrice,
    gapAmount,
    gapPercent,
    reportCount,
    oneMonthConsensusPrice,
    oneMonthConsensusChangePercent: calculateChangePercent(fairPrice, oneMonthConsensusPrice),
    threeMonthConsensusPrice,
    sixMonthConsensusPrice,
    checkpoints,
    summaryReport: null,
  };
}

export function buildRankingRowsWithReports(
  rows: RawConsensusRow[],
  reportRows: RawSummaryReportRow[],
): ConsensusRankingRow[] {
  const reportsByGicode = new Map(
    reportRows
      .map(normalizeSummaryReport)
      .filter((report): report is ConsensusSummaryReport => report !== null)
      .map((report) => [report.gicode, report]),
  );

  return rows
    .map(normalizeConsensusRow)
    .filter((row): row is ConsensusRankingRow => row !== null)
    .map((row) => ({
      ...row,
      summaryReport: row.gicode ? reportsByGicode.get(row.gicode) ?? null : null,
    }))
    .sort((a, b) => b.gapPercent - a.gapPercent);
}

export function buildRankingRows(rows: RawConsensusRow[]): ConsensusRankingRow[] {
  return buildRankingRowsWithReports(rows, []);
}

export function formatWon(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
