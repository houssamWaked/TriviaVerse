import React from 'react';
import { Alert, AlertTitle, Box, Button, Slide, Stack } from '@mui/material';
import { shouldShowConsentBanner, setConsent } from '@/utils/consent';

export default function CookieBanner() {
  const [open, setOpen] = React.useState(() => shouldShowConsentBanner());

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('tv:open-consent', onOpen);
    return () => window.removeEventListener('tv:open-consent', onOpen);
  }, []);

  if (!open) return null;

  return (
    <Slide in direction="up">
      <Box
        sx={{
          position: 'fixed',
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{
            maxWidth: 920,
            width: '100%',
            alignItems: 'center',
            borderRadius: 3,
            bgcolor: 'rgba(15,23,42,0.94)',
          }}
          action={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setConsent({ performance: false });
                  setOpen(false);
                }}
              >
                Essential only
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setConsent({ performance: true });
                  setOpen(false);
                }}
              >
                Accept performance
              </Button>
            </Stack>
          }
        >
          <AlertTitle>Cookies & storage</AlertTitle>
          We use essential storage to keep the app working, including cache data. If you accept
          performance storage, we keep additional cache data so the app feels faster.
        </Alert>
      </Box>
    </Slide>
  );
}
