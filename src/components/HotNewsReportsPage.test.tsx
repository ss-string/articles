import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HotNewsReportsPage } from './HotNewsReportsPage';

const rows = [
  {
    id: 1,
    issue_date: '2026-05-04',
    title: '2026-05-04 조선 에너지 수주',
    perspective: '조선 에너지 수주',
    tldr: [
      '국내 조선·해양 에너지 인프라 기업의 수주 뉴스가 집중',
      'LNG-FSRU, 암모니아운반선, 해양 전력망 등 에너지 전환 관련 발주가 핵심',
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
    interpretation: '조선과 해양 인프라에서는 에너지 운반 수요가 동시에 확인된다.',
  },
];

describe('HotNewsReportsPage', () => {
  it('renders hot news report cards with title, date, perspective, and summary', async () => {
    render(<HotNewsReportsPage queryRows={async () => rows} />);

    expect(await screen.findByRole('heading', { name: '핫뉴스 리포트' })).toBeInTheDocument();
    expect(
      screen.getByText('토스증권 주요 뉴스 묶음을 카드로 훑고, 선택한 이슈의 리포트를 팝업에서 확인합니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2026-05-04 조선 에너지 수주')).toBeInTheDocument();
    expect(screen.getByText('2026.05.04')).toBeInTheDocument();
    expect(screen.getByText('조선 에너지 수주')).toBeInTheDocument();
    expect(screen.getByText('국내 조선·해양 에너지 인프라 기업의 수주 뉴스가 집중')).toBeInTheDocument();
  });

  it('opens and closes a dimmed report modal from a selected card', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));

    const dialog = screen.getByRole('dialog', { name: '2026-05-04 조선 에너지 수주' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId('hot-news-modal-backdrop')).toBeInTheDocument();
    expect(within(dialog).getByText('TL;DR')).toBeInTheDocument();
    expect(within(dialog).getByText('시장 해석')).toBeInTheDocument();
    expect(within(dialog).getByText('기업별 근거')).toBeInTheDocument();
    expect(within(dialog).getByText('주요 기사')).toBeInTheDocument();
    expect(document.body).toHaveClass('modal-open');

    await user.click(screen.getByRole('button', { name: '리포트 닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('modal-open');
  });

  it('closes the modal by backdrop click and Escape', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));
    await user.click(screen.getByTestId('hot-news-modal-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders key article links when links are present and text when links are absent', async () => {
    const user = userEvent.setup();
    render(<HotNewsReportsPage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));

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
    const { container } = render(<HotNewsReportsPage queryRows={async () => rows} />);

    await user.click(await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));

    const dialog = screen.getByRole('dialog', { name: '2026-05-04 조선 에너지 수주' });
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
        queryRows={async () => [
          {
            ...rows[0],
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
          },
        ]}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));

    expect(screen.getByText('우호기업').closest('article')).toHaveClass('hot-news-evidence-card tone-bull');
    expect(screen.getByText('중립기업').closest('article')).toHaveClass('hot-news-evidence-card tone-neutral');
    expect(screen.getByText('위험기업').closest('article')).toHaveClass('hot-news-evidence-card tone-bear');
  });

  it('does not apply tone classes to null or unknown company evidence positions', async () => {
    const user = userEvent.setup();
    render(
      <HotNewsReportsPage
        queryRows={async () => [
          {
            ...rows[0],
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
          },
        ]}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ }));

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
    render(<HotNewsReportsPage queryRows={async () => rows} />);

    const opener = await screen.findByRole('button', { name: /2026-05-04 조선 에너지 수주/ });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: '2026-05-04 조선 에너지 수주' });
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
    const { rerender } = render(<HotNewsReportsPage queryRows={async () => []} />);

    expect(await screen.findByText('표시할 핫뉴스 리포트가 없습니다.')).toBeInTheDocument();

    rerender(<HotNewsReportsPage queryRows={async () => Promise.reject(new Error('network failed'))} />);

    expect(await screen.findByText('network failed')).toBeInTheDocument();
  });
});
