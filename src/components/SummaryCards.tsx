import { formatPercent, type ConsensusRankingRow } from '../consensus/model';

type SummaryCardsProps = {
  rows: ConsensusRankingRow[];
};

export function SummaryCards({ rows }: SummaryCardsProps) {
  const maxGap = rows.length === 0 ? null : Math.max(...rows.map((row) => row.gapPercent));
  const averageGap =
    rows.length === 0 ? null : rows.reduce((sum, row) => sum + row.gapPercent, 0) / rows.length;
  const oneMonthUpCount = rows.filter(
    (row) => row.oneMonthConsensusChangePercent !== null && row.oneMonthConsensusChangePercent > 0,
  ).length;

  return (
    <section className="summary-grid" aria-label="컨센서스 요약">
      <article className="summary-card">
        <span>최대 괴리율</span>
        <strong>{formatPercent(maxGap)}</strong>
      </article>
      <article className="summary-card">
        <span>평균 괴리율</span>
        <strong>{formatPercent(averageGap)}</strong>
      </article>
      <article className="summary-card">
        <span>1개월 상향 종목</span>
        <strong>{oneMonthUpCount.toLocaleString('ko-KR')}</strong>
      </article>
      <article className="summary-card">
        <span>표시 종목</span>
        <strong>{rows.length.toLocaleString('ko-KR')}</strong>
      </article>
    </section>
  );
}
