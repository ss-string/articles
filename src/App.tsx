import type { RawConsensusRow } from './consensus/model';
import { ConsensusRankingPage } from './components/ConsensusRankingPage';

type AppProps = {
  queryRows?: () => Promise<RawConsensusRow[]>;
};

export default function App({ queryRows }: AppProps) {
  return <ConsensusRankingPage queryRows={queryRows} />;
}
