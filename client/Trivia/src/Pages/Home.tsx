import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import colors from '@/constants/colors';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import CreateQuizBanner from '@/Components/HomeComponents/CreateQuizBanner';
import FeaturesStrip from '@/Components/HomeComponents/FeaturesStrip';
import HomeHero from '@/Components/HomeComponents/HomeHero';
import Modes from '@/Components/HomeComponents/Modes';

type HomeMetricsResponse = {
  active_players?: number | string | null;
  questions?: number | string | null;
  quizzes_created?: number | string | null;
  fun_level?: number | string | null;
};

type HomeProps = {
  user?: unknown;
  onRequireAuth?: (intent?: string) => void;
  onNavigateCreateQuiz?: () => void;
  onNavigateStory?: () => void;
  onNavigateMillionaire?: () => void;
  onNavigateClassic?: () => void;
  onNavigateBlitz?: () => void;
};

/**
 * Format a large numeric metric into a compact display string.
 * @param n Raw numeric-ish value.
 * @returns Human-friendly string (e.g. `1K+`, `3M+`) or an em dash when invalid.
 */
function formatCount(n: number | string | null | undefined) {
  const num = Number(n);
  if (!Number.isFinite(num)) return STRINGS.COMMON.separators.emDash;
  if (num >= 1_000_000) return `${Math.floor(num / 1_000_000)}M+`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}K+`;
  return String(num);
}

/**
 * Home/landing page: fetches public metrics and presents the primary game mode entry points.
 * @param user Current user snapshot (used to gate "Create Quiz").
 * @param onRequireAuth Callback to trigger auth UI when a protected action is requested.
 * @returns React element.
 */
function Home({
  user,
  onRequireAuth,
  onNavigateCreateQuiz,
  onNavigateStory,
  onNavigateMillionaire,
  onNavigateClassic,
  onNavigateBlitz,
}: HomeProps) {
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

  const metrics = useMemo(() => {
    if (!metricsRaw) return undefined;
    return {
      active_players: formatCount(metricsRaw.active_players),
      questions: formatCount(metricsRaw.questions),
      quizzes_created: formatCount(metricsRaw.quizzes_created),
      fun_level: `${metricsRaw.fun_level ?? 100}%`,
    };
  }, [metricsRaw]);

  const handleCreateQuiz = async () => {
    if (!user) return onRequireAuth?.('create-quiz');
    return onNavigateCreateQuiz?.();
  };

  return (
    <Box
      component="main"
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: 'common.white',
        background: `
          radial-gradient(circle at top left, rgba(37,99,235,0.22), rgba(37,99,235,0) 34%),
          linear-gradient(180deg, ${colors.neutral[900]} 0%, ${colors.neutral[800]} 100%)
        `,
      }}
    >
      <HomeHero
        metrics={metrics}
        onCreateQuiz={handleCreateQuiz}
        onStartPlaying={() => {
          const el = document.getElementById('modes');
          el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        }}
      />
      <Box id="modes" sx={{ position: 'relative', scrollMarginTop: 96 }}>
        <Modes
          onStory={onNavigateStory}
          onMillionaire={onNavigateMillionaire}
          onClassic={onNavigateClassic}
          onBlitz={onNavigateBlitz}
        />
      </Box>
      <CreateQuizBanner onCreate={handleCreateQuiz} />
      <FeaturesStrip />
    </Box>
  );
}

export default Home;

