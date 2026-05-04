import { useEffect } from 'react';
import type { HotNewsReport } from '../hot-news/model';

type HotNewsReportModalProps = {
  report: HotNewsReport;
  onClose: () => void;
};

export function HotNewsReportModal({ report, onClose }: HotNewsReportModalProps) {
  useEffect(() => {
    document.body.classList.add('modal-open');

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="hot-news-modal-layer">
      <button
        aria-label="리포트 배경 닫기"
        className="hot-news-modal-backdrop"
        data-testid="hot-news-modal-backdrop"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="hot-news-modal-title"
        aria-modal="true"
        className="hot-news-modal"
        role="dialog"
      >
        <header className="hot-news-modal-header">
          <div>
            <span>Hot News Report</span>
            <h3 id="hot-news-modal-title">{report.title}</h3>
            <p>
              {report.displayDate}
              {report.perspective ? ` · ${report.perspective}` : ''}
            </p>
          </div>
          <button aria-label="리포트 닫기" className="modal-close-button" onClick={onClose} type="button">
            ×
          </button>
        </header>

        <div className="hot-news-modal-body">
          {report.tldr.length > 0 ? (
            <section className="hot-news-modal-section">
              <h4>TL;DR</h4>
              <ul>
                {report.tldr.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.interpretation ? (
            <section className="hot-news-modal-section">
              <h4>시장 해석</h4>
              <p>{report.interpretation}</p>
            </section>
          ) : null}

          {report.companyEvidence.length > 0 ? (
            <section className="hot-news-modal-section">
              <h4>기업별 근거</h4>
              <div className="hot-news-evidence-list">
                {report.companyEvidence.map((item) => (
                  <article className="hot-news-evidence-card" key={`${item.company}-${item.code ?? ''}`}>
                    <header>
                      <strong>{item.company}</strong>
                      {item.code ? <span>{item.code}</span> : null}
                      {item.position ? <span>{item.position}</span> : null}
                    </header>
                    {item.evidence.length > 0 ? (
                      <ul>
                        {item.evidence.map((evidence) => (
                          <li key={evidence}>{evidence}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {report.keyArticles.length > 0 ? (
            <section className="hot-news-modal-section">
              <h4>주요 기사</h4>
              <ul className="hot-news-article-list">
                {report.keyArticles.map((article) => (
                  <li key={`${article.title}-${article.link ?? ''}`}>
                    {article.link ? (
                      <a href={article.link} rel="noreferrer" target="_blank">
                        <span>{article.title}</span>
                        <span>열기</span>
                      </a>
                    ) : (
                      <div className="hot-news-article-row">
                        <span>{article.title}</span>
                        <span>링크 없음</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
