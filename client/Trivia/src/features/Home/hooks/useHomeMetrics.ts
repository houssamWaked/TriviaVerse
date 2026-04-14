import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import { STRINGS } from '@/constants/strings';

type HomeMetricsResponse = {
  active_players?: number | string | null;
  questions?: number | string | null;
  quizzes_created?: number | string | null;
  fun_level?: number | string | null;
};

export type HomeMetrics = {
  active_players: string;
  questions: string;
  quizzes_created: string;
  fun_level: string;
};

function formatCount(n: number | string | null | undefined) {
  const num = Number(n);
  if (!Number.isFinite(num)) return STRINGS.COMMON.separators.emDash;
  if (num >= 1_000_000) return `${Math.floor(num / 1_000_000)}M+`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}K+`;
  return String(num);
}

export function useHomeMetrics() {
  const [metricsRaw, setMetricsRaw] = useState<HomeMetricsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getHomeMetrics()
      .then((data) => {
        if (cancelled) return;
        setMetricsRaw((data ?? null) as HomeMetricsResponse | null);
      })
      .catch(() => {
        // keep defaults if backend is down
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo<HomeMetrics | undefined>(() => {
    if (!metricsRaw) return undefined;
    return {
      active_players: formatCount(metricsRaw.active_players),
      questions: formatCount(metricsRaw.questions),
      quizzes_created: formatCount(metricsRaw.quizzes_created),
      fun_level: `${metricsRaw.fun_level ?? 100}%`,
    };
  }, [metricsRaw]);
}
