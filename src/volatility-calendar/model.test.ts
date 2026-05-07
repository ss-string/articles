import {
  buildVolatilityCalendar,
  filterVolatilityEvents,
  formatKstDateLabel,
  normalizeVolatilityCalendarRow,
} from './model';

const rawRow = {
  id: 1,
  issue_date: '2026-05-07',
  created_at: '2026-05-07T02:00:00+00:00',
  updated_at: '2026-05-07T02:23:06.029364+00:00',
  events: [
    {
      event: '미국 4월 소비자물가지수',
      market: 'US_STOCK',
      category: 'macro_inflation',
      date_kst: '2026-05-12',
      time_kst: '21:30',
      risk_level: 0.9,
      buy_caution: '매수 전 헤드라인 및 근원 물가의 상방 이탈 여부를 확인해야 합니다.',
      check_points: ['근원 CPI 전월비', '주거비 및 서비스 물가 기여도'],
    },
    {
      event: '한국은행 5월 소비자동향조사 결과',
      market: 'KR_STOCK',
      category: 'macro_consumption',
      date_kst: '2026-05-22',
      time_kst: '일중 예정',
      risk_level: 0.5,
      buy_caution: '소비심리와 기대인플레이션의 방향성을 확인해야 합니다.',
      check_points: ['소비자심리지수 변화'],
      stance: 'bull',
      event_brief: '한국 소비자 심리와 기대인플레이션을 확인하는 이벤트입니다.',
      importance_reason: '내수주와 금융주 반응을 판단하는 데 필요합니다.',
    },
  ],
};

describe('volatility calendar model', () => {
  it('formats KST date labels with the correct weekday', () => {
    expect(formatKstDateLabel('2026-05-08')).toBe('2026.05.08 금');
    expect(formatKstDateLabel('2026-05-12')).toBe('2026.05.12 화');
  });

  it('normalizes the latest calendar row and event cards', () => {
    const calendar = normalizeVolatilityCalendarRow(rawRow);

    expect(calendar).toMatchObject({
      id: '1',
      createdAt: '2026-05-07T02:00:00+00:00',
      updatedAtLabel: '최신 업데이트 2026.05.07 11:23',
    });
    expect(calendar?.events[0]).toMatchObject({
      name: '미국 4월 소비자물가지수',
      market: 'US_STOCK',
      marketLabel: '미국',
      dateLabel: '2026.05.12 화',
      timeLabel: '21:30',
      importance: 0.9,
      importanceLabel: '중요도 0.90',
      importancePercent: 90,
      stance: 'bear',
      stanceLabel: 'Bear',
      brief: '미국의 물가 압력을 확인하는 이벤트입니다.',
      reason: '물가가 예상보다 높으면 금리 기대와 성장주 변동성이 커질 수 있습니다.',
    });
    expect(calendar?.events[1]).toMatchObject({
      marketLabel: '한국',
      stance: 'bull',
      stanceLabel: 'Bull',
      brief: '한국 소비자 심리와 기대인플레이션을 확인하는 이벤트입니다.',
      reason: '내수주와 금융주 반응을 판단하는 데 필요합니다.',
    });
  });

  it('filters invalid events and sorts by event date, time, market, and name', () => {
    const calendar = buildVolatilityCalendar([
      {
        ...rawRow,
        events: [
          { event: '늦은 이벤트', market: 'US_STOCK', date_kst: '2026-05-13', time_kst: '21:30', risk_level: 0.7 },
          { event: '빠른 이벤트', market: 'KR_STOCK', date_kst: '2026-05-12', time_kst: '08:00', risk_level: 0.6 },
          { event: '', market: 'KR_STOCK', date_kst: '2026-05-12', risk_level: 0.6 },
          { event: '시장 오류', market: 'JP_STOCK', date_kst: '2026-05-12', risk_level: 0.6 },
          { event: '날짜 오류', market: 'US_STOCK', date_kst: '2026-99-12', risk_level: 0.6 },
          { event: '중요도 오류', market: 'US_STOCK', date_kst: '2026-05-12' },
        ],
      },
    ]);

    expect(calendar?.events.map((event) => event.name)).toEqual(['빠른 이벤트', '늦은 이벤트']);
  });

  it('filters events by market', () => {
    const calendar = normalizeVolatilityCalendarRow(rawRow);

    expect(filterVolatilityEvents(calendar?.events ?? [], 'all')).toHaveLength(2);
    expect(filterVolatilityEvents(calendar?.events ?? [], 'KR_STOCK').map((event) => event.marketLabel)).toEqual(['한국']);
    expect(filterVolatilityEvents(calendar?.events ?? [], 'US_STOCK').map((event) => event.marketLabel)).toEqual(['미국']);
  });
});
