import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, graphqlPublicApi } from '@/api';
import { STRINGS } from '@/constants/strings';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type {
  CurrentUser,
  LeaderboardResponse,
  QuizDetailsResponse,
  RatingsResponse,
} from '@/features/QuizView/types';

type UseQuizViewDataArgs = {
  quizId: string;
  user: CurrentUser;
};

const strings = STRINGS;

function ratingLabel(avg: number | string | undefined, count: number | string | undefined) {
  const numericAverage = Number(avg);
  const numericCount = Number(count);
  const averageText = Number.isFinite(numericAverage)
    ? numericAverage.toFixed(numericAverage % 1 === 0 ? 0 : 1)
    : '0';
  const countText = Number.isFinite(numericCount) ? numericCount : 0;
  return strings.QUIZ_VIEW.rating.label(averageText, countText);
}

export function useQuizViewData({ quizId, user }: UseQuizViewDataArgs) {
  const hasUser = Boolean(user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [data, setData] = useState<QuizDetailsResponse | null>(null);
  const [ratings, setRatings] = useState<RatingsResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    setNeedsLogin(false);

    try {
      const getDetails = () =>
        graphqlPublicApi
          .getPublicQuiz<QuizDetailsResponse>(quizId)
          .catch(() => api.getPublicQuiz(quizId) as Promise<QuizDetailsResponse>);
      const getRatings = () =>
        graphqlPublicApi
          .getPublicQuizRatings<RatingsResponse>(quizId)
          .catch(() => api.getPublicQuizRatings(quizId) as Promise<RatingsResponse>);
      const getLeaderboard = () =>
        graphqlPublicApi
          .getPublicQuizLeaderboard<LeaderboardResponse>(quizId, 10)
          .catch(() => api.getPublicQuizLeaderboard(quizId, 10) as Promise<LeaderboardResponse>);

      const [details, summary, nextLeaderboard] = (await Promise.all([
        getDetails(),
        getRatings(),
        getLeaderboard(),
      ])) as [QuizDetailsResponse, RatingsResponse, LeaderboardResponse];

      setData(details);
      setRatings(summary);
      setLeaderboard(nextLeaderboard);
    } catch (err) {
      if (isUnauthorized(err)) setNeedsLogin(true);
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [quizId]);

  useEffect(() => {
    void load();
  }, [hasUser, load]);

  const ratingText = useMemo(() => {
    if (!ratings) return strings.QUIZ_VIEW.rating.zero;
    return ratingLabel(ratings.ratings_avg, ratings.ratings_count);
  }, [ratings]);

  return {
    busy,
    setBusy,
    error,
    setError,
    success,
    setSuccess,
    needsLogin,
    data,
    ratings,
    setRatings,
    leaderboard,
    setLeaderboard,
    load,
    ratingText,
  };
}
