import colors from '../../constants/colors';

const StoryStyle: any = {
  page: {
    width: '100%',
    minHeight: '100vh',
    background: colors.gradients.main,
    display: 'flex',
    justifyContent: 'center',
    padding: '46px 18px 70px',
  },

  container: {
    width: '100%',
    maxWidth: 1120,
  },

  /* HERO (left image vibe) */
  hero: {
    textAlign: 'center',
    marginBottom: 18,
    paddingTop: 8,
  },
  heroIcons: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 10,
  },
  heroIcon: {
    fontSize: 34,
    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.18))',
  },
  heroTitle: {
    margin: 0,
    fontSize: 'clamp(34px, 5.6vw, 56px)',
    fontWeight: 950,
    letterSpacing: -0.9,
    color: colors.neutral.white,
    textShadow: '0 14px 40px rgba(0,0,0,0.18)',
  },
  heroSubtitle: {
    margin: '10px auto 0',
    maxWidth: 720,
    fontSize: 16,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 1.6,
    textShadow: '0 10px 26px rgba(0,0,0,0.14)',
  },
  heroEmoji: { marginLeft: 4 },

  /* PROGRESS CARD (left image) */
  progressCard: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
    border: '1px solid rgba(255,255,255,0.65)',
    backdropFilter: 'blur(10px)',
  },
  progressTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  progressLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  progressTarget: { fontSize: 16 },
  progressLabel: {
    fontSize: 15,
    fontWeight: 950,
    color: colors.neutral[900],
  },
  progressRight: {
    fontSize: 14,
    fontWeight: 950,
    color: colors.primary[700],
  },
  progressBarOuter: {
    height: 14,
    borderRadius: 999,
    background: 'rgba(15, 23, 42, 0.10)',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 999,
    background:
      'linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(236,72,153,1) 100%)',
    boxShadow: '0 10px 18px rgba(0,0,0,0.12)',
    transition: 'width 260ms ease',
  },

  /* ERROR */
  error: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 16,
    border: `1px solid ${colors.secondary[100]}`,
    background: colors.secondary[50],
    color: colors.secondary[700],
    fontSize: 13,
    fontWeight: 850,
  },

  /* GRID (like left image cards) */
  levelGrid: {
    marginTop: 16,
  },

  /* Responsive: 2 cols then 1 col */
  // NOTE: inline styles can’t do media queries; this layout still works because container is wide.
  // If you want perfect responsiveness, move grid CSS to a .css file with media queries.

  levelCard: {
    width: '100%',
    textAlign: 'left',
    padding: 18,
    borderRadius: 22,
    border: '1px solid rgba(15,23,42,0.08)',
    background: 'rgba(255,255,255,0.97)',
    cursor: 'pointer',
    boxShadow: '0 18px 50px rgba(0,0,0,0.12)',
    transition: 'transform 160ms ease, box-shadow 160ms ease',
  },
  levelCardLocked: {
    width: '100%',
    textAlign: 'left',
    padding: 18,
    borderRadius: 22,
    border: '1px solid rgba(15,23,42,0.08)',
    background: 'rgba(255,255,255,0.88)',
    cursor: 'not-allowed',
    boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
    opacity: 0.62,
  },

  levelTopRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  /* number badge (square-ish, like left) */
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 950,
    fontSize: 18,
    color: colors.neutral.white,
    boxShadow: '0 14px 26px rgba(0,0,0,0.14)',
  },
  levelBadgeCompleted: {
    background:
      'linear-gradient(180deg, rgba(34,197,94,1) 0%, rgba(16,185,129,1) 100%)',
  },
  levelBadgeUnlocked: {
    background:
      'linear-gradient(180deg, rgba(99,102,241,1) 0%, rgba(168,85,247,1) 100%)',
  },
  levelBadgeLocked: {
    background:
      'linear-gradient(180deg, rgba(148,163,184,1) 0%, rgba(100,116,139,1) 100%)',
  },

  levelTopRight: {
    minWidth: 22,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  check: {
    fontSize: 22,
    fontWeight: 950,
    color: colors.neutral[900],
    opacity: 0.8,
  },

  levelTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.3,
    lineHeight: 1.15,
    marginBottom: 12,
  },

  /* difficulty pill (colored) */
  diffPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    border: '1px solid rgba(15,23,42,0.10)',
    marginBottom: 14,
  },
  diffEasy: {
    background: 'rgba(34,197,94,0.14)',
    color: 'rgba(22,101,52,1)',
    border: '1px solid rgba(34,197,94,0.22)',
  },
  diffMedium: {
    background: 'rgba(234,179,8,0.16)',
    color: 'rgba(133,77,14,1)',
    border: '1px solid rgba(234,179,8,0.26)',
  },
  diffHard: {
    background: 'rgba(239,68,68,0.14)',
    color: 'rgba(127,29,29,1)',
    border: '1px solid rgba(239,68,68,0.24)',
  },
  diffUnknown: {
    background: 'rgba(148,163,184,0.18)',
    color: 'rgba(15,23,42,0.75)',
    border: '1px solid rgba(148,163,184,0.28)',
  },

  /* stars (bottom left like left image) */
  starsRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  starOn: {
    fontSize: 20,
    lineHeight: 1,
    color: 'rgba(250, 204, 21, 1)', // gold-ish
    textShadow: '0 8px 16px rgba(0,0,0,0.14)',
  },
  starOff: {
    fontSize: 20,
    lineHeight: 1,
    color: 'rgba(15,23,42,0.25)',
  },

  empty: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 10px 26px rgba(0,0,0,0.14)',
  },

  bottomActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  smallBtn: {
    height: 44,
    padding: '0 16px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.40)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 950,
    background: 'rgba(255,255,255,0.92)',
    color: colors.neutral[900],
    boxShadow: '0 14px 30px rgba(0,0,0,0.14)',
  },
  smallBtnPrimary: {
    background:
      'linear-gradient(90deg, rgba(236,72,153,1) 0%, rgba(99,102,241,1) 100%)',
    color: colors.neutral.white,
    border: '1px solid rgba(255,255,255,0.25)',
  },
};

export default StoryStyle;

