import colors from '../../constants/colors';

const StoryStyle = {
  page: {
    width: '100%',
    background: colors.gradients.main,
    display: 'flex',
    justifyContent: 'center',
    padding: '52px 18px 74px',
  },
  container: {
    width: '100%',
    maxWidth: 1180,
  },

  hero: {
    textAlign: 'center',
    marginBottom: 18,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.92)',
    boxShadow: '0 14px 30px rgba(0,0,0,0.14)',
    marginBottom: 18,
  },
  badgeIcon: { fontSize: 16 },
  badgeText: {
    fontSize: 13,
    fontWeight: 900,
    color: colors.primary[600],
  },
  badgeDot: { fontSize: 16 },

  title: {
    margin: 0,
    fontSize: 56,
    fontWeight: 950,
    letterSpacing: -0.9,
    color: colors.neutral.white,
    textShadow: '0 14px 40px rgba(0,0,0,0.18)',
  },
  titleAccent: {
    background: `linear-gradient(90deg, ${colors.accent.yellow} 0%, rgba(255,255,255,0.95) 60%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: '12px auto 0',
    maxWidth: 760,
    fontSize: 16,
    fontWeight: 750,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 1.6,
    textShadow: '0 10px 26px rgba(0,0,0,0.14)',
  },

  card: {
    marginTop: 16,
    background: colors.neutral.white,
    borderRadius: 22,
    padding: 18,
    boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
  },

  topRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  btn: {
    height: 46,
    padding: '0 16px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 950,
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
  },
  pills: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pill: {
    padding: '8px 12px',
    borderRadius: 999,
    background: colors.neutral[50],
    border: `1px solid ${colors.neutral[200]}`,
    fontSize: 12,
    fontWeight: 950,
    color: colors.neutral[800],
  },

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

  grid: {
    marginTop: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 14,
  },
  levelCard: {
    width: '100%',
    textAlign: 'left',
    padding: 16,
    borderRadius: 22,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    cursor: 'pointer',
    boxShadow: '0 18px 50px rgba(0,0,0,0.12)',
  },
  levelTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  levelNum: {
    fontSize: 12,
    fontWeight: 950,
    color: colors.primary[700],
  },
  levelTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.3,
    lineHeight: 1.15,
  },
  meta: {
    marginTop: 12,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: {
    padding: '7px 10px',
    borderRadius: 999,
    background: colors.neutral[50],
    border: `1px solid ${colors.neutral[200]}`,
    fontSize: 12,
    fontWeight: 900,
    color: colors.neutral[800],
    whiteSpace: 'nowrap',
  },
  locked: {
    opacity: 0.62,
    cursor: 'not-allowed',
  },
  empty: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 850,
    color: colors.neutral[700],
  },
};

export default StoryStyle;

