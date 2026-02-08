import colors from '../../constants/colors';
const CreateQuizBannerStyle = {
  section: {
    width: '100%',
    padding: '70px 18px',
    display: 'flex',
    justifyContent: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 1180,
    background: colors.neutral.white,
    borderRadius: 'var(--tv-radius-xl)',
    padding: 'clamp(22px, 4vw, 36px) clamp(18px, 4vw, 44px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
    position: 'relative',
    boxShadow: 'var(--tv-shadow-lg)',
  },

  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flex: '1 1 420px',
  },

  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: colors.primary[50],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 34,
  },

  title: {
    margin: 0,
    fontSize: 'clamp(22px, 3vw, 34px)',
    fontWeight: 900,
    color: colors.primary[600],
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 'clamp(14px, 1.8vw, 16px)',
    fontWeight: 700,
    color: colors.neutral[600],
  },

  button: {
    padding: '16px 30px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    background: colors.gradients.main,
    color: colors.neutral.white,
    fontSize: 17,
    fontWeight: 900,
    boxShadow: '0 14px 30px rgba(139,44,255,0.35)',
    whiteSpace: 'nowrap',
  },

  star: {
    position: 'absolute',
    fontSize: 22,
    color: colors.accent.yellow,
    userSelect: 'none',
  },
  starTopRight: {
    position: 'absolute',
    fontSize: 22,
    color: colors.accent.yellow,
    userSelect: 'none',
    top: 18,
    right: 22,
  },
  starBottomLeft: {
    position: 'absolute',
    fontSize: 22,
    color: colors.accent.yellow,
    userSelect: 'none',
    bottom: 20,
    left: 26,
  },
};
export default CreateQuizBannerStyle;
