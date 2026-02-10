import colors from '../../constants/colors';

const glass = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.16)',
  boxShadow: '0 22px 60px rgba(0,0,0,0.14)',
  backdropFilter: 'blur(12px)',
  borderRadius: 22,
};

const ClassicStyle = {
  page: {
    width: '100%',
    minHeight: 'calc(100vh - 72px)',
    background: colors.gradients.main,
    padding: '34px 18px 64px',
  },

  container: {
    maxWidth: 1180,
    margin: '0 auto',
  },

  /* HERO */
  hero: {
    textAlign: 'center',
    paddingTop: 10,
    marginBottom: 16,
  },

  modePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: 'rgba(255,255,255,0.94)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.16)',
  },
  modePillIcon: { fontSize: 14 },
  modePillText: { fontSize: 13, fontWeight: 950, letterSpacing: 0.2 },

  title: {
    margin: '18px 0 0',
    fontSize: 'clamp(36px, 6vw, 62px)',
    fontWeight: 950,
    letterSpacing: -1.0,
    color: colors.neutral.white,
    textShadow: '0 18px 50px rgba(0,0,0,0.20)',
  },
  subtitle: {
    margin: '10px auto 0',
    maxWidth: 780,
    fontSize: 14,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 1.7,
    textShadow: '0 10px 26px rgba(0,0,0,0.14)',
  },

  heroActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'center',
  },
  heroBtnGhost: {
    height: 46,
    padding: '0 16px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.20)',
    background: 'rgba(0,0,0,0.18)',
    color: colors.neutral.white,
    cursor: 'pointer',
    fontWeight: 950,
    boxShadow: '0 18px 44px rgba(0,0,0,0.16)',
  },

  /* ERROR */
  errorCard: {
    ...glass,
    margin: '16px auto 0',
    padding: 12,
    maxWidth: 860,
    color: colors.neutral.white,
  },
  errorText: { fontWeight: 900 },

  /* CATEGORIES GRID (matches right image) */
  categoriesGrid: {
    marginTop: 24,
  },

  /* Responsive */
  '@media(max-width: 1100px)': {},
  /* NOTE: inline styles can’t use media queries directly.
     If you need this responsive perfectly, move gridTemplateColumns into CSS.
     Still works decently because cards will wrap visually when container shrinks. */

  categoryBtn: (selected) => ({
    ...glass,
    padding: 18,
    textAlign: 'left',
    cursor: 'pointer',
    minHeight: 132,
    transition:
      'transform 140ms ease, box-shadow 140ms ease, border 140ms ease',
    border: selected ? '1px solid rgba(255,255,255,0.32)' : glass.border,
    boxShadow: selected
      ? '0 26px 70px rgba(0,0,0,0.20)'
      : '0 22px 60px rgba(0,0,0,0.14)',
  }),

  categoryIconTile: (accent) => ({
    width: 56,
    height: 56,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: accent,
    color: colors.neutral.white,
    boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
    marginBottom: 12,
  }),
  categoryIconChar: {
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },

  categoryName: {
    fontSize: 18,
    fontWeight: 950,
    color: colors.neutral.white,
    letterSpacing: -0.2,
    textShadow: '0 12px 32px rgba(0,0,0,0.16)',
  },
  categoryCount: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.82)',
  },

  /* SKELETON */
  skeletonCard: { ...glass, padding: 18, minHeight: 132, opacity: 0.72 },
  skeletonIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.20)',
  },
  skeletonLine1: {
    marginTop: 14,
    height: 16,
    width: '62%',
    background: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
  },
  skeletonLine2: {
    marginTop: 10,
    height: 12,
    width: '48%',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
  },

  /* STATS */
  statsGrid: {
    marginTop: 22,
  },
  statsCard: {
    ...glass,
    padding: 18,
    textAlign: 'center',
    minHeight: 92,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 950,
    color: colors.neutral.white,
    textShadow: '0 18px 44px rgba(0,0,0,0.18)',
  },
  statsLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.82)',
  },

  /* ADVANCED (reference-style bar) */
  advancedWrap: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'center',
  },
  advancedDetails: {
    ...glass,
    padding: 14,
    maxWidth: 980,
    width: '100%',
    color: colors.neutral.white,
  },
  advancedSummary: {
    cursor: 'pointer',
    fontWeight: 950,
    listStyle: 'none',
    outline: 'none',
  },
  advancedBody: { marginTop: 12 },

  advancedRow: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  advancedGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  advancedLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: 'rgba(255,255,255,0.88)',
  },

  pillsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  pillBtn: (selected) => ({
    height: 42,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.20)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 950,
    background: selected ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
    color: colors.neutral.white,
    boxShadow: selected ? '0 18px 44px rgba(0,0,0,0.16)' : 'none',
  }),

  questionsInput: {
    height: 42,
    width: 120,
    padding: '0 12px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.20)',
    outline: 'none',
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral.white,
    background: 'rgba(0,0,0,0.18)',
  },

  advancedCurrent: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 1.6,
  },

  /* STATUS */
  statusWrap: { marginTop: 14, textAlign: 'center' },
  statusText: {
    fontSize: 12,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.82)',
  },
};

export default ClassicStyle;
