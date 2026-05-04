import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MacroRegimePage } from './MacroRegimePage';
import type { RawMacroRegimeRow } from '../macro-regime/model';

const rows: RawMacroRegimeRow[] = [
  {
    id: '2026-05-04-KR',
    run_date: '2026-05-04',
    market: 'KR',
    regime: '골디락스(goldilocks)',
    summary: '한국은 성장축이 확장으로 판정되고 물가축은 중립으로 판정된다.',
    axis_assessments: {
      growth: { axis: 'expanding', rationale: '경기선행지수가 성장축을 강하게 지지한다.', confidence: 0.82 },
      inflation: { axis: 'neutral', rationale: '물가 압력이 평균 대비 높지 않다.', confidence: 0.74 },
      monetary: { axis: 'neutral', rationale: '금리 수준은 완만한 부담이나 추세는 중립이다.', confidence: 0.63 },
      liquidity: { axis: 'ample', rationale: 'KOSPI YoY가 유동성축을 보조한다.', confidence: 0.68 },
    },
    key_indicators: [],
    asset_implications: ['성장 확장과 물가 중립 조합은 위험자산에 우호적이다.'],
    risk_factors: ['물가 지표 추세가 up이므로 elevated로 이동할 위험이 있다.'],
    content_md: '# KR 전문\n한국 레짐 전문입니다.',
  },
  {
    id: '2026-05-04-US',
    run_date: '2026-05-04',
    market: 'US',
    regime: '리플레이션(reflation)',
    summary: '미국은 성장축이 중립, 물가축이 elevated로 판정된다.',
    axis_assessments: {
      growth: { axis: 'neutral', rationale: '성장 지표는 약한 음수이나 contracting으로 단정하기 어렵다.', confidence: 0.69 },
      inflation: { axis: 'elevated', rationale: '헤드라인 CPI의 레벨 부담과 상승 추세를 반영한다.', confidence: 0.71 },
      monetary: { axis: 'neutral', rationale: '연방기금금리 부담과 수익률곡선 개선이 상충된다.', confidence: 0.66 },
      liquidity: { axis: 'ample', rationale: 'M2와 HY spread가 유동성을 지지한다.', confidence: 0.78 },
    },
    key_indicators: [
      {
        label: '미국 CPI (YoY)',
        value: 3.32,
        unit: '%',
        source: 'FRED',
        trend_3m: 'up',
        interpretation: 'level_score -1과 상승 추세가 elevated 판정의 핵심',
      },
      {
        label: '미국 HY 크레딧 스프레드',
        value: 2.83,
        unit: '%',
        source: 'FRED',
        trend_3m: 'down',
        interpretation: '스프레드 하락은 유동성 ample 판정을 지지',
      },
    ],
    asset_implications: ['유동성 ample은 위험자산을 보조하지만, 물가축 elevated가 할인율 부담을 남길 수 있다.'],
    risk_factors: ['Core CPI는 하락 추세라 물가축 elevated 판정의 확신을 낮춘다.'],
    content_md:
      '# 2026-05-04 US 매크로 레짐: 리플레이션(reflation)\n\nas of 2026.05.01 updated_at 최신\n\n## 요약 (TL;DR)\n미국 전문입니다.',
  },
];

describe('MacroRegimePage', () => {
  it('renders KR and US latest decision cards', async () => {
    const { container } = render(<MacroRegimePage queryRows={async () => rows} />);

    expect(await screen.findByRole('heading', { name: '최신 매크로 레짐 판단' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /KR/ })).toHaveTextContent('골디락스(goldilocks)');
    expect(screen.getByRole('button', { name: /US/ })).toHaveTextContent('리플레이션(reflation)');
    expect(screen.getAllByText('2026.05.04')).not.toHaveLength(0);
    expect(Array.from(container.querySelectorAll('time')).map((time) => time.getAttribute('dateTime'))).toEqual([
      '2026-05-04',
      '2026-05-04',
    ]);
    expect(screen.getByText('expanding')).toBeInTheDocument();
    expect(screen.getByText('elevated')).toBeInTheDocument();
  });

  it('opens a popup with actual US detail data and closes it', async () => {
    const user = userEvent.setup();
    render(<MacroRegimePage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /US/ }));

    const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });
    expect(within(dialog).getByText('2026.05.04')).toBeInTheDocument();
    expect(within(dialog).queryByText(/as of/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/updated_at 최신/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/2026-05-04 US 매크로 레짐/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('main')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: '요약' })).toBeInTheDocument();
    expect(within(dialog).getByText(rows[1].summary as string)).toBeInTheDocument();
    expect(within(dialog).getByText('성장')).toBeInTheDocument();
    expect(within(dialog).getAllByText('판단 neutral')).toHaveLength(2);
    expect(within(dialog).getByText('컨피던스 0.69')).toBeInTheDocument();
    expect(within(dialog).getByText('미국 CPI (YoY)')).toBeInTheDocument();
    expect(within(dialog).getByText('↑ 상승')).toBeInTheDocument();
    expect(within(dialog).getByText('↓ 하락')).toBeInTheDocument();
    expect(within(dialog).getByText(/유동성 ample은 위험자산을 보조/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Core CPI는 하락 추세/)).toBeInTheDocument();
    expect(within(dialog).getByText(/미국 전문입니다/)).toBeInTheDocument();
    expect(
      Array.from(dialog.querySelectorAll('.macro-axis-row')).map((row) => row.textContent),
    ).toEqual([
      '성장판단 neutral컨피던스 0.69',
      '물가판단 elevated컨피던스 0.71',
      '통화판단 neutral컨피던스 0.66',
      '유동성판단 ample컨피던스 0.78',
    ]);

    await user.click(within(dialog).getByRole('button', { name: '상세 팝업 닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus into the popup and restores focus to the selected card when closed', async () => {
    const user = userEvent.setup();
    render(<MacroRegimePage queryRows={async () => rows} />);

    const usCard = await screen.findByRole('button', { name: /US/ });
    await user.click(usCard);

    const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });
    expect(within(dialog).getByRole('button', { name: '상세 팝업 닫기' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: '전문' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(usCard).toHaveFocus();
  });

  it('keeps tab focus inside the popup when focus starts outside', async () => {
    const user = userEvent.setup();
    render(<MacroRegimePage queryRows={async () => rows} />);

    const krCard = await screen.findByRole('button', { name: /KR/ });
    await user.click(await screen.findByRole('button', { name: /US/ }));
    const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });

    krCard.focus();
    await user.tab();

    expect(within(dialog).getByRole('button', { name: '상세 팝업 닫기' })).toHaveFocus();
  });

  it('uses popup navigation buttons to move to detail sections', async () => {
    const user = userEvent.setup();
    const externalScrollIntoView = vi.fn();
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn(function scrollIntoView(this: HTMLElement) {
      return this.dataset.sectionId;
    });
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      render(<MacroRegimePage queryRows={async () => rows} />);
      const externalSection = document.createElement('section');
      externalSection.id = 'macro-key-indicators';
      externalSection.scrollIntoView = externalScrollIntoView;
      document.body.prepend(externalSection);

      await user.click(await screen.findByRole('button', { name: /US/ }));
      const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });
      const targetSection = within(dialog).getByRole('heading', { name: '핵심 지표' }).closest('section');
      expect(targetSection).not.toBeNull();
      (targetSection as HTMLElement).dataset.sectionId = 'inside-key-indicators';

      await user.click(within(dialog).getByRole('button', { name: '핵심 지표' }));

      expect(scrollIntoView.mock.contexts[0]).toBe(targetSection);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
      expect(externalScrollIntoView).not.toHaveBeenCalled();
    } finally {
      document.getElementById('macro-key-indicators')?.remove();
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('closes the popup when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<MacroRegimePage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /US/ }));
    const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });

    await user.click(dialog.parentElement as HTMLElement);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the popup when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<MacroRegimePage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /US/ }));
    expect(screen.getByRole('dialog', { name: '리플레이션(reflation)' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders duplicate label/source indicators without duplicate key warnings', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const duplicateIndicatorRows: RawMacroRegimeRow[] = [
      {
        ...rows[1],
        key_indicators: [
          {
            label: '미국 CPI (YoY)',
            value: 3.32,
            unit: '%',
            source: 'FRED',
            trend_3m: 'up',
            interpretation: '첫 번째 동일 출처 지표',
          },
          {
            label: '미국 CPI (YoY)',
            value: 3.33,
            unit: '%',
            source: 'FRED',
            trend_3m: 'down',
            interpretation: '두 번째 동일 출처 지표',
          },
        ],
      },
    ];

    try {
      render(<MacroRegimePage queryRows={async () => duplicateIndicatorRows} />);

      await user.click(await screen.findByRole('button', { name: /US/ }));
      const dialog = screen.getByRole('dialog', { name: '리플레이션(reflation)' });

      expect(within(dialog).getAllByText('미국 CPI (YoY)')).toHaveLength(2);
      expect(within(dialog).getByText('첫 번째 동일 출처 지표')).toBeInTheDocument();
      expect(within(dialog).getByText('두 번째 동일 출처 지표')).toBeInTheDocument();
      expect(
        consoleError.mock.calls.some((call) =>
          call.some((item) => String(item).includes('Encountered two children with the same key')),
        ),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });
});
