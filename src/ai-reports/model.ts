export type RawAiInvestmentReportRow = Record<string, unknown>;
export type AiReportScoreKey = 'total' | 'momentum' | 'technical' | 'valuation';
export type AgentKey = 'momentum' | 'technical' | 'valuation';
export type MarkdownBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; parts: Array<{ text: string; strong: boolean }> };
export type AiAgentFinding = {
  type: string;
  evidence: string;
  confidence: string | null;
  metric: string | null;
};
export type AiAgentOutput = {
  key: AgentKey;
  label: string;
  summary: string | null;
  score: number | null;
  stance: string | null;
  findings: AiAgentFinding[];
  risks: string[];
  limitations: string[];
};
export type AiInvestmentReport = {
  id: string;
  market: string | null;
  stockCode: string;
  stockName: string;
  issueDate: string | null;
  recommendation: string | null;
  currentPrice: number | null;
  currentPriceLabel: string;
  totalScore: number | null;
  momentumScore: number | null;
  technicalScore: number | null;
  valuationScore: number | null;
  contentMd: string;
  markdownBlocks: MarkdownBlock[];
  actionPlan: { hold: string | null; entry: string | null; exitOrReview: string | null };
  bullFindings: string[];
  bearFindings: string[];
  riskChecklist: string[];
  investmentThesis: string | null;
  agents: Record<AgentKey, AiAgentOutput | null>;
  createdAt: string | null;
  updatedAt: string | null;
  displayUpdatedAt: string | null;
  sortTimestamp: number;
};
export type AiInvestmentReportCatalog = {
  representativeReports: AiInvestmentReport[];
  reports: AiInvestmentReport[];
};

const agentLabels: Record<AgentKey, string> = {
  momentum: 'Momentum Agent',
  technical: 'Technical Agent',
  valuation: 'Valuation Agent',
};

const agentKeys: AgentKey[] = ['momentum', 'technical', 'valuation'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parseText).filter((text): text is string => text !== null);
}

function parseTimestamp(value: unknown): number {
  const text = parseText(value);
  if (!text) {
    return 0;
  }

  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatKoreanDateTime(value: unknown): string | null {
  const text = parseText(value);
  if (!text) {
    return null;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
}

function normalizeFindings(value: unknown): AiAgentFinding[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((finding) => {
      const evidence = parseText(finding.evidence);
      if (!evidence) {
        return null;
      }

      return {
        type: parseText(finding.type) ?? 'unknown',
        evidence,
        confidence: parseText(finding.confidence),
        metric: parseText(finding.metric),
      };
    })
    .filter((finding): finding is AiAgentFinding => finding !== null);
}

function normalizeAgentOutput(key: AgentKey, value: unknown): AiAgentOutput | null {
  if (!isRecord(value)) {
    return null;
  }

  const dataQuality = isRecord(value.dataQuality) ? value.dataQuality : null;

  return {
    key,
    label: agentLabels[key],
    summary: parseText(value.summary),
    score: parseNumber(value.score),
    stance: parseText(value.stance),
    findings: normalizeFindings(value.findings),
    risks: parseTextArray(value.risks),
    limitations: parseTextArray(dataQuality?.limitations),
  };
}

function createAgentRecord(value: unknown): Record<AgentKey, AiAgentOutput | null> {
  const outputs = isRecord(value) ? value : {};

  return agentKeys.reduce<Record<AgentKey, AiAgentOutput | null>>(
    (agents, key) => {
      agents[key] = normalizeAgentOutput(key, outputs[key]);
      return agents;
    },
    { momentum: null, technical: null, valuation: null },
  );
}

export function formatKoreanWon(value: unknown): string {
  const amount = parseNumber(value);
  if (amount === null) {
    return '현재가 없음';
  }

  return `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
}

function parseStrongParts(text: string): Array<{ text: string; strong: boolean }> {
  const parts: Array<{ text: string; strong: boolean }> = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), strong: false });
    }

    parts.push({ text: match[1], strong: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), strong: false });
  }

  return parts.length > 0 ? parts : [{ text, strong: false }];
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  return markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const heading = /^(#{2,3})\s+(.+)$/.exec(block);
      if (heading) {
        return { type: 'heading', level: heading[1].length as 2 | 3, text: heading[2].trim() };
      }

      return { type: 'paragraph', parts: parseStrongParts(block) };
    });
}

export function normalizeAiInvestmentReport(row: RawAiInvestmentReportRow): AiInvestmentReport | null {
  const payload = isRecord(row.report_payload) ? row.report_payload : null;
  const stockCode = parseText(row.stock_code);
  const stockName = parseText(row.stock_name);

  if (!stockCode || !stockName) {
    return null;
  }

  const contentMd = parseText(row.content_md) ?? parseText(payload?.contentMd) ?? '본문이 없습니다.';
  const currentPrice = parseNumber(row.current_price);
  const updatedAt = parseText(row.updated_at);
  const createdAt = parseText(row.created_at);
  const actionPlan = isRecord(payload?.actionPlan) ? payload.actionPlan : null;
  const sortTimestamp = parseTimestamp(updatedAt ?? createdAt);

  return {
    id: parseText(row.id) ?? `${stockCode}-${sortTimestamp}`,
    market: parseText(row.market),
    stockCode,
    stockName,
    issueDate: parseText(row.issue_date),
    recommendation: parseText(row.recommendation) ?? parseText(payload?.recommendation),
    currentPrice,
    currentPriceLabel: formatKoreanWon(currentPrice),
    totalScore: parseNumber(row.total_score) ?? parseNumber(payload?.totalScore),
    momentumScore: parseNumber(row.momentum_score),
    technicalScore: parseNumber(row.technical_score),
    valuationScore: parseNumber(row.valuation_score),
    contentMd,
    markdownBlocks: parseMarkdownBlocks(contentMd),
    actionPlan: {
      hold: parseText(actionPlan?.hold),
      entry: parseText(actionPlan?.entry),
      exitOrReview: parseText(actionPlan?.exitOrReview),
    },
    bullFindings: parseTextArray(payload?.bullFindings),
    bearFindings: parseTextArray(payload?.bearFindings),
    riskChecklist: parseTextArray(payload?.riskChecklist),
    investmentThesis: parseText(payload?.investmentThesis),
    agents: createAgentRecord(row.agent_outputs),
    createdAt,
    updatedAt,
    displayUpdatedAt: formatKoreanDateTime(updatedAt),
    sortTimestamp,
  };
}

export function buildAiInvestmentReportCatalog(rows: RawAiInvestmentReportRow[]): AiInvestmentReportCatalog {
  const reports = rows
    .map(normalizeAiInvestmentReport)
    .filter((report): report is AiInvestmentReport => report !== null)
    .sort((left, right) => right.sortTimestamp - left.sortTimestamp);
  const representativesByStockCode = new Map<string, AiInvestmentReport>();

  for (const report of reports) {
    if (!representativesByStockCode.has(report.stockCode)) {
      representativesByStockCode.set(report.stockCode, report);
    }
  }

  return {
    representativeReports: Array.from(representativesByStockCode.values()).sort(
      (left, right) => right.sortTimestamp - left.sortTimestamp,
    ),
    reports,
  };
}

export function selectReportHistory(reports: AiInvestmentReport[], stockCode: string): AiInvestmentReport[] {
  return reports
    .filter((report) => report.stockCode === stockCode)
    .sort((left, right) => right.sortTimestamp - left.sortTimestamp);
}
