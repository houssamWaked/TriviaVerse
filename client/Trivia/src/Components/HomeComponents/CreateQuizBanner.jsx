import React from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function CreateQuizBanner({ onCreate }) {
  return (
    <Box component="section" sx={{ py: { xs: 2.5, md: 3 } }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.25 },
            borderRadius: 5,
            background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 55%, #1d4ed8 100%)',
            color: 'common.white',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 56px rgba(2,6,23,0.3)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 680 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 24,
                  }}
                >
                  {ICONS.common.palette}
                </Box>
                <Box>
                  <Typography sx={{ color: colors.primary[100], fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Creator mode
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.25, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                    {STRINGS.HOME.banner.title}
                  </Typography>
                </Box>
              </Stack>

              <Typography sx={{ color: 'rgba(255,255,255,0.84)', fontSize: { xs: '0.98rem', md: '1rem' }, lineHeight: 1.6 }}>
                {STRINGS.HOME.banner.subtitle} {ICONS.brand.sparkles}
              </Typography>
            </Stack>

            <Stack spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={onCreate}
                endIcon={<span>{ICONS.common.rocket}</span>}
                sx={{
                  px: 3,
                  py: 1.4,
                  bgcolor: colors.accent.yellow,
                  color: colors.neutral[900],
                  '&:hover': { bgcolor: '#fde047' },
                }}
              >
                {STRINGS.HOME.banner.cta}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
