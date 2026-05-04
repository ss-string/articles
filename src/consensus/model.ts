export type RawConsensusRow = Record<string, unknown>;

export type ConsensusCheckpoint = {
  label: '지난 6개월' | '지난 3개월' | '지난 1개월' | '현재 컨센서스';
  price: number | null;
  changePercent: number | null;
};

export type ConsensusRankingRow = {
  id: string;
  name: string;
  code: string | null;
  currentPrice: number;
  fairPrice: number;
  gapAmount: number;
  gapPercent: number;
  oneMonthConsensusPrice: number | null;
  oneMonthConsensusChangePercent: number | null;
  threeMonthConsensusPrice: number | null;
  sixMonthConsensusPrice: number | null;
  checkpoints: ConsensusCheckpoint[];
};

const columnCandidates = {
  name: ['stock_name', 'name', 'isu_nm', 'isu_abbrv', 'corp_name', '종목명'],
  code: ['stock_code', 'code', 'isu_srt_cd', 'ticker', '종목코드'],
  currentPrice: ['current_price', 'close_price', 'price', 'now_price', '현재가'],
  fairPrice: ['target_price', 'fair_price', 'consensus_price', '목표주가', '적정주가'],
  consensus1m: ['consensus_1m', 'target_price_1m', 'consensus_price_1m', '1개월컨센서스'],
  consensus3m: ['consensus_3m', 'target_price_3m', 'consensus_price_3m', '3개월컨센서스'],
  consensus6m: ['consensus_6m', 'target_price_6m', 'consensus_price_6m', '6개월컨센서스'],
} as const;

function readValue(row: RawConsensusRow, candidates: readonly string[]) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replaceAll(',', '').replace('%', '').trim();
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

function calculateChangePercent(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

export function normalizeConsensusRow(row: RawConsensusRow): ConsensusRankingRow | null {
  const name = parseText(readValue(row, columnCandidates.name));
  const code = parseText(readValue(row, columnCandidates.code));
  const currentPrice = parseNumber(readValue(row, columnCandidates.currentPrice));
  const fairPrice = parseNumber(readValue(row, columnCandidates.fairPrice));
  const oneMonthConsensusPrice = parseNumber(readValue(row, columnCandidates.consensus1m));
  const threeMonthConsensusPrice = parseNumber(readValue(row, columnCandidates.consensus3m));
  const sixMonthConsensusPrice = parseNumber(readValue(row, columnCandidates.consensus6m));

  if (!name || currentPrice === null || currentPrice <= 0 || fairPrice === null || fairPrice <= 0) {
    return null;
  }

  const gapAmount = fairPrice - currentPrice;
  const gapPercent = (gapAmount / currentPrice) * 100;

  const checkpoints: ConsensusCheckpoint[] = [
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
    id: code ?? name,
    name,
    code,
    currentPrice,
    fairPrice,
    gapAmount,
    gapPercent,
    oneMonthConsensusPrice,
    oneMonthConsensusChangePercent: calculateChangePercent(fairPrice, oneMonthConsensusPrice),
    threeMonthConsensusPrice,
    sixMonthConsensusPrice,
    checkpoints,
  };
}

export function buildRankingRows(rows: RawConsensusRow[]): ConsensusRankingRow[] {
  return rows
    .map(normalizeConsensusRow)
    .filter((row): row is ConsensusRankingRow => row !== null)
    .sort((a, b) => b.gapPercent - a.gapPercent);
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
