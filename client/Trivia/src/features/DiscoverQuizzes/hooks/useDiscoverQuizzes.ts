/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api } from '@/api';
import { STRINGS } from '@/constants/strings';
import { getApiErrorMessage } from '@/utils/apiError';
import type { AppUser, DiscoverQuiz } from '@/features/DiscoverQuizzes/types';

type UseDiscoverQuizzesResult = {
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
  busy: boolean;
  error: string;
  results: DiscoverQuiz[];
  placeholder: string;
  doSearch: SearchQuizzesHandler;
};

type SearchQuizzesHandler = {
  (query: string): Promise<void>;
};

/**
 * Encapsulates discovery page loading and search behavior.
 */
export function useDiscoverQuizzes(user?: AppUser): UseDiscoverQuizzesResult {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<DiscoverQuiz[]>([]);

  const reqSeqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canSeePrivate = !!user;

  const placeholder = useMemo(
    () =>
      canSeePrivate
        ? STRINGS.DISCOVER_QUIZZES.placeholder.loggedIn
        : STRINGS.DISCOVER_QUIZZES.placeholder.loggedOut,
    [canSeePrivate]
  );

  const loadTop = useCallback(async () => {
    const seq = (reqSeqRef.current += 1);
    if (mountedRef.current) {
      setBusy(true);
      setError('');
    }
    try {
      const data = (await api.getTopQuizzes(20)) as { results?: DiscoverQuiz[] };
      if (!mountedRef.current || reqSeqRef.current !== seq) return;
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      if (!mountedRef.current || reqSeqRef.current !== seq) return;
      setError(getApiErrorMessage(err));
    } finally {
      if (mountedRef.current && reqSeqRef.current === seq) {
        setBusy(false);
      }
    }
  }, []);

  const doSearch = useCallback(
    async (query: string) => {
      const term = String(query || '').trim();
      if (!term) {
        await loadTop();
        return;
      }

      const seq = (reqSeqRef.current += 1);
      if (mountedRef.current) {
        setBusy(true);
        setError('');
      }
      try {
        const data = (await api.searchQuizzes(term, 30)) as { results?: DiscoverQuiz[] };
        if (!mountedRef.current || reqSeqRef.current !== seq) return;
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        if (!mountedRef.current || reqSeqRef.current !== seq) return;
        setError(getApiErrorMessage(err));
      } finally {
        if (mountedRef.current && reqSeqRef.current === seq) {
          setBusy(false);
        }
      }
    },
    [loadTop]
  );

  useEffect(() => {
    const term = String(q || '').trim();
    if (!term) return undefined;
    const timeoutId = window.setTimeout(() => {
      void doSearch(term);
    }, 150);
    return () => window.clearTimeout(timeoutId);
  }, [q, canSeePrivate, doSearch]);

  useEffect(() => {
    const term = String(q || '').trim();
    if (term) return;
    void loadTop();
  }, [canSeePrivate, q, loadTop]);

  return {
    q,
    setQ,
    busy,
    error,
    results,
    placeholder,
    doSearch,
  };
}
