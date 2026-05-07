/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { STRINGS } from '@/constants/strings';
import type { AppUser, DiscoverQuiz } from '@/features/DiscoverQuizzes/types';
import type { AppDispatch, RootState } from '@/store';
import {
  loadTopQuizzes,
  searchQuizzes,
  setQuery,
} from '@/store/slices/discoverSlice';

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
  const dispatch = useDispatch<AppDispatch>();
  const { q, busy, error, results } = useSelector((state: RootState) => state.discover);

  const canSeePrivate = !!user;

  const placeholder = useMemo(
    () =>
      canSeePrivate
        ? STRINGS.DISCOVER_QUIZZES.placeholder.loggedIn
        : STRINGS.DISCOVER_QUIZZES.placeholder.loggedOut,
    [canSeePrivate]
  );

  const loadTop = useCallback(async () => {
    await dispatch(loadTopQuizzes());
  }, [dispatch]);

  const doSearch = useCallback(
    async (query: string) => {
      const term = String(query || '').trim();
      if (!term) {
        await loadTop();
        return;
      }

      await dispatch(searchQuizzes(term));
    },
    [dispatch, loadTop]
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
    setQ: ((next) => {
      const value = typeof next === 'function' ? next(q) : next;
      dispatch(setQuery(value));
    }) as Dispatch<SetStateAction<string>>,
    busy,
    error,
    results,
    placeholder,
    doSearch,
  };
}
