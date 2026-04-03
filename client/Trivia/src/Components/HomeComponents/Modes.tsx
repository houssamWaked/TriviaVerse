import React from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import ModeCard from '@/Cards/HomeCards/ModeCard';

type ModesProps = {
  onStory?: () => void;
  onMillionaire?: () => void;
  onClassic?: () => void;
  onBlitz?: () => void;
};

export default function Modes({ onStory, onMillionaire, onClassic, onBlitz }: ModesProps) {
  const items: React.ComponentProps<typeof ModeCard>[] = [
    {
      icon: ICONS.common.book,
      title: STRINGS.HOME.modes.storyTitle,
      desc: `${STRINGS.HOME.modes.storyDesc} ${ICONS.common.gamepad}`,
      gradient: colors.gradients.story,
      onClick: onStory || (() => {}),
    },
    {
      icon: ICONS.common.rich,
      title: STRINGS.HOME.modes.millionaireTitle,
      desc: `${STRINGS.HOME.modes.millionaireDesc} ${ICONS.common.money}`,
      gradient: colors.gradients.millionaire,
      onClick: onMillionaire || (() => {}),
    },
    {
      icon: ICONS.common.mask,
      title: STRINGS.HOME.modes.classicTitle,
      desc: `${STRINGS.HOME.modes.classicDesc} ${ICONS.common.dart}`,
      gradient: colors.gradients.classic,
      onClick: onClassic || (() => {}),
    },
    {
      icon: ICONS.common.bolt,
      title: STRINGS.HOME.modes.blitzTitle,
      desc: `${STRINGS.HOME.modes.blitzDesc} ${ICONS.common.bolt}`,
      gradient: colors.gradients.blitz,
      onClick: onBlitz || (() => {}),
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 5, md: 6 },
        position: 'relative',
        bgcolor: 'transparent',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1} sx={{ mb: 3, maxWidth: 760 }}>
          <Typography sx={{ color: colors.primary[200], fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Game modes
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '2.3rem', md: '3.1rem' } }}>
            {STRINGS.HOME.modes.title} {ICONS.common.gamepad}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: { xs: '0.98rem', md: '1.02rem' }, lineHeight: 1.6 }}>
            {STRINGS.HOME.modes.subtitle}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2.25,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {items.map((item) => (
            <Box key={item.title}>
              <ModeCard {...item} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

