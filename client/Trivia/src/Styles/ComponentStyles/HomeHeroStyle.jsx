import colors from '../../constants/colors';

const HomeHeroStyle = {
  section: {
    width: '100%',
    minHeight: 'calc(100vh - 72px)', // assumes navbar ~72px
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(44px, 6vw, 64px) 18px 54px',
  },

  container: {
    width: '100%',
    maxWidth: 1180,
    textAlign: 'center',
  },

  /* Badge */
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 18px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.95)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
    marginBottom: 26,
  },
  badgeIcon: { fontSize: 16 },
  badgeText: {
    fontSize: 14,
    fontWeight: 800,
    color: colors.primary[600],
    letterSpacing: 0.2,
  },
  badgeDot: { fontSize: 16 },

  /* Title */
  title: {
    margin: 0,
    lineHeight: 1.02,
    letterSpacing: -1,
    textShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
  titleTop: {
    display: 'block',
    fontSize: 'clamp(44px, 7vw, 84px)',
    fontWeight: 900,
    color: colors.neutral.white,
  },
  titleBottom: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 'clamp(48px, 7.5vw, 92px)',
    fontWeight: 900,
  },
  triviaWord: {
    background: `linear-gradient(90deg, ${colors.accent.yellow} 0%, rgba(255,255,255,0.98) 60%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  exclamation: {
    color: colors.neutral.white,
  },
  party: {
    fontSize: 'clamp(38px, 5.5vw, 64px)',
    transform: 'translateY(8px)',
  },

  /* Subtitle */
  subtitle: {
    margin: '18px auto 0',
    maxWidth: 760,
    fontSize: 'clamp(18px, 2.6vw, 26px)',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.95)',
    textShadow: '0 8px 18px rgba(0,0,0,0.10)',
  },
  subtitleEmoji: { whiteSpace: 'nowrap' },

  /* CTAs */
  ctaRow: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 28px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    background: colors.neutral.white,
    color: colors.primary[600],
    fontSize: 18,
    fontWeight: 900,
    boxShadow: '0 14px 30px rgba(0,0,0,0.16)',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 30px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    background: colors.accent.yellow,
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: 900,
    boxShadow: '0 14px 30px rgba(0,0,0,0.16)',
  },
  btnIcon: {
    display: 'inline-flex',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
  },

  /* Stats cards */
  cardsGrid: {
    marginTop: 56,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 18,
  },
};
export default HomeHeroStyle;
