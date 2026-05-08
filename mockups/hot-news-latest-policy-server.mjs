import { createServer } from 'node:http';

const pageUrl = 'https://ss-string.github.io/articles/';
const port = Number(process.env.PORT ?? 4179);

function getTodayInSeoul() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stripIssueDatePrefix(value) {
  return String(value ?? '').replace(/^\d{4}-\d{2}-\d{2}\s+/, '').trim();
}

function displayTitle(row) {
  const payload = toRecord(row.report_payload);
  return stripIssueDatePrefix(payload.title || row.title || row.perspective);
}

function formatKoreanDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day} ${byType.hour}:${byType.minute}`;
}

function positionLabel(position) {
  switch (position) {
    case 'bull':
      return 'bull';
    case 'bear':
      return 'bear';
    case 'neutral':
      return 'neutral';
    default:
      return position || '';
  }
}

async function resolveSupabaseConfig() {
  const html = await fetch(pageUrl).then((response) => response.text());
  const scriptPath = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  if (!scriptPath) {
    throw new Error('배포 번들 경로를 찾지 못했습니다.');
  }

  const bundle = await fetch(new URL(scriptPath, pageUrl)).then((response) => response.text());
  const supabaseUrl = bundle.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
  const publishableKey =
    bundle.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0] ??
    bundle.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];

  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase 공개 설정을 찾지 못했습니다.');
  }

  return { supabaseUrl, publishableKey };
}

async function fetchJson(supabaseUrl, publishableKey, path) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      Accept: 'application/json',
    },
  });
  const body = await response.json().catch(async () => ({ error: await response.text() }));
  if (!response.ok) {
    throw new Error(`Supabase 조회 실패: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function loadRowsForIssueDate(supabaseUrl, publishableKey, select, targetDate) {
  const latestRows = await fetchJson(
    supabaseUrl,
    publishableKey,
    `/rest/v1/toss_wts_hot_news_latest_reports?select=${select}&issue_date=eq.${targetDate}&order=perspective_key.asc`,
  );
  const historyRows = await fetchJson(
    supabaseUrl,
    publishableKey,
    `/rest/v1/toss_wts_hot_news_reports?select=${select}&issue_date=eq.${targetDate}&order=perspective_key.asc,is_latest.desc,run_slot.asc`,
  );
  return { latestRows, historyRows };
}

async function loadData() {
  const { supabaseUrl, publishableKey } = await resolveSupabaseConfig();
  const select = [
    'id',
    'issue_date',
    'run_slot',
    'perspective',
    'perspective_key',
    'is_latest',
    'change_status',
    'change_reason',
    'material_change_score',
    'source_news_ids',
    'company_codes',
    'position_map',
    'title',
    'tldr',
    'key_articles',
    'company_news_evidence',
    'interpretation',
    'report_payload',
    'created_at',
    'updated_at',
  ].join(',');
  const today = process.env.HOT_NEWS_ISSUE_DATE ?? getTodayInSeoul();
  let selectedIssueDate = today;
  let { latestRows, historyRows } = await loadRowsForIssueDate(supabaseUrl, publishableKey, select, selectedIssueDate);

  if (latestRows.length === 0) {
    const latestDateRows = await fetchJson(
      supabaseUrl,
      publishableKey,
      '/rest/v1/toss_wts_hot_news_latest_reports?select=issue_date&order=issue_date.desc&limit=1',
    );
    selectedIssueDate = latestDateRows[0]?.issue_date ?? today;
    ({ latestRows, historyRows } = await loadRowsForIssueDate(supabaseUrl, publishableKey, select, selectedIssueDate));
  }

  return {
    today,
    selectedIssueDate,
    isFallback: selectedIssueDate !== today,
    refreshedAt: new Date().toISOString(),
    latestRows,
    historyRows,
  };
}

function renderHtml(data) {
  const firstKey = data.latestRows[0]?.perspective_key ?? '';
  const latestCards = data.latestRows
    .map((row) => {
      const payload = toRecord(row.report_payload);
      const tldr = toArray(payload.tldr).length > 0 ? payload.tldr : toArray(row.tldr);
      const statusClass = row.change_status === 'material_change' ? 'status material' : 'status';
      return `
        <button class="report-card" data-key="${escapeHtml(row.perspective_key)}" type="button">
          <span class="meta">업데이트 ${escapeHtml(formatKoreanDateTime(row.updated_at || row.created_at))}</span>
          <strong>${escapeHtml(displayTitle(row))}</strong>
          ${row.change_status === 'material_change' ? `<span class="${statusClass}">중요 변경</span>` : ''}
          <p>${escapeHtml(tldr[0] ?? '')}</p>
        </button>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>핫뉴스 latest 정책 목업</title>
    <style>
      :root {
        color: #152238;
        background: #f4f7f9;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { max-width: 1240px; margin: 0 auto; padding: 32px 20px 56px; }
      .topbar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
      h1 { margin: 0; color: #152238; font-size: 1.65rem; letter-spacing: 0; }
      .subtitle { margin: 8px 0 0; color: #64748b; line-height: 1.55; }
      .pill-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; justify-content: flex-end; }
      .pill { border: 1px solid #b9d6d2; border-radius: 8px; padding: 6px 9px; background: #eef7f6; color: #0f766e; font-size: 0.78rem; font-weight: 850; }
      .notice { border-color: #fde68a; background: #fffbeb; color: #92400e; }
      .layout { display: grid; grid-template-columns: minmax(0, 0.92fr) minmax(460px, 1.08fr); gap: 18px; align-items: start; }
      .panel { border: 1px solid #e3e7ee; border-radius: 8px; background: #fff; box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06); }
      .panel-header { padding: 18px 18px 0; }
      .panel-header h2 { margin: 0; font-size: 1rem; letter-spacing: 0; }
      .panel-header p { margin: 6px 0 0; color: #64748b; font-size: 0.9rem; line-height: 1.5; }
      .grid { display: grid; gap: 12px; padding: 18px; }
      .report-card { display: grid; min-height: 146px; gap: 9px; align-content: start; padding: 16px; border: 1px solid #e3e7ee; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; transition: 160ms ease; }
      .report-card:hover, .report-card:focus-visible, .report-card.active { border-color: #0f766e; background: #f8fcfb; box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08); outline: none; }
      .report-card strong { color: #152238; font-size: 1.04rem; line-height: 1.35; overflow-wrap: anywhere; }
      .report-card p { margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.48; overflow-wrap: anywhere; }
      .meta { color: #64748b; font-size: 0.76rem; font-weight: 850; letter-spacing: 0; }
      .status { width: fit-content; border: 1px solid #fbbf24; border-radius: 8px; padding: 3px 7px; background: #fff7ed; color: #9a3412; font-size: 0.72rem; font-weight: 850; }
      .detail { padding: 18px; }
      .detail-title { margin: 0 0 8px; color: #152238; font-size: 1.35rem; line-height: 1.32; overflow-wrap: anywhere; }
      .detail-copy { margin: 0 0 16px; color: #475569; line-height: 1.55; }
      .section { border: 1px solid #e3e7ee; border-radius: 8px; padding: 14px; background: #f8fafc; }
      .section + .section { margin-top: 12px; }
      .section h3 { margin: 0 0 10px; color: #0f766e; font-size: 0.9rem; letter-spacing: 0; }
      .section p, .section li { color: #465468; line-height: 1.55; }
      .section ul { display: grid; gap: 8px; margin: 0; padding-left: 18px; }
      .evidence-list { display: grid; gap: 12px; }
      .evidence-card { border: 1px solid #e3e7ee; border-radius: 8px; padding: 14px; background: #fff; }
      .evidence-card header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
      .evidence-card strong { color: #152238; }
      .tag { border-radius: 8px; padding: 3px 8px; background: #eef2f7; color: #475569; font-size: 0.75rem; font-weight: 850; }
      .tone-bull { border-color: #b9d6d2; background: #f4fbfa; }
      .tone-bull .tag { background: #eef7f6; color: #0f766e; }
      .tone-neutral { border-color: #d8dee8; background: #f8fafc; }
      .tone-neutral .tag { background: #f1f5f9; color: #475569; }
      .tone-bear { border-color: #fecdd3; background: #fff7f7; }
      .tone-bear .tag { background: #fff1f2; color: #b91c1c; }
      .evidence-item { display: flex; min-width: 0; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .source-button { display: inline-flex; flex: 0 0 auto; min-height: 24px; align-items: center; justify-content: center; border: 1px solid #b9d6d2; border-radius: 8px; padding: 2px 7px; background: #eef7f6; color: #0f766e; font-size: 0.72rem; font-weight: 850; line-height: 1.2; text-decoration: none; white-space: nowrap; }
      .article-list { padding-left: 0; list-style: none; }
      .article-list a, .article-row { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 14px; border: 1px solid #b9d6d2; border-radius: 8px; padding: 10px 12px; background: #eef7f6; color: #465468; text-decoration: none; }
      .article-list span:first-child, .article-row span:first-child { min-width: 0; overflow-wrap: anywhere; }
      .article-list span:last-child, .article-row span:last-child { flex: 0 0 auto; color: #0f766e; font-size: 0.78rem; font-weight: 850; }
      .debug { background: #fff; }
      .debug-row { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 8px; margin: 0; color: #475569; font-size: 0.86rem; }
      .debug-row + .debug-row { margin-top: 6px; }
      .debug-row dt { color: #64748b; font-weight: 850; }
      details { margin-top: 10px; }
      summary { cursor: pointer; color: #0f766e; font-size: 0.82rem; font-weight: 850; }
      pre { max-height: 180px; overflow: auto; margin: 10px 0 0; padding: 10px; border-radius: 8px; background: #0f172a; color: #e2e8f0; font-size: 0.74rem; line-height: 1.45; white-space: pre-wrap; }
      @media (max-width: 980px) {
        .layout { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="topbar">
        <div>
          <h1>핫뉴스 리포트</h1>
          <p class="subtitle">오늘 발행된 관점별 최신 리포트를 먼저 보여주고, 오늘 데이터가 없으면 가장 최신 발행일을 표시합니다.</p>
        </div>
        <div class="pill-row">
          <span class="pill">오늘 ${escapeHtml(data.today)}</span>
          <span class="pill${data.isFallback ? ' notice' : ''}">${data.isFallback ? `최신 ${escapeHtml(data.selectedIssueDate)} 표시` : `발행 ${escapeHtml(data.selectedIssueDate)}`}</span>
          <span class="pill">${data.latestRows.length}개 관점</span>
        </div>
      </div>
      <div class="layout">
        <section class="panel">
          <div class="panel-header">
            <h2>관점 목록</h2>
            <p>중복 정리가 끝난 latest 리포트만 표시합니다.</p>
          </div>
          <div class="grid">${latestCards}</div>
        </section>
        <aside class="panel">
          <div class="panel-header">
            <h2>리포트 상세</h2>
            <p>기존 형식대로 핵심 요약, 시장 해석, 기업별 근거, 관련 기사 링크를 유지합니다.</p>
          </div>
          <div class="detail" id="detail"></div>
        </aside>
      </div>
    </main>
    <script>
      const data = ${escapeScriptJson(data)};
      const firstKey = ${escapeScriptJson(firstKey)};

      const byKey = new Map();
      for (const row of data.historyRows) {
        const key = row.perspective_key || '';
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push(row);
      }
      const latestByKey = new Map(data.latestRows.map((row) => [row.perspective_key || '', row]));

      function text(value) {
        return value == null ? '' : String(value);
      }
      function html(value) {
        return text(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }
      function arr(value) {
        return Array.isArray(value) ? value : [];
      }
      function record(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      }
      function stripDate(value) {
        return text(value).replace(/^\\d{4}-\\d{2}-\\d{2}\\s+/, '').trim();
      }
      function formattedTime(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return text(value);
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(date);
        const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        return byType.year + '-' + byType.month + '-' + byType.day + ' ' + byType.hour + ':' + byType.minute;
      }
      function tone(position) {
        return ['bull', 'neutral', 'bear'].includes(position) ? 'tone-' + position : '';
      }
      function statusLabel(row) {
        if (row.change_status === 'initial') return '초기 문서';
        if (row.change_status === 'refresh') return '새로고침 업데이트';
        if (row.change_status === 'material_change') return '중요 변경 업데이트';
        if (row.change_status === 'deduplicated') return '중복 정리됨';
        return row.change_status || '상태 없음';
      }
      function articleList(row) {
        const p = record(row.report_payload);
        return arr(p.keyArticles).length > 0 ? arr(p.keyArticles) : arr(row.key_articles);
      }
      function evidenceList(row) {
        const p = record(row.report_payload);
        return arr(p.companyNewsEvidence).length > 0 ? arr(p.companyNewsEvidence) : arr(row.company_news_evidence);
      }
      function tldrList(row) {
        const p = record(row.report_payload);
        return arr(p.tldr).length > 0 ? arr(p.tldr) : arr(row.tldr);
      }
      function interpretation(row) {
        const p = record(row.report_payload);
        return p.interpretation || row.interpretation || '';
      }
      function renderDetail(key) {
        const report = latestByKey.get(key);
        const rows = byKey.get(key) || [];
        const body = document.querySelector('#detail');
        if (!report) {
          body.innerHTML = '<p class="detail-copy">선택된 리포트가 없습니다.</p>';
          return;
        }
        const p = record(report.report_payload);
        const title = stripDate(p.title || report.title || report.perspective);
        const tldr = tldrList(report);
        const evidences = evidenceList(report);
        const articles = articleList(report);
        const dedupedRows = rows.filter((row) => row.change_status === 'deduplicated');
        const evidenceHtml = evidences.map((item) => {
          const evidenceItems = arr(item.detailedEvidence).map((evidence, index) => {
            const link = arr(item.detailedNewsLinks)[index];
            return '<li class="evidence-item"><span>' + html(evidence) + '</span>' +
              (link ? '<a class="source-button" href="' + html(link) + '" target="_blank" rel="noreferrer">기사 ' + (index + 1) + '</a>' : '') +
              '</li>';
          }).join('');
          return '<article class="evidence-card ' + html(tone(item.position)) + '">' +
            '<header><strong>' + html(item.company) + '</strong>' +
            (item.code ? '<span class="tag">' + html(item.code) + '</span>' : '') +
            (item.position ? '<span class="tag">' + html(item.position) + '</span>' : '') +
            '</header><ul>' + evidenceItems + '</ul></article>';
        }).join('');
        const articleHtml = articles.map((article) => {
          if (article.link) {
            return '<li><a href="' + html(article.link) + '" target="_blank" rel="noreferrer"><span>' + html(article.title) + '</span><span>열기</span></a></li>';
          }
          return '<li><div class="article-row"><span>' + html(article.title) + '</span><span>링크 없음</span></div></li>';
        }).join('');
        body.innerHTML = [
          '<h2 class="detail-title">' + html(title) + '</h2>',
          '<p class="detail-copy">업데이트 ' + html(formattedTime(report.updated_at || report.created_at)) + '</p>',
          '<section class="section"><h3>TL;DR</h3><ul>' + tldr.map((item) => '<li>' + html(item) + '</li>').join('') + '</ul></section>',
          interpretation(report) ? '<section class="section"><h3>시장 해석</h3><p>' + html(interpretation(report)) + '</p></section>' : '',
          evidenceHtml ? '<section class="section"><h3>기업별 근거</h3><div class="evidence-list">' + evidenceHtml + '</div></section>' : '',
          articleHtml ? '<section class="section"><h3>주요 기사</h3><ul class="article-list">' + articleHtml + '</ul></section>' : '',
          '<section class="section debug"><h3>디버그 상태</h3><dl>' +
            '<div class="debug-row"><dt>문서 상태</dt><dd>' + html(statusLabel(report)) + '</dd></div>' +
            '<div class="debug-row"><dt>업데이트</dt><dd>' + html(formattedTime(report.updated_at || report.created_at)) + '</dd></div>' +
            '<div class="debug-row"><dt>정리 이력</dt><dd>' + (dedupedRows.length > 0 ? html(dedupedRows.map((row) => stripDate(row.title || row.perspective)).join(', ')) : '없음') + '</dd></div>' +
          '</dl><details><summary>원본 추적 필드</summary><pre>' + html(JSON.stringify({ perspective_key: report.perspective_key, run_slot: report.run_slot, change_status: report.change_status, source_news_ids: report.source_news_ids, company_codes: report.company_codes, position_map: report.position_map }, null, 2)) + '</pre></details></section>',
        ].join('');
      }
      function selectCard(key) {
        document.querySelectorAll('.report-card').forEach((card) => {
          card.classList.toggle('active', card.dataset.key === key);
        });
        renderDetail(key);
      }
      document.querySelectorAll('.report-card').forEach((card) => {
        card.addEventListener('click', () => selectCard(card.dataset.key));
      });
      selectCard(firstKey);
    </script>
  </body>
</html>`;
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    const data = await loadData();
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(renderHtml(data));
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.stack : String(error));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Hot news policy mockup: http://127.0.0.1:${port}`);
});
