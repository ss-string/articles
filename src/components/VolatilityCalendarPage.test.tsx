import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolatilityCalendarPage } from './VolatilityCalendarPage';

const rows = [
  {
    id: 1,
    issue_date: '2026-05-07',
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
        check_points: ['근원 CPI 전월비', '주거비 및 서비스 물가 기여도', '2년물 금리와 나스닥 선물 반응'],
      },
      {
        event: '한국은행 5월 소비자동향조사 결과',
        market: 'KR_STOCK',
        category: 'macro_consumption',
        date_kst: '2026-05-22',
        time_kst: '일중 예정',
        risk_level: 0.5,
        stance: 'bull',
        event_brief: '한국 소비자 심리와 기대인플레이션을 확인하는 이벤트입니다.',
        importance_reason: '내수주와 금융주 반응을 판단하는 데 필요합니다.',
        check_points: ['소비자심리지수 변화'],
      },
    ],
  },
];

describe('VolatilityCalendarPage', () => {
  it('renders the calendar section without weekday headers or issue date copy', async () => {
    render(<VolatilityCalendarPage queryRows={async () => rows} />);

    expect(await screen.findByRole('heading', { name: '45일 이벤트 캘린더' })).toBeInTheDocument();
    expect(screen.getByText('최신 업데이트 2026.05.07 11:23')).toBeInTheDocument();
    expect(screen.getByText(/매수관점에서 중요하게 보아야하는 시점/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '한국' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미국' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '높음' })).not.toBeInTheDocument();
    expect(screen.getByText('2026.05.12 화')).toBeInTheDocument();
    expect(screen.getByText('중요도 0.90')).toBeInTheDocument();
    expect(screen.getByText('Bear')).toBeInTheDocument();
    expect(screen.queryByText('강도')).not.toBeInTheDocument();
    expect(screen.queryByText('매수 관점')).not.toBeInTheDocument();
    expect(screen.queryByText('매도 관점')).not.toBeInTheDocument();
    expect(screen.queryByText('월')).not.toBeInTheDocument();
    expect(screen.queryByText('화')).not.toBeInTheDocument();
    expect(screen.queryByText('수')).not.toBeInTheDocument();
    expect(screen.queryByText('기준일')).not.toBeInTheDocument();
  });

  it('filters events by market', async () => {
    const user = userEvent.setup();
    render(<VolatilityCalendarPage queryRows={async () => rows} />);

    await screen.findByText('미국 4월 소비자물가지수');
    await user.click(screen.getByRole('button', { name: '한국' }));

    expect(screen.queryByText('미국 4월 소비자물가지수')).not.toBeInTheDocument();
    expect(screen.getByText('한국은행 5월 소비자동향조사 결과')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '미국' }));
    expect(screen.getByText('미국 4월 소비자물가지수')).toBeInTheDocument();
    expect(screen.queryByText('한국은행 5월 소비자동향조사 결과')).not.toBeInTheDocument();
  });

  it('opens and closes an event detail modal', async () => {
    const user = userEvent.setup();
    render(<VolatilityCalendarPage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /미국 4월 소비자물가지수/ }));

    const dialog = screen.getByRole('dialog', { name: '미국 4월 소비자물가지수 상세' });
    expect(within(dialog).getByText('Event Detail')).toBeInTheDocument();
    expect(within(dialog).getByText('2026.05.12 화')).toBeInTheDocument();
    expect(within(dialog).getByText('21:30')).toBeInTheDocument();
    expect(within(dialog).getByText('미국')).toBeInTheDocument();
    expect(within(dialog).getByText('Bear')).toBeInTheDocument();
    expect(within(dialog).getByText('무엇인지')).toBeInTheDocument();
    expect(within(dialog).getByText('왜 중요한지')).toBeInTheDocument();
    expect(within(dialog).getByText('중요도')).toBeInTheDocument();
    expect(within(dialog).getByText('macro_inflation')).toBeInTheDocument();
    expect(within(dialog).getByText('근원 CPI 전월비')).toBeInTheDocument();
    expect(document.body).toHaveClass('modal-open');

    await user.click(within(dialog).getByRole('button', { name: '이벤트 상세 닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('modal-open');
  });

  it('closes the event modal by backdrop click and Escape', async () => {
    const user = userEvent.setup();
    render(<VolatilityCalendarPage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /미국 4월 소비자물가지수/ }));
    await user.click(screen.getByTestId('volatility-modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /미국 4월 소비자물가지수/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps focus inside the modal and restores focus after close', async () => {
    const user = userEvent.setup();
    render(<VolatilityCalendarPage queryRows={async () => rows} />);

    const eventButton = await screen.findByRole('button', { name: /미국 4월 소비자물가지수/ });
    eventButton.focus();
    await user.keyboard('{Enter}');

    const closeButton = screen.getByRole('button', { name: '이벤트 상세 닫기' });
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Tab}');
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(eventButton).toHaveFocus();
  });

  it('renders loading, empty, filtered empty, and error states', async () => {
    const pendingQuery = new Promise<typeof rows>(() => {});
    const { rerender } = render(<VolatilityCalendarPage queryRows={() => pendingQuery} />);

    expect(screen.getByText('변동성 캘린더를 불러오는 중입니다.')).toBeInTheDocument();

    rerender(<VolatilityCalendarPage queryRows={async () => []} />);
    expect(await screen.findByText('표시할 변동성 이벤트가 없습니다.')).toBeInTheDocument();

    rerender(<VolatilityCalendarPage queryRows={async () => Promise.reject(new Error('network failed'))} />);
    expect(await screen.findByText('network failed')).toBeInTheDocument();

    rerender(
      <VolatilityCalendarPage
        queryRows={async () => [
          {
            id: 1,
            updated_at: '2026-05-07T02:23:06.029364+00:00',
            events: [{ event: '미국 CPI', market: 'US_STOCK', date_kst: '2026-05-12', risk_level: 0.9 }],
          },
        ]}
      />,
    );
    await screen.findByText('미국 CPI');
    await userEvent.click(screen.getByRole('button', { name: '한국' }));
    expect(screen.getByText('선택한 시장에 표시할 이벤트가 없습니다.')).toBeInTheDocument();
  });
});
