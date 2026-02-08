import React from 'react';
import colors from '@/constants/colors';
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
    <div style={styles.wrap} role="region" aria-label="Cookie preferences">
      <div className="tv-card" style={styles.card}>
        <div style={styles.left}>
          <div style={styles.title}>Cookies & storage</div>
          <div style={styles.text}>
            We use essential storage to keep the app working (including caching some data so we don’t hit the API on every refresh). If you accept performance storage,
            we’ll also keep additional cache data to make the app feel faster.
          </div>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            className="tv-btn-reset"
            style={styles.secondary}
            onClick={() => {
              setConsent({ performance: false });
              setOpen(false);
            }}
          >
            Essential only
          </button>
          <button
            type="button"
            className="tv-btn-reset"
            style={styles.primary}
            onClick={() => {
              setConsent({ performance: true });
              setOpen(false);
            }}
          >
            Accept performance
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 18,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 14px',
  },
  card: {
    width: 'min(980px, 100%)',
    padding: '18px 18px',
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(17,24,39,0.10)',
  },
  left: { display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 560px' },
  title: { fontWeight: 950, color: colors.neutral[900], letterSpacing: -0.2 },
  text: { fontSize: 14, fontWeight: 700, color: colors.neutral[700], lineHeight: 1.35 },
  actions: { display: 'flex', gap: 10, flex: '0 0 auto', flexWrap: 'wrap' },
  primary: {
    padding: '10px 14px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 900,
    color: colors.neutral.white,
    background: colors.gradients.main,
    boxShadow: '0 14px 34px rgba(139,44,255,0.20)',
  },
  secondary: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(17,24,39,0.12)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 900,
    color: colors.neutral[900],
    background: 'rgba(255,255,255,0.75)',
  },
};
