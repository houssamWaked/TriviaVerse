import colors from '../../constants/colors';

const BlitzStyle = {
  /* Hero */
  heroIcon: {
    width: 82,
    height: 82,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.26)',
    margin: '0 auto 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
    color: colors.neutral.white,
    fontSize: 32,
    fontWeight: 950,
    backdropFilter: 'blur(10px)',
  },

  /* Big white stage like your screenshot */
  stageCard: {
    background: colors.neutral.white,
    borderRadius: 28,
    boxShadow: '0 26px 70px rgba(0,0,0,0.22)',
  },

  errorInline: {
    marginBottom: 12,
    padding: '10px 12px',
    borderRadius: 16,
    border: `1px solid ${colors.secondary[100]}`,
    background: colors.secondary[50],
    color: colors.secondary[700],
    fontSize: 13,
    fontWeight: 900,
  },

  /* Setup panel (sub-card inside stage) */
  setupPanel: {
    borderRadius: 22,
    background:
      'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)',
    border: `1px solid ${colors.neutral[200]}`,
    boxShadow: '0 18px 44px rgba(0,0,0,0.10)',
  },

  setupGrid: {
  },

  howToCol: {
    textAlign: 'left',
    paddingRight: 6,
  },

  diffCol: {
    textAlign: 'left',
  },

  panelTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.2,
  },

  howToList: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  howToRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },

  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
    background: colors.accent.yellow,
    boxShadow: '0 8px 16px rgba(245,158,11,0.22)',
    flex: '0 0 auto',
  },

  howToText: {
    fontSize: 13,
    fontWeight: 850,
    color: colors.neutral[700],
    lineHeight: 1.5,
  },

  diffPillsRow: {
    marginTop: 12,
  },

  diffPill: (selected) => ({
    height: 44,
    borderRadius: 999,
    border: selected ? 'none' : `1px solid ${colors.neutral[200]}`,
    background: selected ? 'rgba(17,24,39,0.28)' : colors.neutral.white,
    color: selected ? colors.neutral.white : colors.neutral[900],
    fontSize: 13,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: selected
      ? '0 18px 44px rgba(0,0,0,0.18)'
      : '0 10px 22px rgba(0,0,0,0.08)',
  }),

  diffHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 850,
    color: colors.neutral[600],
  },

  /* Feature cards row */
  featureGrid: {
    marginTop: 18,
  },

  featureCard: {
    borderRadius: 20,
    padding: 16,
    background: 'rgba(248,250,252,1)',
    border: `1px solid ${colors.neutral[200]}`,
    boxShadow: '0 18px 44px rgba(0,0,0,0.10)',
    textAlign: 'center',
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: 'rgba(139,44,255,0.10)',
    border: '1px solid rgba(139,44,255,0.20)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    fontSize: 18,
    fontWeight: 950,
    color: colors.primary[700],
  },

  featureValue: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.4,
  },

  featureLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 850,
    color: colors.neutral[600],
  },

  /* CTA row */
  ctaRow: {
    marginTop: 18,
  },

  startBtn: {
    height: 52,
    padding: '0 18px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    background: colors.accent.red,
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 950,
    boxShadow: '0 22px 60px rgba(239,68,68,0.28)',
  },

  secondaryBtn: {
    height: 52,
    padding: '0 18px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    background: colors.neutral.white,
    color: colors.neutral[900],
    fontSize: 14,
    fontWeight: 950,
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
  },

  ghostBtn: {
    height: 52,
    padding: '0 18px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    background: 'rgba(17,24,39,0.08)',
    color: colors.neutral[900],
    fontSize: 14,
    fontWeight: 950,
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
  },

  duelCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    background: 'rgba(248,250,252,1)',
    border: `1px solid ${colors.neutral[200]}`,
    boxShadow: '0 18px 44px rgba(0,0,0,0.10)',
    textAlign: 'left',
  },

  duelTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },

  duelTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.2,
  },

  duelSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 850,
    color: colors.neutral[600],
    lineHeight: 1.4,
  },

  duelRow: {
    marginTop: 12,
  },

  duelSelect: {
    height: 44,
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 900,
    background: colors.neutral.white,
    color: colors.neutral[900],
    outline: 'none',
  },

  duelSendBtn: {
    height: 44,
    padding: '0 14px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    background: colors.primary[700],
    color: colors.neutral.white,
    fontSize: 13,
    fontWeight: 950,
    boxShadow: '0 18px 44px rgba(139,44,255,0.22)',
  },
};

export default BlitzStyle;
