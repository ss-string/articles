import { formatPercent, type ConsensusRankingRow } from '../consensus/model';

type SummaryCardsProps = {
  rows: ConsensusRankingRow[];
};

function InlinePieces({ value }: { value: string }) {
  const splitIndex = Math.max(value.length - 1, 0);

  return (
    <>
      <span>{value.slice(0, splitIndex)}</span>
      <span>{value.slice(splitIndex)}</span>
    </>
  );
}

export function SummaryCards({ rows }: SummaryCardsProps) {
  const maxGap = rows[0]?.gapPercent ?? null;
  const averageGap =
    rows.length === 0 ? null : rows.reduce((sum, row) => sum + row.gapPercent, 0) / rows.length;
  const oneMonthUpCount = rows.filter(
    (row) => row.oneMonthConsensusChangePercent !== null && row.oneMonthConsensusChangePercent > 0,
  ).length;

  return (
    <section className="summary-grid" aria-label="컨센서스 요약">
      <article className="summary-card">
        <span>최대 상승 여력</span>
        <strong>
          <InlinePieces value={formatPercent(maxGap)} />
        </strong>
      </article>
      <article className="summary-card">
        <span>평균 괴리율</span>
        <strong>
          <InlinePieces value={formatPercent(averageGap)} />
        </strong>
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
