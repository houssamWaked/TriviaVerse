import React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function ModeCard({ icon, title, desc, gradient, onClick }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 5,
        color: 'common.white',
        background: gradient,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 40px rgba(2,6,23,0.24)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 24px 52px rgba(2,6,23,0.32)',
        },
      }}
    >
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.25, height: '100%' }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              width: 54,
              height: 54,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 3,
              fontSize: 28,
              bgcolor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {icon}
          </Box>
        </Stack>

        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>
        <Typography sx={{ opacity: 0.92, mb: 1.25, lineHeight: 1.55 }}>{desc}</Typography>
        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="contained"
            color="inherit"
            onClick={onClick}
            sx={{
              color: colors.neutral[900],
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: colors.neutral.white },
            }}
            startIcon={<span>{ICONS.common.play}</span>}
          >
            {STRINGS.COMMON.buttons.playNow}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
