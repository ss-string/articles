import { useEffect, useState } from 'react';
import { queryMacroRegimeRows } from './api';
import {
  buildMacroRegimeDecisions,
  type MacroRegimeDecision,
  type RawMacroRegimeRow,
} from './model';

type MacroRegimeState =
  | { status: 'loading'; decisions: MacroRegimeDecision[]; error: null }
  | { status: 'success'; decisions: MacroRegimeDecision[]; error: null }
  | { status: 'error'; decisions: MacroRegimeDecision[]; error: string };

type UseMacroRegimeOptions = {
  queryRows?: () => Promise<RawMacroRegimeRow[]>;
};

export function useMacroRegimeDecisions(options: UseMacroRegimeOptions = {}): MacroRegimeState {
  const [state, setState] = useState<MacroRegimeState>({
    status: 'loading',
    decisions: [],
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRows = options.queryRows ?? queryMacroRegimeRows;

    async function load() {
      setState({ status: 'loading', decisions: [], error: null });

      try {
        const rawRows = await loadRows();
        const decisions = buildMacroRegimeDecisions(rawRows);

        if (isMounted) {
          setState({ status: 'success', decisions, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            status: 'error',
            decisions: [],
            error: error instanceof Error ? error.message : '매크로 레짐 데이터를 불러오지 못했습니다.',
          });
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [options.queryRows]);

  return state;
}
