import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HotNewsReportsPage } from './HotNewsReportsPage';

function createReportRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    issue_date: '2026-05-07',
    title: '2026-05-07 AI 인프라 리포트',
    perspective: 'AI 반도체 인프라',
    perspective_key: 'ai_infra',
    change_status: 'initial',
    updated_at: '2026-05-07T10:30:00+09:00',
    tldr: [
      '국내 AI 인프라 기업의 수주 뉴스가 집중',
      '데이터센터 전력망과 반도체 장비 투자가 핵심',
    ],
    key_articles: [
      {
        title: '삼성중공업, 4848억 규모 LNG 부유식 저장·재기화 설비 1척 수주',
        link: 'https://www.tossinvest.com/feed/news?contentParams=%7B%22id%22%3A%22newspim_20260504000889%22%7D',
      },
      { title: '링크 없는 기사', link: '' },
    ],
    company_news_evidence: [
      {
        code: 'A010140',
        company: '삼성중공업',
        position: 'bull',
        detailedEvidence: ['아시아 지역 선주로부터 LNG-FSRU 1척을 4848억원에 수주'],
        detailedNewsLinks: [
          'https://www.tossinvest.com/feed/news?contentParams=%7B%22id%22%3A%22newspim_20260504000889%22%7D',
        ],
      },
    ],
    interpretation: 'AI 인프라에서는 전력과 설비 투자 수요가 동시에 확인된다.',
    ...overrides,
  };
}

const rows = [createReportRow()];

describe('HotNewsReportsPage', () => {
  it('renders fallback notice, displayTitle cards, update time, and debug status only in the modal footer', async () => {
    const queryRows = async (issueDate?: string) => (issueDate === '2026-05-07' ? rows : []);

    render(
      <HotNewsReportsPage
        queryLatestIssueDate={async () => '2026-05-07'}
        queryHistoryRows={async () => []}
        queryRows={queryRows}
        today="2026-05-08"
      />,
    );

    expect(await screen.findByRole('heading', { name: '핫뉴스 리포트' })).toBeInTheDocument();
    expect(
      screen.getByText('토스증권 주요 뉴스 묶음을 카드로 훑고, 선택한 이슈의 리포트를 팝업에서 확인합니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('최신 2026.05.07 리포트를 표시합니다.')).toBeInTheDocument();
    expect(screen.getByText('AI 인프라 리포트')).toBeInTheDocument();
    expect(screen.queryByText('2026-05-07 AI 인프라 리포트')).not.toBeInTheDocument();
    expect(screen.getByText('업데이트 2026-05-07 10:30')).toBeInTheDocument();
    expect(screen.getByText('국내 AI 인프라 기업의 수주 뉴스가 집중')).toBeInTheDocument();
    expect(screen.queryByText('AI 반도체 인프라')).not.toBeInTheDocument();
    expect(screen.queryByText('초기 문서')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /AI 인프라 리포트/ }));

    const dialog = screen.getByRole('dialog', { name: 'AI 인프라 리포트' });
    const modalHeader = within(dialog).getByRole('heading', { name: 'AI 인프라 리포트' }).closest('header');
    expect(modalHeader).not.toBeNull();
    expect(within(modalHeader as HTMLElement).getByText('업데이트 2026-05-07 10:30')).toBeInTheDocument();
    expect(within(modalHeader as HTMLElement).queryByText('2026.05.07 · AI 반도체 인프라')).not.toBeInTheDocument();
    const debugSection = within(dialog).getByRole('heading', { name: '디버그 상태' }).closest('section');
    expect(debugSection).not.toBeNull();
    expect(within(debugSection as HTMLElement).getByText('문서 상태')).toBeInTheDocument();
    expect(within(debugSection as HTMLElement).getByText('초기 문서')).toBeInTheDocument();
    expect(within(debugSection as HTMLElement).getByText('업데이트 2026-05-07 10:30')).toBeInTheDocument();
    expect(within(debugSection as HTMLElement).getByText('이력 조회 성공')).toBeInTheDocument();
    expect(screen.getAllByText('초기 문서')).toHaveLength(1);
  });

  it('opens a displayTitle modal and keeps report sections and bull tone styling', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryHistoryRows={async () => []} queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));

    const dialog = screen.getByRole('dialog', { name: 'AI 인프라 리포트' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId('hot-news-modal-backdrop')).toBeInTheDocument();
    expect(within(dialog).getByText('TL;DR')).toBeInTheDocument();
    expect(within(dialog).getByText('시장 해석')).toBeInTheDocument();
    expect(within(dialog).getByText('기업별 근거')).toBeInTheDocument();
    expect(within(dialog).getByText('주요 기사')).toBeInTheDocument();
    expect(within(dialog).getByText('삼성중공업').closest('article')).toHaveClass('hot-news-evidence-card tone-bull');
    expect(document.body).toHaveClass('modal-open');

    await user.click(screen.getByRole('button', { name: '리포트 닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('modal-open');
  });

  it('closes the modal by backdrop click and Escape', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryHistoryRows={async () => []} queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));
    expect(screen.queryByRole('button', { name: '리포트 배경 닫기' })).not.toBeInTheDocument();
    await user.click(screen.getByTestId('hot-news-modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI 인프라 리포트/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders key article links when links are present and text when links are absent', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryHistoryRows={async () => []} queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));

    const link = screen.getByRole('link', {
      name: /삼성중공업, 4848억 규모 LNG 부유식 저장·재기화 설비 1척 수주/,
    });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('href', expect.stringContaining('tossinvest.com/feed/news'));
    expect(screen.getByText('링크 없는 기사')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '링크 없는 기사' })).not.toBeInTheDocument();
  });

  it('renders compact company evidence source links next to the evidence text', async () => {
    const user = userEvent.setup();
    const { container } = render(<HotNewsReportsPage queryHistoryRows={async () => []} queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));

    const dialog = screen.getByRole('dialog', { name: 'AI 인프라 리포트' });
    const evidenceItem = within(dialog)
      .getByText('아시아 지역 선주로부터 LNG-FSRU 1척을 4848억원에 수주')
      .closest('li');
    expect(evidenceItem).toHaveClass('hot-news-evidence-item');

    const evidenceLink = within(evidenceItem as HTMLElement).getByRole('link', { name: '기사 1 열기' });
    expect(evidenceLink).toHaveClass('hot-news-evidence-source-button');
    expect(evidenceLink).toHaveAttribute('target', '_blank');
    expect(evidenceLink).toHaveAttribute('rel', 'noreferrer');
    expect(evidenceLink).toHaveAttribute('href', expect.stringContaining('tossinvest.com/feed/news'));
    expect(container.querySelector('.hot-news-evidence-link-list')).not.toBeInTheDocument();
  });

  it('applies bull, neutral, and bear tone classes to company evidence cards', async () => {
    const user = userEvent.setup();
    render(
      <HotNewsReportsPage
        queryHistoryRows={async () => []}
        queryRows={async () => [
          createReportRow({
            company_news_evidence: [
              {
                code: 'A000001',
                company: '우호기업',
                position: 'bull',
                detailedEvidence: ['수주 증가'],
                detailedNewsLinks: [],
              },
              {
                code: 'A000002',
                company: '중립기업',
                position: 'neutral',
                detailedEvidence: ['방향성 대기'],
                detailedNewsLinks: [],
              },
              {
                code: 'A000003',
                company: '위험기업',
                position: 'bear',
                detailedEvidence: ['마진 훼손'],
                detailedNewsLinks: [],
              },
            ],
          }),
        ]}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));

    expect(screen.getByText('우호기업').closest('article')).toHaveClass('hot-news-evidence-card tone-bull');
    expect(screen.getByText('중립기업').closest('article')).toHaveClass('hot-news-evidence-card tone-neutral');
    expect(screen.getByText('위험기업').closest('article')).toHaveClass('hot-news-evidence-card tone-bear');
  });

  it('does not apply tone classes to null or unknown company evidence positions', async () => {
    const user = userEvent.setup();
    render(
      <HotNewsReportsPage
        queryHistoryRows={async () => []}
        queryRows={async () => [
          createReportRow({
            company_news_evidence: [
              {
                code: 'A000004',
                company: '미정기업',
                position: null,
                detailedEvidence: ['입장 미정'],
                detailedNewsLinks: [],
              },
              {
                code: 'A000005',
                company: '불명기업',
                position: 'watch',
                detailedEvidence: ['분류 대기'],
                detailedNewsLinks: [],
              },
            ],
          }),
        ]}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));

    const pendingArticle = screen.getByText('미정기업').closest('article');
    const unknownArticle = screen.getByText('불명기업').closest('article');
    expect(pendingArticle).toHaveClass('hot-news-evidence-card');
    expect(pendingArticle).not.toHaveClass('tone-bull');
    expect(pendingArticle).not.toHaveClass('tone-neutral');
    expect(pendingArticle).not.toHaveClass('tone-bear');
    expect(unknownArticle).toHaveClass('hot-news-evidence-card');
    expect(unknownArticle).not.toHaveClass('tone-bull');
    expect(unknownArticle).not.toHaveClass('tone-neutral');
    expect(unknownArticle).not.toHaveClass('tone-bear');
  });

  it('moves focus into the modal, traps tab navigation, and restores focus to the opener', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryHistoryRows={async () => []} queryRows={async () => rows} />);

    const opener = await screen.findByRole('button', { name: /AI 인프라 리포트/ });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'AI 인프라 리포트' });
    const closeButton = within(dialog).getByRole('button', { name: '리포트 닫기' });
    expect(closeButton).toHaveFocus();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.click(closeButton);
    expect(opener).toHaveFocus();
  });

  it('renders empty and error states', async () => {
    const { rerender } = render(
      <HotNewsReportsPage queryLatestIssueDate={async () => null} queryRows={async () => []} />,
    );

    expect(await screen.findByText('표시할 핫뉴스 리포트가 없습니다.')).toBeInTheDocument();

    rerender(
      <HotNewsReportsPage
        queryLatestIssueDate={async () => null}
        queryRows={async () => Promise.reject(new Error('network failed'))}
      />,
    );

    expect(await screen.findByText('network failed')).toBeInTheDocument();
  });

  it('renders a material change badge on the report card', async () => {
    render(<HotNewsReportsPage queryRows={async () => [createReportRow({ change_status: 'material_change' })]} />);

    const card = await screen.findByRole('button', { name: /AI 인프라 리포트/ });
    expect(within(card).getByText('중요 변경')).toBeInTheDocument();
  });

  it('does not render a material change badge for non-material report cards', async () => {
    render(<HotNewsReportsPage queryRows={async () => [createReportRow({ change_status: 'refresh' })]} />);

    const card = await screen.findByRole('button', { name: /AI 인프라 리포트/ });
    expect(within(card).queryByText('중요 변경')).not.toBeInTheDocument();
  });

  it('keeps deduplicated history rows out of the card list and shows them only in modal debug', async () => {
    const user = userEvent.setup();
    render(
      <HotNewsReportsPage
        queryHistoryRows={async () => [
          createReportRow({
            id: 2,
            change_status: 'deduplicated',
            tldr: ['중복 정리된 과거 요약'],
            updated_at: '2026-05-07T11:00:00+09:00',
          }),
        ]}
        queryRows={async () => rows}
      />,
    );

    expect(await screen.findByRole('button', { name: /AI 인프라 리포트/ })).toBeInTheDocument();
    expect(screen.queryByText('중복 정리된 과거 요약')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI 인프라 리포트/ }));

    const dialog = screen.getByRole('dialog', { name: 'AI 인프라 리포트' });
    const debugSection = within(dialog).getByRole('heading', { name: '디버그 상태' }).closest('section');
    expect(await within(debugSection as HTMLElement).findByText('중복 정리됨')).toBeInTheDocument();
    expect(within(debugSection as HTMLElement).getByText('중복 정리된 과거 요약')).toBeInTheDocument();
    expect(screen.getAllByText('중복 정리됨')).toHaveLength(1);
  });

  it('queries history with the selected report issueDate instead of the page issueDate', async () => {
    const user = userEvent.setup();
    const historyCalls: Array<[string, string]> = [];
    const fallbackRows = [
      createReportRow({
        issue_date: '2026-05-06',
        title: '2026-05-06 AI 인프라 리포트',
      }),
    ];
    const queryRows = async (issueDate?: string) => (issueDate === '2026-05-07' ? fallbackRows : []);

    render(
      <HotNewsReportsPage
        queryHistoryRows={async (issueDate, perspectiveKey) => {
          historyCalls.push([issueDate, perspectiveKey]);
          return [];
        }}
        queryLatestIssueDate={async () => '2026-05-07'}
        queryRows={queryRows}
        today="2026-05-08"
      />,
    );

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));

    expect(historyCalls).toEqual([['2026-05-06', 'ai_infra']]);
  });

  it('does not show previous card deduplicated history after switching cards', async () => {
    const user = userEvent.setup();
    const secondRow = createReportRow({
      id: 2,
      issue_date: '2026-05-08',
      title: '2026-05-08 전력망 리포트',
      perspective_key: 'power_grid',
      tldr: ['전력망 증설 뉴스가 집중'],
    });

    render(
      <HotNewsReportsPage
        queryHistoryRows={async (_issueDate, perspectiveKey) =>
          perspectiveKey === 'ai_infra'
            ? [
                createReportRow({
                  id: 3,
                  change_status: 'deduplicated',
                  tldr: ['첫 카드 중복 정리 요약'],
                }),
              ]
            : []
        }
        queryRows={async () => [rows[0], secondRow]}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /AI 인프라 리포트/ }));
    expect(await screen.findByText('첫 카드 중복 정리 요약')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /전력망 리포트/ }));

    const dialog = screen.getByRole('dialog', { name: '전력망 리포트' });
    const debugSection = within(dialog).getByRole('heading', { name: '디버그 상태' }).closest('section');
    expect(debugSection).not.toBeNull();
    expect(within(debugSection as HTMLElement).queryByText('첫 카드 중복 정리 요약')).not.toBeInTheDocument();
  });

  it('does not expose raw issue date, perspective key, and change status combinations', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryHistoryRows={async () => []} queryRows={async () => rows} />);

    expect(await screen.findByRole('button', { name: /AI 인프라 리포트/ })).toBeInTheDocument();
    expect(screen.queryByText('2026-05-07 · ai_infra · initial')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /AI 인프라 리포트/ }));

    expect(screen.queryByText('2026-05-07 · ai_infra · initial')).not.toBeInTheDocument();
  });
});
