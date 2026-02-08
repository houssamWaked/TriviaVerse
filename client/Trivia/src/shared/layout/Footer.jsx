import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <p style={styles.text}>
          {STRINGS.FOOTER.madeWith} <span style={styles.heart}>{ICONS.common.heart}</span>{' '}
          {STRINGS.FOOTER.by} <span style={styles.brand}>{STRINGS.COMMON.appName}</span>{' '}
          {STRINGS.COMMON.separators.middot} {STRINGS.COMMON.separators.copyright}{' '}
          {STRINGS.FOOTER.year}
        </p>

        <p style={styles.tagline}>
          {STRINGS.FOOTER.tagline} {ICONS.common.party}
        </p>

        <button
          type="button"
          className="tv-btn-reset"
          style={styles.cookieBtn}
          onClick={() => window.dispatchEvent(new Event('tv:open-consent'))}
        >
          Cookie settings
        </button>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    width: '100%',
    padding: '28px 16px',
    background: `linear-gradient(180deg, ${colors.secondary[50]} 0%, ${colors.neutral.white} 100%)`,
    borderTop: `1px solid ${colors.neutral[200]}`,
  },

  container: {
    maxWidth: 1200,
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  text: {
    fontSize: 15,
    fontWeight: 500,
    color: colors.neutral[700],
  },

  heart: {
    color: colors.primary[500],
  },

  brand: {
    fontWeight: 700,
    background: colors.gradients.main,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  tagline: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary[500],
  },

  cookieBtn: {
    margin: '6px auto 0',
    padding: '8px 12px',
    borderRadius: 999,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    color: colors.neutral[700],
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    width: 'fit-content',
  },
};
