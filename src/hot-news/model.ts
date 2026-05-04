export type RawHotNewsReportRow = Record<string, unknown>;

export type HotNewsArticle = {
  title: string;
  link: string | null;
};

export type HotNewsCompanyEvidence = {
  company: string | null;
  code: string | null;
  position: string | null;
  evidence: string[];
  links: string[];
};

export type HotNewsReport = {
  id: string;
  issueDate: string | null;
  displayDate: string;
  title: string;
  perspective: string | null;
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

function readPreferred(
  payload: Record<string, unknown> | null,
  row: RawHotNewsReportRow,
  payloadKey: string,
  rowKey: string,
): unknown {
  if (payload && Object.prototype.hasOwnProperty.call(payload, payloadKey)) {
    return payload[payloadKey];
  }

  return row[rowKey];
}

function normalizeArticles(value: unknown): HotNewsArticle[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((article) => ({
      title: parseText(article.title) ?? '',
      link: parseText(article.link),
    }));
}

function normalizeCompanyEvidence(value: unknown): HotNewsCompanyEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((item) => ({
    company: parseText(item.company),
    code: parseText(item.code),
    position: parseText(item.position),
    evidence: parseTextArray(item.detailedEvidence),
    links: parseTextArray(item.detailedNewsLinks),
  }));
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

export function normalizeHotNewsReport(row: RawHotNewsReportRow): HotNewsReport | null {
  const payload = isRecord(row.report_payload) ? row.report_payload : null;
  const title = parseText(readPreferred(payload, row, 'title', 'title'));

  if (!title) {
    return null;
  }

  const issueDate = parseText(row.issue_date);

  return {
    id: parseText(row.id) ?? title,
    issueDate,
    displayDate: formatIssueDate(row.issue_date),
    title,
    perspective: parseText(row.perspective),
    interpretation: parseText(readPreferred(payload, row, 'interpretation', 'interpretation')),
    tldr: parseTextArray(readPreferred(payload, row, 'tldr', 'tldr')),
    keyArticles: normalizeArticles(readPreferred(payload, row, 'keyArticles', 'key_articles')),
    companyEvidence: normalizeCompanyEvidence(
      readPreferred(payload, row, 'companyNewsEvidence', 'company_news_evidence'),
    ),
  };
}

export function buildHotNewsReports(rows: RawHotNewsReportRow[]): HotNewsReport[] {
  return rows
    .map(normalizeHotNewsReport)
    .filter((report): report is HotNewsReport => report !== null);
}
