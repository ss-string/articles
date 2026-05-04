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

  return value.filter(isRecord).map((item) => ({
    company: parseText(item.company),
    code: parseText(item.code),
    position: parseText(item.position),
    evidence: parseTextArray(item.detailedEvidence),
    links: parseTextArray(item.detailedNewsLinks),
  }));
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

export function normalizeHotNewsReport(row: RawHotNewsReportRow): HotNewsReport | null {
  const payload = isRecord(row.report_payload) ? row.report_payload : null;
  const title = preferText(payload, row, 'title', 'title');

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
