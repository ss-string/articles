import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  RawVolatilityCalendarRow,
  VolatilityCalendarEvent,
  VolatilityMarketFilter,
} from '../volatility-calendar/model';
import { filterVolatilityEvents } from '../volatility-calendar/model';
import { useVolatilityCalendar } from '../volatility-calendar/useVolatilityCalendar';

type VolatilityCalendarPageProps = {
  queryRows?: () => Promise<RawVolatilityCalendarRow[]>;
};

type EventGroup = {
  dateKst: string;
  dateLabel: string;
  events: VolatilityCalendarEvent[];
};

const marketFilters: Array<{ value: VolatilityMarketFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'KR_STOCK', label: '한국' },
  { value: 'US_STOCK', label: '미국' },
];

function getFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0);
}

function groupEventsByDate(events: VolatilityCalendarEvent[]): EventGroup[] {
  return events.reduce<EventGroup[]>((groups, event) => {
    const existingGroup = groups.find((group) => group.dateKst === event.dateKst);

    if (existingGroup) {
      existingGroup.events.push(event);
      return groups;
    }

    groups.push({ dateKst: event.dateKst, dateLabel: event.dateLabel, events: [event] });
    return groups;
  }, []);
}

function EventDetailModal({ event, onClose }: { event: VolatilityCalendarEvent; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.classList.add('modal-open');
    closeButtonRef.current?.focus();

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
        onClose();
        return;
      }

      const dialog = dialogRef.current;
      if (keyboardEvent.key !== 'Tab' || !dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        keyboardEvent.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!(activeElement instanceof Node) || !dialog.contains(activeElement)) {
        keyboardEvent.preventDefault();
        firstElement.focus();
        return;
      }

      if (keyboardEvent.shiftKey && activeElement === firstElement) {
        keyboardEvent.preventDefault();
        lastElement.focus();
      } else if (!keyboardEvent.shiftKey && activeElement === lastElement) {
        keyboardEvent.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.classList.remove('modal-open');
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="volatility-modal-layer">
      <button
        aria-label="이벤트 상세 배경 닫기"
        className="volatility-modal-backdrop"
        data-testid="volatility-modal-backdrop"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="volatility-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="volatility-modal-header">
          <div>
            <span className="volatility-modal-kicker">Event Detail</span>
            <h3 id={titleId}>{event.name} 상세</h3>
            <div className="volatility-modal-meta">
              <span>{event.dateLabel}</span>
              <span>{event.timeLabel}</span>
              <span>{event.marketLabel}</span>
              <span className={`volatility-stance ${event.stance}`}>{event.stanceLabel}</span>
            </div>
          </div>
          <button
            aria-label="이벤트 상세 닫기"
            className="volatility-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            x
          </button>
        </header>
        <div className="volatility-modal-body">
          <section className="volatility-modal-panel">
            <h4>무엇인지</h4>
            <p>{event.brief}</p>
          </section>
          <section className="volatility-modal-panel">
            <h4>왜 중요한지</h4>
            <p>{event.reason}</p>
          </section>
          <section className="volatility-modal-panel">
            <h4>중요도</h4>
            <strong>{event.importance.toFixed(2)}</strong>
            <div className="volatility-importance-bar" aria-hidden="true">
              <span style={{ width: `${event.importancePercent}%` }} />
            </div>
          </section>
          <section className="volatility-modal-panel">
            <h4>분류</h4>
            <p>{event.category}</p>
          </section>
          <section className="volatility-modal-panel">
            <h4>체크포인트</h4>
            <ul>
              {event.checkPoints.length > 0 ? (
                event.checkPoints.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>표시할 체크포인트가 없습니다.</li>
              )}
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}

export function VolatilityCalendarPage({ queryRows }: VolatilityCalendarPageProps) {
  const state = useVolatilityCalendar({ queryRows });
  const [marketFilter, setMarketFilter] = useState<VolatilityMarketFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<VolatilityCalendarEvent | null>(null);
  const closeSelectedEvent = useCallback(() => setSelectedEvent(null), []);
  const events = useMemo(
    () => filterVolatilityEvents(state.calendar?.events ?? [], marketFilter),
    [marketFilter, state.calendar?.events],
  );
  const eventGroups = useMemo(() => groupEventsByDate(events), [events]);

  const statusContent =
    state.status === 'loading' ? (
      <div className="state-panel">변동성 캘린더를 불러오는 중입니다.</div>
    ) : state.status === 'error' ? (
      <div className="state-panel error">{state.error}</div>
    ) : !state.calendar || state.calendar.events.length === 0 ? (
      <div className="state-panel">표시할 변동성 이벤트가 없습니다.</div>
    ) : events.length === 0 ? (
      <div className="state-panel">선택한 시장에 표시할 이벤트가 없습니다.</div>
    ) : null;

  return (
    <>
      <section
        aria-labelledby="volatility-calendar-title"
        className="dashboard-section volatility-calendar-section"
        id="volatility-calendar"
      >
        <div className="section-heading volatility-calendar-heading">
          <div>
            <span>매수 주의 캘린더</span>
            <h2 id="volatility-calendar-title">45일 이벤트 캘린더</h2>
          </div>
          {state.calendar ? <span className="volatility-updated-chip">{state.calendar.updatedAtLabel}</span> : null}
        </div>
        <p className="volatility-calendar-copy">
          이벤트일 기준으로 한국/미국 주요 변동성 이벤트를 배치합니다. 매수관점에서 중요하게 보아야하는 시점을 빠르게 확인하고,
          각 이벤트가 Bull인지 Bear인지 함께 봅니다.
        </p>
        <div className="volatility-filter-row" aria-label="시장 필터">
          {marketFilters.map((filter) => (
            <button
              aria-pressed={marketFilter === filter.value}
              className={marketFilter === filter.value ? 'volatility-filter active' : 'volatility-filter'}
              key={filter.value}
              onClick={() => setMarketFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
        {statusContent}
        {state.status === 'success' && eventGroups.length > 0 ? (
          <div className="volatility-calendar-grid">
            {eventGroups.map((group) => (
              <article className="volatility-day-card" key={group.dateKst}>
                <strong>{group.dateLabel}</strong>
                <div className="volatility-day-events">
                  {group.events.map((event) => (
                    <button className="volatility-event-card" key={event.id} onClick={() => setSelectedEvent(event)} type="button">
                      <span className="volatility-event-meta">
                        <span>{event.marketLabel}</span>
                        <span>{event.timeLabel}</span>
                      </span>
                      <b>{event.name}</b>
                      <span className={`volatility-stance ${event.stance}`}>{event.stanceLabel}</span>
                      <span className="volatility-importance-label">{event.importanceLabel}</span>
                      <span className="volatility-importance-bar" aria-hidden="true">
                        <span style={{ width: `${event.importancePercent}%` }} />
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
      {selectedEvent ? <EventDetailModal event={selectedEvent} onClose={closeSelectedEvent} /> : null}
    </>
  );
}
