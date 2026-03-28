import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import FeatureCard from '@/Cards/HomeCards/FeatureCard';

export default function FeaturesStrip() {
  const items = [
    {
      icon: ICONS.common.bolt,
      title: STRINGS.HOME.features.lightningTitle,
      desc: STRINGS.HOME.features.lightningDesc,
      accent: colors.accent.yellow,
    },
    {
      icon: ICONS.common.trophy,
      title: STRINGS.HOME.features.rewardsTitle,
      desc: STRINGS.HOME.features.rewardsDesc,
      accent: colors.accent.orange,
    },
    {
      icon: ICONS.common.people,
      title: STRINGS.HOME.features.togetherTitle,
      desc: STRINGS.HOME.features.togetherDesc,
      accent: colors.neutral[800],
    },
  ];

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 6 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ mb: 1, color: colors.secondary[200], fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Why TriviaVerse
          </Typography>
          <Typography variant="h3" sx={{ mb: 1.5, fontSize: { xs: '2rem', md: '2.75rem' } }}>
            Simple to start, fun to keep playing
          </Typography>
          <Typography sx={{ maxWidth: 760, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
            Fast rounds, competitive energy, and easy quiz creation all live in the same place.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2.25,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {items.map((item) => (
            <Box key={item.title}>
              <FeatureCard {...item} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
