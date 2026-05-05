import { useEffect, useRef } from 'react';
import type { HotNewsReport } from '../hot-news/model';

type HotNewsReportModalProps = {
  report: HotNewsReport;
  onClose: () => void;
};

function getEvidenceToneClass(position: string | null) {
  switch (position) {
    case 'bear':
      return 'tone-bear';
    case 'neutral':
      return 'tone-neutral';
    case 'bull':
    default:
      return 'tone-bull';
  }
}

export function HotNewsReportModal({ report, onClose }: HotNewsReportModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.classList.add('modal-open');
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
      previouslyActiveElement?.focus();
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
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
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
          <button
            aria-label="리포트 닫기"
            className="modal-close-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
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
                  <article
                    className={`hot-news-evidence-card ${getEvidenceToneClass(item.position)}`}
                    key={`${item.company}-${item.code ?? ''}`}
                  >
                    <header>
                      <strong>{item.company}</strong>
                      {item.code ? <span>{item.code}</span> : null}
                      {item.position ? <span>{item.position}</span> : null}
                    </header>
                    {item.evidence.length > 0 ? (
                      <ul>
                        {item.evidence.map((evidence, index) => (
                          <li className="hot-news-evidence-item" key={evidence}>
                            <span>{evidence}</span>
                            {item.links[index] ? (
                              <a
                                aria-label={`기사 ${index + 1} 열기`}
                                className="hot-news-evidence-source-button"
                                href={item.links[index]}
                                rel="noreferrer"
                                target="_blank"
                              >
                                기사 {index + 1}
                              </a>
                            ) : null}
                          </li>
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
