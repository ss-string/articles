export type RawHotNewsReportRow = Record<string, unknown>;

export type HotNewsArticle = {
  title: string;
  link: string | null;
};

export type HotNewsCompanyEvidence = {
  company: string;
  code: string | null;
  position: string | null;
  evidence: string[];
  links: string[];
};

export type HotNewsChangeStatus =
  | 'initial'
  | 'refresh'
  | 'material_change'
  | 'deduplicated'
  | (string & {});

export type HotNewsReport = {
  id: string;
  issueDate: string | null;
  displayDate: string;
  title: string;
  displayTitle: string;
  perspective: string | null;
  perspectiveKey: string | null;
  runSlot: string | null;
  isLatest: boolean;
  changeStatus: HotNewsChangeStatus | null;
  changeReason: string | null;
  materialChangeScore: number;
  sourceNewsIds: string[];
  companyCodes: string[];
  positionMap: Record<string, string>;
  updatedAt: string | null;
  displayUpdatedAt: string | null;
  interpretation: string | null;
  tldr: string[];
  keyArticles: HotNewsArticle[];
  companyEvidence: HotNewsCompanyEvidence[];
};

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

function parseTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parseText).filter((text): text is string => text !== null);
}

function parseNumber(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseChangeStatus(value: unknown): HotNewsChangeStatus | null {
  return parseText(value);
}

function normalizePositionMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>((positionMap, [key, rawPosition]) => {
    const position = parseText(rawPosition);
    if (position) {
      positionMap[key] = position;
    }

    return positionMap;
  }, {});
}

function normalizeArticles(value: unknown): HotNewsArticle[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((article) => {
      const title = parseText(article.title);
      if (!title) {
        return null;
      }

      return {
        title,
        link: parseText(article.link),
      };
    })
    .filter((article): article is HotNewsArticle => article !== null);
}

function normalizeCompanyEvidence(value: unknown): HotNewsCompanyEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => {
      const company = parseText(item.company);
      if (!company) {
        return null;
      }

      return {
        company,
        code: parseText(item.code),
        position: parseText(item.position),
        evidence: parseTextArray(item.detailedEvidence),
        links: parseTextArray(item.detailedNewsLinks),
      };
    })
    .filter((item): item is HotNewsCompanyEvidence => item !== null);
}

function preferText(payload: Record<string, unknown> | null, row: RawHotNewsReportRow, payloadKey: string, rowKey: string) {
  return parseText(payload?.[payloadKey]) ?? parseText(row[rowKey]);
}

function preferTextArray(payload: Record<string, unknown> | null, row: RawHotNewsReportRow, payloadKey: string, rowKey: string) {
  const payloadValues = parseTextArray(payload?.[payloadKey]);
  return payloadValues.length > 0 ? payloadValues : parseTextArray(row[rowKey]);
}

function preferArticles(payload: Record<string, unknown> | null, row: RawHotNewsReportRow) {
  const payloadArticles = normalizeArticles(payload?.keyArticles);
  return payloadArticles.length > 0 ? payloadArticles : normalizeArticles(row.key_articles);
}

function preferCompanyEvidence(payload: Record<string, unknown> | null, row: RawHotNewsReportRow) {
  const payloadEvidence = normalizeCompanyEvidence(payload?.companyNewsEvidence);
  return payloadEvidence.length > 0 ? payloadEvidence : normalizeCompanyEvidence(row.company_news_evidence);
}

export function formatIssueDate(value: unknown): string {
  const text = parseText(value);
  if (!text) {
    return '-';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return text;
  }

  return `${match[1]}.${match[2]}.${match[3]}`;
}

export function stripIssueDatePrefix(value: string): string {
  return value.replace(/^\d{4}-\d{2}-\d{2}\s+/, '');
}

export function formatKoreanDateTime(value: unknown): string | null {
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

export function getHotNewsChangeStatusLabel(status: HotNewsChangeStatus | null): string {
  if (!status) {
    return '상태 없음';
  }

  const labels: Record<HotNewsChangeStatus, string> = {
    initial: '초기 문서',
    refresh: '새로고침 업데이트',
    material_change: '중요 변경 업데이트',
    deduplicated: '중복 정리됨',
  };

  return labels[status] ?? status;
}

export function normalizeHotNewsReport(row: RawHotNewsReportRow): HotNewsReport | null {
  const payload = isRecord(row.report_payload) ? row.report_payload : null;
  const title = preferText(payload, row, 'title', 'title');

  if (!title) {
    return null;
  }

  const issueDate = parseText(row.issue_date);
  const updatedAt = parseText(row.updated_at) ?? parseText(row.created_at);

  return {
    id: parseText(row.id) ?? title,
    issueDate,
    displayDate: formatIssueDate(row.issue_date),
    title,
    displayTitle: stripIssueDatePrefix(title),
    perspective: parseText(row.perspective),
    perspectiveKey: parseText(row.perspective_key),
    runSlot: parseText(row.run_slot),
    isLatest: row.is_latest === true,
    changeStatus: parseChangeStatus(row.change_status),
    changeReason: parseText(row.change_reason),
    materialChangeScore: parseNumber(row.material_change_score),
    sourceNewsIds: parseTextArray(row.source_news_ids),
    companyCodes: parseTextArray(row.company_codes),
    positionMap: normalizePositionMap(row.position_map),
    updatedAt,
    displayUpdatedAt: formatKoreanDateTime(updatedAt),
    interpretation: preferText(payload, row, 'interpretation', 'interpretation'),
    tldr: preferTextArray(payload, row, 'tldr', 'tldr'),
    keyArticles: preferArticles(payload, row),
    companyEvidence: preferCompanyEvidence(payload, row),
  };
}

export function buildHotNewsReports(rows: RawHotNewsReportRow[]): HotNewsReport[] {
  return rows
    .map(normalizeHotNewsReport)
    .filter((report): report is HotNewsReport => report !== null);
}
