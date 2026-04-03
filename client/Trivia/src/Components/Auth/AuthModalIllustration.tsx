import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function AuthModalIllustration() {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 4,
        color: 'common.white',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      <Box>
        <Chip
          label={`${ICONS.brand.sparkles} ${STRINGS.AUTH.badge}`}
          sx={{ mb: 3, color: 'common.white', bgcolor: 'rgba(255,255,255,0.12)' }}
        />

        <Typography variant="h3" sx={{ mb: 2, fontWeight: 900 }}>
          {STRINGS.AUTH.welcomePrefix}{' '}
          <Box component="span" sx={{ color: '#bfdbfe' }}>
            {STRINGS.COMMON.appName}
          </Box>
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.82)', mb: 4 }}>
          {STRINGS.AUTH.leftSubtitle}
        </Typography>

        <Stack spacing={1.5}>
          <Typography>{ICONS.common.trophy} {STRINGS.AUTH.perks.leaderboard}</Typography>
          <Typography>{ICONS.common.gift} {STRINGS.AUTH.perks.badges}</Typography>
          <Typography>{ICONS.brand.sparkles} {STRINGS.AUTH.perks.createQuiz}</Typography>
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)' }}>
        {ICONS.common.dot} {STRINGS.AUTH.leftFooter}
      </Typography>
    </Box>
  );
}

