import type { RawConsensusRow } from './consensus/model';
import type { RawHotNewsReportRow } from './hot-news/model';
import {
  articles,
  metrics,
  navItems,
  profileLinks,
  projects,
  stackGroups,
} from './content';
import { ConsensusRankingPage } from './components/ConsensusRankingPage';
import { HotNewsReportsPage } from './components/HotNewsReportsPage';
import './styles.css';

type AppProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
  queryHotNewsRows?: () => Promise<RawHotNewsReportRow[]>;
};

function externalLinkProps(href: string) {
  if (href.startsWith('mailto:')) {
    return {};
  }

  return {
    target: '_blank',
    rel: 'noreferrer',
  };
}

export default function App({ queryRows, queryHotNewsRows }: AppProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Portfolio dashboard home">
          <span className="brand-mark">S</span>
          <span>
            <strong>Sunghyun</strong>
            <small>Portfolio</small>
          </span>
        </a>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <header className="top-nav">
        <a className="brand" href="#overview" aria-label="Portfolio dashboard home">
          <span className="brand-mark">S</span>
          <span>
            <strong>Sunghyun</strong>
            <small>Portfolio</small>
          </span>
        </a>
        <nav className="mobile-links" aria-label="Mobile">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="dashboard">
        <section className="hero-section" id="overview" aria-labelledby="overview-title">
          <div className="eyebrow">Portfolio Dashboard</div>
          <div className="hero-grid">
            <div>
              <h1 id="overview-title">Portfolio Dashboard</h1>
              <p className="hero-copy">
                Building focused web interfaces, useful dashboards, and practical writing
                about product-minded frontend work.
              </p>
              <div className="hero-actions">
                <a className="primary-action" href="#work">
                  View Work
                </a>
                <a className="secondary-action" href="#writing">
                  Read Articles
                </a>
              </div>
            </div>
            <div className="status-panel" aria-label="Current focus">
              <span>Current focus</span>
              <strong>Dashboard systems and static publishing workflows</strong>
              <p>React, TypeScript, GitHub Pages, and content-heavy personal tools.</p>
            </div>
          </div>

          <div className="metrics-grid" aria-label="Dashboard metrics">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <HotNewsReportsPage queryRows={queryHotNewsRows} />

        <ConsensusRankingPage queryRows={queryRows} />

        <section className="dashboard-section" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <span>Work</span>
            <h2 id="work-title">Featured Work</h2>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.title}>
                <div className="card-meta">
                  <span>{project.status}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="tag-row">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a href={project.link} {...externalLinkProps(project.link)}>
                  Project Link
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section" id="writing" aria-labelledby="writing-title">
          <div className="section-heading">
            <span>Writing</span>
            <h2 id="writing-title">Writing</h2>
          </div>
          <div className="article-list">
            {articles.map((article) => (
              <article className="article-item" key={article.title}>
                <div>
                  <span className="article-topic">{article.topic}</span>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                </div>
                <div className="article-side">
                  <time dateTime={article.date.replace(/\./g, '-')}>{article.date}</time>
                  <a href={article.link} {...externalLinkProps(article.link)}>
                    Open
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section" id="stack" aria-labelledby="stack-title">
          <div className="section-heading">
            <span>Stack</span>
            <h2 id="stack-title">Stack</h2>
          </div>
          <div className="stack-grid">
            {stackGroups.map((group) => (
              <article className="stack-card" key={group.name}>
                <h3>{group.name}</h3>
                <ul>
                  {group.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section contact-section" id="contact" aria-labelledby="contact-title">
          <div className="section-heading">
            <span>Contact</span>
            <h2 id="contact-title">Contact</h2>
          </div>
          <p>
            Open to frontend, dashboard, and content tooling conversations. The fastest
            place to start is GitHub or email.
          </p>
          <div className="contact-links">
            {profileLinks.map((link) => (
              <a href={link.href} key={link.label} {...externalLinkProps(link.href)}>
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
