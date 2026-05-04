import {
  buildHotNewsReports,
  formatIssueDate,
  normalizeHotNewsReport,
} from './model';

const sampleRow = {
  id: 1,
  issue_date: '2026-05-04',
  title: 'top-level 제목',
  perspective: '조선 에너지 수주',
  tldr: ['top-level 요약'],
  key_articles: [{ title: 'top-level 기사', link: 'https://example.com/top' }],
  company_news_evidence: [
    {
      company: 'top-level 회사',
      code: 'A000000',
      position: 'neutral',
      detailedEvidence: ['top-level 근거'],
      detailedNewsLinks: ['https://example.com/evidence'],
    },
  ],
  interpretation: 'top-level 해석',
  report_payload: {
    title: '2026-05-04 조선 에너지 수주',
    tldr: [
      '국내 조선·해양 에너지 인프라 기업의 수주 뉴스가 집중',
      'LNG-FSRU, 암모니아운반선, 해양 전력망 등 에너지 전환 관련 발주가 핵심',
    ],
    keyArticles: [
      {
        title: '삼성중공업, 4848억 규모 LNG 부유식 저장·재기화 설비 1척 수주',
        link: 'https://www.tossinvest.com/feed/news?contentParams=%7B%22id%22%3A%22newspim_20260504000889%22%7D',
      },
      { title: '링크 없는 기사', link: '' },
    ],
    interpretation: '조선과 해양 인프라에서는 에너지 운반 수요가 동시에 확인된다.',
    companyNewsEvidence: [
      {
        code: 'A010140',
        company: '삼성중공업',
        position: 'bull',
        detailedEvidence: [
          '아시아 지역 선주로부터 LNG-FSRU 1척을 4848억원에 수주',
          'FSRU가 전력공급의 퀵 솔루션 중 하나로 부각',
        ],
        detailedNewsLinks: [
          'https://www.tossinvest.com/feed/news?contentParams=%7B%22id%22%3A%22newspim_20260504000889%22%7D',
          '',
        ],
      },
    ],
  },
};

describe('hot-news model', () => {
  it('normalizes the production row shape with report_payload first', () => {
    const report = normalizeHotNewsReport(sampleRow);

    expect(report).toMatchObject({
      id: '1',
      issueDate: '2026-05-04',
      displayDate: '2026.05.04',
      title: '2026-05-04 조선 에너지 수주',
      perspective: '조선 에너지 수주',
      interpretation: '조선과 해양 인프라에서는 에너지 운반 수요가 동시에 확인된다.',
      tldr: [
        '국내 조선·해양 에너지 인프라 기업의 수주 뉴스가 집중',
        'LNG-FSRU, 암모니아운반선, 해양 전력망 등 에너지 전환 관련 발주가 핵심',
      ],
    });
    expect(report?.keyArticles).toEqual([
      {
        title: '삼성중공업, 4848억 규모 LNG 부유식 저장·재기화 설비 1척 수주',
        link: 'https://www.tossinvest.com/feed/news?contentParams=%7B%22id%22%3A%22newspim_20260504000889%22%7D',
      },
      { title: '링크 없는 기사', link: null },
    ]);
    expect(report?.companyEvidence).toEqual([
      {
        code: 'A010140',
        company: '삼성중공업',
        position: 'bull',
        evidence: [
          '아시아 지역 선주로부터 LNG-FSRU 1척을 4848억원에 수주',
          'FSRU가 전력공급의 퀵 솔루션 중 하나로 부각',
        ],
        links: ['https://www.tossinvest.com/feed/news?contentParams=%7B%22id%22%3A%22newspim_20260504000889%22%7D'],
      },
    ]);
  });

  it('falls back to top-level fields when report_payload is missing', () => {
    const report = normalizeHotNewsReport({ ...sampleRow, report_payload: null });

    expect(report).toMatchObject({
      title: 'top-level 제목',
      tldr: ['top-level 요약'],
      interpretation: 'top-level 해석',
    });
    expect(report?.keyArticles).toEqual([{ title: 'top-level 기사', link: 'https://example.com/top' }]);
    expect(report?.companyEvidence).toEqual([
      {
        company: 'top-level 회사',
        code: 'A000000',
        position: 'neutral',
        evidence: ['top-level 근거'],
        links: ['https://example.com/evidence'],
      },
    ]);
  });

  it('excludes rows without a usable title', () => {
    expect(normalizeHotNewsReport({ id: 2, title: '', report_payload: { title: '   ' } })).toBeNull();
    expect(buildHotNewsReports([sampleRow, { id: 2, title: '' }]).map((report) => report.id)).toEqual(['1']);
  });

  it('treats invalid arrays and blank links as empty values', () => {
    const report = normalizeHotNewsReport({
      id: 'bad-arrays',
      title: '배열 검증',
      issue_date: 'not-a-date',
      tldr: '요약 문자열',
      key_articles: [{ title: '빈 링크 기사', link: '   ' }, { title: '정상 기사', link: 'https://example.com/news' }],
      company_news_evidence: [{ company: '회사', detailedEvidence: '문자열 근거', detailedNewsLinks: [' ', 'https://example.com/source'] }],
    });

    expect(report).toMatchObject({
      displayDate: 'not-a-date',
      tldr: [],
      keyArticles: [
        { title: '빈 링크 기사', link: null },
        { title: '정상 기사', link: 'https://example.com/news' },
      ],
      companyEvidence: [
        { company: '회사', code: null, position: null, evidence: [], links: ['https://example.com/source'] },
      ],
    });
  });

  it('formats valid issue dates in Korean financial display style', () => {
    expect(formatIssueDate('2026-05-04')).toBe('2026.05.04');
    expect(formatIssueDate('')).toBe('-');
    expect(formatIssueDate('2026/05/04')).toBe('2026/05/04');
  });
});
