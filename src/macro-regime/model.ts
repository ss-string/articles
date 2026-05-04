export type RawMacroRegimeRow = Record<string, unknown>;

export type MacroRegimeMarket = 'KR' | 'US';

export type TrendTone = 'up' | 'down' | 'flat' | 'neutral';

export type AxisKey = 'growth' | 'inflation' | 'monetary' | 'liquidity';

export type MacroAxisAssessment = {
  key: AxisKey;
  label: string;
  judgment: string;
  rationale: string;
  confidence: number | null;
  confidenceLabel: string;
};

export type MacroKeyIndicator = {
  label: string;
  value: number | string | null;
  valueLabel: string;
  unit: string | null;
  source: string | null;
  trendLabel: string;
  trendTone: TrendTone;
  interpretation: string | null;
};

export type MacroRegimeDecision = {
  id: string;
  market: MacroRegimeMarket;
  runDate: string;
  dateLabel: string;
  regime: string;
  axisSummary: string;
  summary: string | null;
  axisAssessments: MacroAxisAssessment[];
  keyIndicators: MacroKeyIndicator[];
  assetImplications: string[];
  riskFactors: string[];
  contentMarkdown: string | null;
  updatedAt: string | null;
};

const axisDefinitions: ReadonlyArray<{ key: AxisKey; label: string }> = [
  { key: 'growth', label: '성장' },
  { key: 'inflation', label: '물가' },
  { key: 'monetary', label: '통화' },
  { key: 'liquidity', label: '유동성' },
];

function parseText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseMarket(value: unknown): MacroRegimeMarket | null {
  return value === 'KR' || value === 'US' ? value : null;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parseText).filter((item): item is string => item !== null);
}

function formatConfidence(value: unknown): { confidence: number | null; confidenceLabel: string } {
  const confidence = parseNumber(value);

  return {
    confidence,
    confidenceLabel: confidence === null ? '컨피던스 -' : `컨피던스 ${confidence.toFixed(2)}`,
  };
}

function formatIndicatorValue(value: unknown, unit: string | null): string {
  const text = parseText(value);
  if (text === null) {
    return '-';
  }

  return `${text}${unit ?? ''}`;
}

function isValidDateParts(year: string, month: string, day: string): boolean {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);
  const date = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay));

  return (
    date.getUTCFullYear() === parsedYear &&
    date.getUTCMonth() === parsedMonth - 1 &&
    date.getUTCDate() === parsedDay
  );
}

function parseRunDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  return formatDecisionDate(text) === '-' ? null : text;
}

export function formatDecisionDate(value: string | null): string {
  const text = parseText(value);
  if (!text) {
    return '-';
  }

  const datePart = text.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match || !isValidDateParts(match[1], match[2], match[3])) {
    return '-';
  }

  return `${match[1]}.${match[2]}.${match[3]}`;
}

export function formatTrendLabel(value: unknown): { label: string; tone: TrendTone } {
  switch (value) {
    case 'up':
      return { label: '↑ 상승', tone: 'up' };
    case 'down':
      return { label: '↓ 하락', tone: 'down' };
    case 'flat':
      return { label: '→ 보합', tone: 'flat' };
    default:
      return { label: '-', tone: 'neutral' };
  }
}

export function normalizeMacroRegimeRow(row: RawMacroRegimeRow): MacroRegimeDecision | null {
  const market = parseMarket(row.market);
  const runDate = parseRunDate(row.run_date);
  const regime = parseText(row.regime);

  if (!market || !runDate || !regime) {
    return null;
  }

  const axisRows = parseRecord(row.axis_assessments) ?? {};
  const axisAssessments = axisDefinitions.map(({ key, label }) => {
    const axisRow = parseRecord(axisRows[key]) ?? {};
    const { confidence, confidenceLabel } = formatConfidence(axisRow.confidence);

    return {
      key,
      label,
      judgment: parseText(axisRow.axis) ?? '-',
      rationale: parseText(axisRow.rationale) ?? '',
      confidence,
      confidenceLabel,
    };
  });

  const growth = axisAssessments.find((axis) => axis.key === 'growth')?.judgment ?? '-';
  const inflation = axisAssessments.find((axis) => axis.key === 'inflation')?.judgment ?? '-';
  const keyIndicators = Array.isArray(row.key_indicators)
    ? row.key_indicators.map((value) => {
        const indicator = parseRecord(value) ?? {};
        const unit = parseText(indicator.unit);
        const trend = formatTrendLabel(indicator.trend_3m);

        return {
          label: parseText(indicator.label) ?? '-',
          value: parseNumber(indicator.value) ?? parseText(indicator.value),
          valueLabel: formatIndicatorValue(indicator.value, unit),
          unit,
          source: parseText(indicator.source),
          trendLabel: trend.label,
          trendTone: trend.tone,
          interpretation: parseText(indicator.interpretation),
        };
      })
    : [];

  return {
    id: parseText(row.id) ?? `${runDate}-${market}`,
    market,
    runDate,
    dateLabel: formatDecisionDate(runDate),
    regime,
    axisSummary: `성장축은 ${growth}, 물가축은 ${inflation}로 판정됐습니다.`,
    summary: parseText(row.summary),
    axisAssessments,
    keyIndicators,
    assetImplications: parseTextArray(row.asset_implications),
    riskFactors: parseTextArray(row.risk_factors),
    contentMarkdown: parseText(row.content_md),
    updatedAt: parseText(row.updated_at),
  };
}

export function buildMacroRegimeDecisions(rows: RawMacroRegimeRow[]): MacroRegimeDecision[] {
  const marketOrder: Record<MacroRegimeMarket, number> = {
    KR: 0,
    US: 1,
  };

  return rows
    .map(normalizeMacroRegimeRow)
    .filter((decision): decision is MacroRegimeDecision => decision !== null)
    .sort((a, b) => marketOrder[a.market] - marketOrder[b.market]);
}
