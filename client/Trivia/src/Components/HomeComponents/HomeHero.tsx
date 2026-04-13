import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import StatCard from '@/Cards/HomeCards/StatCard';

type HomeMetrics = {
  active_players: React.ReactNode;
  questions: React.ReactNode;
  quizzes_created: React.ReactNode;
  fun_level: React.ReactNode;
};

type HomeHeroProps = {
  metrics?: HomeMetrics;
  onStartPlaying?: () => void;
  onCreateQuiz?: () => void | Promise<void>;
};

/**
 * Home hero section: headline, primary CTAs, and stat cards.
 * @param metrics Pre-formatted metrics for display.
 * @param onStartPlaying Callback to scroll/navigate into modes.
 * @returns React element.
 */
export default function HomeHero({
  metrics = STRINGS.HOME.statsDefaults,
  onStartPlaying,
  onCreateQuiz,
}: HomeHeroProps) {
  const statItems: React.ComponentProps<typeof StatCard>[] = [
    {
      icon: ICONS.common.people,
      value: metrics.active_players,
      label: STRINGS.HOME.stats.activePlayers,
      valueColor: colors.accent.blue,
    },
    {
      icon: ICONS.common.question,
      value: metrics.questions,
      label: STRINGS.HOME.stats.questions,
      valueColor: colors.accent.green,
    },
    {
      icon: ICONS.brand.sparkles,
      value: metrics.quizzes_created,
      label: STRINGS.HOME.stats.quizzesCreated,
      valueColor: colors.primary[300],
    },
    {
      icon: ICONS.common.party,
      value: metrics.fun_level,
      label: STRINGS.HOME.stats.funLevel,
      valueColor: colors.secondary[300],
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 8 },
        color: 'common.white',
        background: colors.gradients.main,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 3.5, md: 4.5 },
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(340px, 0.9fr)' },
          }}
        >
          <Stack spacing={2.25} sx={{ maxWidth: 700 }}>
            <Typography
              sx={{
                color: colors.primary[100],
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {STRINGS.HOME.badge.text}
            </Typography>

            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.7rem', sm: '3.4rem', md: '4.5rem' },
                  lineHeight: 1,
                  maxWidth: 760,
                }}
              >
                {STRINGS.HOME.hero.titleTop}
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  mt: 0.25,
                  fontSize: { xs: '2.9rem', sm: '3.8rem', md: '4.9rem' },
                  lineHeight: 1,
                  color: colors.primary[200],
                }}
              >
                {STRINGS.HOME.hero.titleTrivia}
                {STRINGS.COMMON.symbols.exclamation} {ICONS.common.party}
              </Typography>
            </Box>

            <Typography
              variant="h5"
              sx={{
                maxWidth: 600,
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.55,
                fontSize: { xs: '1rem', md: '1.12rem' },
              }}
            >
              {STRINGS.HOME.hero.subtitleLine1} {STRINGS.HOME.hero.subtitleLine2} {ICONS.common.brain}{' '}
              {ICONS.brand.sparkles}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={onStartPlaying}
                startIcon={<span>{ICONS.common.play}</span>}
                sx={{
                  minWidth: 180,
                  py: 1.4,
                  bgcolor: colors.neutral.white,
                  color: colors.neutral[900],
                  '&:hover': { bgcolor: colors.neutral[100] },
                }}
              >
                {STRINGS.HOME.ctas.startPlaying}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={onCreateQuiz}
                startIcon={<span>{ICONS.brand.sparkles}</span>}
                sx={{
                  minWidth: 180,
                  py: 1.4,
                  borderColor: 'rgba(255,255,255,0.26)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.38)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                {STRINGS.HOME.ctas.createQuiz}
              </Button>
            </Stack>

            <Typography sx={{ color: 'rgba(255,255,255,0.68)', fontWeight: 600 }}>
              Story, Classic, Millionaire, and Blitz all in one place.
            </Typography>
          </Stack>

          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.12)',
              bgcolor: 'rgba(15,23,42,0.28)',
              boxShadow: '0 24px 60px rgba(2,6,23,0.22)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <Stack spacing={1}>
              <Typography sx={{ color: colors.primary[100], fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Live stats
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                TriviaVerse at a glance
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.74)', lineHeight: 1.6 }}>
                A quick look at the player base, question bank, and quiz activity across the app.
              </Typography>
            </Stack>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              {statItems.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

