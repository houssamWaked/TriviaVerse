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
    <div className="tv-consent" role="region" aria-label="Cookie preferences">
      <div className="tv-card tv-consent__card">
        <div className="tv-consent__left">
          <div className="tv-consent__title">Cookies & storage</div>
          <div className="tv-consent__text">
            We use essential storage to keep the app working (including caching some data so we don’t hit the API on every refresh). If you accept performance storage,
            we’ll also keep additional cache data to make the app feel faster.
          </div>
        </div>

        <div className="tv-consent__actions">
          <button
            type="button"
            className="tv-btn-reset tv-consent__btn tv-consent__btn--secondary"
            style={styles.secondaryBtn}
            onClick={() => {
              setConsent({ performance: false });
              setOpen(false);
            }}
          >
            Essential only
          </button>
          <button
            type="button"
            className="tv-btn-reset tv-consent__btn tv-consent__btn--primary"
            style={styles.primaryBtn}
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
  primaryBtn: {
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
  secondaryBtn: {
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
