export type RawVolatilityCalendarRow = Record<string, unknown>;

export type VolatilityMarket = 'KR_STOCK' | 'US_STOCK';
export type VolatilityMarketFilter = 'all' | VolatilityMarket;
export type VolatilityStance = 'bull' | 'bear';

export type VolatilityCalendarEvent = {
  id: string;
  name: string;
  market: VolatilityMarket;
  marketLabel: string;
  category: string;
  dateKst: string;
  dateLabel: string;
  timeLabel: string;
  importance: number;
  importanceLabel: string;
  importancePercent: number;
  stance: VolatilityStance;
  stanceLabel: string;
  buyCaution: string | null;
  checkPoints: string[];
  brief: string;
  reason: string;
};

export type VolatilityCalendar = {
  id: string;
  issueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedAtLabel: string;
  events: VolatilityCalendarEvent[];
};

function parseText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
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

function parseMarket(value: unknown): VolatilityMarket | null {
  return value === 'KR_STOCK' || value === 'US_STOCK' ? value : null;
}

function parseTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(parseText).filter((item): item is string => item !== null);
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

function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? isValidDateParts(match[1], match[2], match[3]) : false;
}

export function formatKstDateLabel(value: string): string {
  if (!isValidDate(value)) {
    return '-';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return `${value.replace(/-/g, '.')} ${weekdays[date.getDay()]}`;
}

function formatUpdatedAtLabel(value: unknown): { updatedAt: string | null; updatedAtLabel: string } {
  const text = parseText(value);

  if (!text || Number.isNaN(Date.parse(text))) {
    return { updatedAt: text, updatedAtLabel: '최신 업데이트 -' };
  }

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(text));
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    updatedAt: text,
    updatedAtLabel: `최신 업데이트 ${getPart('year')}.${getPart('month')}.${getPart('day')} ${getPart('hour')}:${getPart('minute')}`,
  };
}

function deriveStance(value: Record<string, unknown>): VolatilityStance {
  const stance = parseText(value.stance)?.toLowerCase();

  if (stance === 'bull' || stance === 'bear') {
    return stance;
  }

  const category = parseText(value.category)?.toLowerCase() ?? '';
  const bearCategories = ['inflation', 'central_bank', 'minutes', 'holiday', 'expiry', 'month_end', 'rebalance', 'rebalancing'];

  return bearCategories.some((item) => category.includes(item)) ? 'bear' : 'bull';
}

function buildBrief(value: Record<string, unknown>, marketLabel: string): string {
  const explicit = parseText(value.event_brief);

  if (explicit) {
    return explicit;
  }

  const category = parseText(value.category)?.toLowerCase() ?? '';

  if (category.includes('inflation')) {
    return `${marketLabel}의 물가 압력을 확인하는 이벤트입니다.`;
  }
  if (category.includes('central_bank')) {
    return `${marketLabel}의 통화정책 방향과 금리 기대를 확인하는 이벤트입니다.`;
  }
  if (category.includes('minutes')) {
    return `${marketLabel}의 통화정책 논의 흐름을 확인하는 이벤트입니다.`;
  }
  if (category.includes('holiday')) {
    return `${marketLabel} 증시 휴장에 따른 유동성 공백 이벤트입니다.`;
  }
  if (category.includes('expiry')) {
    return `${marketLabel} 파생상품 만기와 수급 변화를 확인하는 이벤트입니다.`;
  }
  if (category.includes('month_end')) {
    return `${marketLabel} 월말 수급과 리밸런싱 영향을 확인하는 이벤트입니다.`;
  }
  if (category.includes('consumption') || category.includes('sentiment')) {
    return `${marketLabel}의 소비와 경기 심리를 확인하는 이벤트입니다.`;
  }

  return `${marketLabel} 시장 변동성에 영향을 줄 수 있는 이벤트입니다.`;
}

function buildReason(value: Record<string, unknown>): string {
  const explicit = parseText(value.importance_reason);

  if (explicit) {
    return explicit;
  }

  const category = parseText(value.category)?.toLowerCase() ?? '';

  if (category.includes('inflation')) {
    return '물가가 예상보다 높으면 금리 기대와 성장주 변동성이 커질 수 있습니다.';
  }
  if (category.includes('central_bank') || category.includes('minutes')) {
    return '통화정책 기대가 바뀌면 금리와 주식 밸류에이션이 함께 흔들릴 수 있습니다.';
  }
  if (category.includes('holiday')) {
    return '휴장 전후에는 거래 공백과 해외 변수 반영으로 가격 변동성이 커질 수 있습니다.';
  }
  if (category.includes('expiry') || category.includes('month_end')) {
    return '수급 재조정이 집중되면 단기 가격 흐름이 왜곡될 수 있습니다.';
  }
  if (category.includes('consumption') || category.includes('sentiment')) {
    return '소비와 심리 변화는 경기민감주와 내수주의 매수 판단에 영향을 줄 수 있습니다.';
  }

  return parseText(value.buy_caution) ?? '매수 판단 전 가격 변동성과 수급 반응을 확인해야 합니다.';
}

function normalizeEvent(value: unknown, rowId: string, index: number): VolatilityCalendarEvent | null {
  const event = parseRecord(value);

  if (!event) {
    return null;
  }

  const name = parseText(event.event);
  const market = parseMarket(event.market);
  const dateKst = parseText(event.date_kst);
  const importance = parseNumber(event.risk_level);

  if (!name || !market || !dateKst || !isValidDate(dateKst) || importance === null) {
    return null;
  }

  const marketLabel = market === 'KR_STOCK' ? '한국' : '미국';
  const boundedImportance = Math.min(1, Math.max(0, importance));
  const stance = deriveStance(event);

  return {
    id: `${rowId}-${dateKst}-${market}-${index}`,
    name,
    market,
    marketLabel,
    category: parseText(event.category) ?? '-',
    dateKst,
    dateLabel: formatKstDateLabel(dateKst),
    timeLabel: parseText(event.time_kst) ?? '-',
    importance: boundedImportance,
    importanceLabel: `중요도 ${boundedImportance.toFixed(2)}`,
    importancePercent: Math.round(boundedImportance * 100),
    stance,
    stanceLabel: stance === 'bull' ? 'Bull' : 'Bear',
    buyCaution: parseText(event.buy_caution),
    checkPoints: parseTextArray(event.check_points),
    brief: buildBrief(event, marketLabel),
    reason: buildReason(event),
  };
}

export function normalizeVolatilityCalendarRow(row: RawVolatilityCalendarRow): VolatilityCalendar | null {
  const rowId = parseText(row.id) ?? 'latest';
  const { updatedAt, updatedAtLabel } = formatUpdatedAtLabel(row.updated_at);
  const events = Array.isArray(row.events)
    ? row.events
        .map((event, index) => normalizeEvent(event, rowId, index))
        .filter((event): event is VolatilityCalendarEvent => event !== null)
        .sort((a, b) =>
          `${a.dateKst}-${a.timeLabel}-${a.market}-${a.name}`.localeCompare(`${b.dateKst}-${b.timeLabel}-${b.market}-${b.name}`),
        )
    : [];

  return {
    id: rowId,
    issueDate: parseText(row.issue_date),
    createdAt: parseText(row.created_at),
    updatedAt,
    updatedAtLabel,
    events,
  };
}

export function buildVolatilityCalendar(rows: RawVolatilityCalendarRow[]): VolatilityCalendar | null {
  return rows.map(normalizeVolatilityCalendarRow).find((calendar): calendar is VolatilityCalendar => calendar !== null) ?? null;
}

export function filterVolatilityEvents(
  events: VolatilityCalendarEvent[],
  market: VolatilityMarketFilter,
): VolatilityCalendarEvent[] {
  return market === 'all' ? events : events.filter((event) => event.market === market);
}
