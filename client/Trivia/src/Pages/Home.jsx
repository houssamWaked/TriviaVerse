import React, { useEffect, useMemo, useState } from 'react';
import colors from '@/constants/colors';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import CreateQuizBanner from '@/Components/HomeComponents/CreateQuizBanner';
import FeaturesStrip from '@/Components/HomeComponents/FeaturesStrip';
import HomeHero from '@/Components/HomeComponents/HomeHero';
import Modes from '@/Components/HomeComponents/Modes';

const styles = {
  main: {
    width: '100%',
    background: colors.gradients.main,
    display: 'flex',
    flexDirection: 'column',
  },
};

function formatCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return STRINGS.COMMON.separators.emDash;
  if (num >= 1_000_000) return `${Math.floor(num / 1_000_000)}M+`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}K+`;
  return String(num);
}

function Home({
  user,
  onRequireAuth,
  onNavigateCreateQuiz,
  onNavigateStory,
  onNavigateMillionaire,
  onNavigateClassic,
  onNavigateBlitz,
}) {
  const [metricsRaw, setMetricsRaw] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getHomeMetrics()
      .then((data) => {
        if (cancelled) return;
        setMetricsRaw(data);
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
    <main style={styles.main}>
      <HomeHero
        metrics={metrics}
        onCreateQuiz={handleCreateQuiz}
        onStartPlaying={() => {
          const el = document.getElementById('modes');
          el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        }}
      />
      <div id="modes">
        <Modes
          onStory={onNavigateStory}
          onMillionaire={onNavigateMillionaire}
          onClassic={onNavigateClassic}
          onBlitz={onNavigateBlitz}
        />
      </div>
      <CreateQuizBanner onCreate={handleCreateQuiz} />
      <FeaturesStrip />
    </main>
  );
}

export default Home;

