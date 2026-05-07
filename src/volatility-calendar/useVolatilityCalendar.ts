import { useEffect, useState } from 'react';
import { queryVolatilityCalendarRows } from './api';
import { buildVolatilityCalendar, type RawVolatilityCalendarRow, type VolatilityCalendar } from './model';

type VolatilityCalendarState =
  | { status: 'loading'; calendar: null; error: null }
  | { status: 'success'; calendar: VolatilityCalendar | null; error: null }
  | { status: 'error'; calendar: null; error: string };

type UseVolatilityCalendarOptions = {
  queryRows?: () => Promise<RawVolatilityCalendarRow[]>;
};

export function useVolatilityCalendar(options: UseVolatilityCalendarOptions = {}): VolatilityCalendarState {
  const [state, setState] = useState<VolatilityCalendarState>({
    status: 'loading',
    calendar: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryVolatilityCalendarRows;

    async function load() {
      setState({ status: 'loading', calendar: null, error: null });

      try {
        const rows = await loadRows();
        const calendar = buildVolatilityCalendar(rows);

        if (isMounted) {
          setState({ status: 'success', calendar, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            calendar: null,
            error: error instanceof Error ? error.message : '변동성 캘린더를 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryRows]);

  return state;
}
