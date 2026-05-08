import {
  buildHotNewsReports,
  formatIssueDate,
  getHotNewsChangeStatusLabel,
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

  it('normalizes report tracking fields and display labels', () => {
    const report = normalizeHotNewsReport({
      id: 'latest-ai',
      issue_date: '2026-05-08',
      title: '2026-05-08 AI 인프라 투자 확대',
      perspective_key: 'ai_infra',
      run_slot: 'am',
      is_latest: true,
      change_status: 'material_change',
      change_reason: '신규 수주 뉴스 반영',
      material_change_score: '0.87',
      updated_at: '2026-05-07T23:45:00Z',
      created_at: '2026-05-07T22:30:00Z',
      source_news_ids: ['news_1', 2, '', null],
      company_codes: ['A005930', ' ', 'A000660'],
      position_map: {
        A005930: 'bull',
        A000660: 'neutral',
        empty: '',
      },
    });

    expect(report).toMatchObject({
      displayTitle: 'AI 인프라 투자 확대',
      perspectiveKey: 'ai_infra',
      runSlot: 'am',
      isLatest: true,
      changeStatus: 'material_change',
      changeReason: '신규 수주 뉴스 반영',
      materialChangeScore: 0.87,
      updatedAt: '2026-05-07T23:45:00Z',
      displayUpdatedAt: '2026-05-08 08:45',
      createdAt: '2026-05-07T22:30:00Z',
      displayCreatedAt: '2026-05-08 07:30',
      hasBeenUpdated: true,
      displayTimestampLabel: '업데이트 2026-05-08 08:45',
      sourceNewsIds: ['news_1', '2'],
      companyCodes: ['A005930', 'A000660'],
      positionMap: {
        A005930: 'bull',
        A000660: 'neutral',
      },
    });
  });

  it('uses created_at as a created timestamp when updated_at is missing', () => {
    const report = normalizeHotNewsReport({
      id: 'created-at-fallback',
      title: '2026-05-08 생성 시각 fallback',
      material_change_score: 'not-a-number',
      created_at: '2026-05-08T01:30:00Z',
    });

    expect(report).toMatchObject({
      updatedAt: null,
      displayUpdatedAt: null,
      createdAt: '2026-05-08T01:30:00Z',
      displayCreatedAt: '2026-05-08 10:30',
      hasBeenUpdated: false,
      displayTimestampLabel: '생성 2026-05-08 10:30',
      materialChangeScore: 0,
    });
  });

  it('defaults missing material change scores to zero', () => {
    const report = normalizeHotNewsReport({
      id: 'missing-score',
      title: '점수 없음',
    });

    expect(report?.materialChangeScore).toBe(0);
  });

  it('uses null display updated time when timestamps are missing', () => {
    const report = normalizeHotNewsReport({
      id: 'missing-timestamp',
      issue_date: '2026-05-08',
      title: '업데이트 시각 없음',
    });

    expect(report).toMatchObject({
      updatedAt: null,
      displayUpdatedAt: null,
      createdAt: null,
      displayCreatedAt: null,
      hasBeenUpdated: false,
      displayTimestampLabel: '2026.05.08',
    });
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

  it('falls back to top-level fields when report_payload values normalize empty', () => {
    const report = normalizeHotNewsReport({
      id: 3,
      title: 'top title',
      tldr: ['top'],
      interpretation: 'top interp',
      key_articles: [{ title: 'top article', link: 'https://example.com' }],
      company_news_evidence: [{ company: 'top company', detailedEvidence: ['top evidence'] }],
      report_payload: {
        title: ' ',
        tldr: [],
        interpretation: '',
        keyArticles: [],
        companyNewsEvidence: [],
      },
    });

    expect(report).toMatchObject({
      id: '3',
      title: 'top title',
      tldr: ['top'],
      interpretation: 'top interp',
    });
    expect(report?.keyArticles).toEqual([{ title: 'top article', link: 'https://example.com' }]);
    expect(report?.companyEvidence).toEqual([
      {
        company: 'top company',
        code: null,
        position: null,
        evidence: ['top evidence'],
        links: [],
      },
    ]);
  });

  it('falls back to top-level company evidence when payload entries normalize empty', () => {
    const report = normalizeHotNewsReport({
      id: 4,
      title: '제목',
      company_news_evidence: [
        {
          company: 'top company',
          code: 'A123456',
          position: 'bear',
          detailedEvidence: ['top evidence'],
          detailedNewsLinks: ['https://example.com/source'],
        },
      ],
      report_payload: {
        title: '제목',
        companyNewsEvidence: [{}],
      },
    });

    expect(report?.companyEvidence).toEqual([
      {
        company: 'top company',
        code: 'A123456',
        position: 'bear',
        evidence: ['top evidence'],
        links: ['https://example.com/source'],
      },
    ]);
  });

  it('falls back to top-level company evidence when payload entries have no usable company', () => {
    const report = normalizeHotNewsReport({
      id: 5,
      title: '제목',
      company_news_evidence: [
        {
          company: 'top company',
          code: 'A654321',
          detailedEvidence: ['top evidence'],
        },
      ],
      report_payload: {
        title: '제목',
        companyNewsEvidence: [{ detailedEvidence: ['payload evidence without company'] }],
      },
    });

    expect(report?.companyEvidence).toEqual([
      {
        company: 'top company',
        code: 'A654321',
        position: null,
        evidence: ['top evidence'],
        links: [],
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

  it('excludes article entries without a usable title', () => {
    const report = normalizeHotNewsReport({
      id: 'blank-article-title',
      title: '기사 제목 검증',
      key_articles: [
        { title: '', link: 'https://example.com/blank' },
        { link: 'https://example.com/missing' },
        { title: '정상 기사', link: 'https://example.com/news' },
      ],
    });

    expect(report?.keyArticles).toEqual([{ title: '정상 기사', link: 'https://example.com/news' }]);
  });

  it('formats valid issue dates in Korean financial display style', () => {
    expect(formatIssueDate('2026-05-04')).toBe('2026.05.04');
    expect(formatIssueDate('')).toBe('-');
    expect(formatIssueDate('2026/05/04')).toBe('2026/05/04');
  });

  it('maps hot-news change status values to Korean labels', () => {
    expect(getHotNewsChangeStatusLabel('initial')).toBe('초기 문서');
    expect(getHotNewsChangeStatusLabel('refresh')).toBe('새로고침 업데이트');
    expect(getHotNewsChangeStatusLabel('material_change')).toBe('중요 변경 업데이트');
    expect(getHotNewsChangeStatusLabel('deduplicated')).toBe('중복 정리됨');
  });

  it('keeps unknown change status strings and uses fallback labels', () => {
    const report = normalizeHotNewsReport({
      id: 'unknown-status',
      title: '상태 보존',
      change_status: 'manual_review',
    });

    expect(report?.changeStatus).toBe('manual_review');
    expect(getHotNewsChangeStatusLabel('manual_review')).toBe('manual_review');
    expect(getHotNewsChangeStatusLabel(null)).toBe('상태 없음');
  });
});
