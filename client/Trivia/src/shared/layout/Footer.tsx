import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        py: 3.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(180deg, #e6fffa 0%, #ffffff 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Typography variant="body1" color="text.secondary">
            {STRINGS.FOOTER.madeWith} <Box component="span" sx={{ color: 'error.main' }}>{ICONS.common.heart}</Box>{' '}
            {STRINGS.FOOTER.by} <Box component="span" sx={{ fontWeight: 800 }}>{STRINGS.COMMON.appName}</Box>{' '}
            {STRINGS.COMMON.separators.middot} {STRINGS.COMMON.separators.copyright} {STRINGS.FOOTER.year}
          </Typography>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
            {STRINGS.FOOTER.tagline} {ICONS.common.party}
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => window.dispatchEvent(new Event('tv:open-consent'))}
          >
            Cookie settings
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

