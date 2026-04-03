import colors from '../../constants/colors';
const FeatureCardStyle: any = {
  card: {
    background: colors.neutral.white,
    borderRadius: 'var(--tv-radius-xl)',
    padding: '32px 26px',
    textAlign: 'center',
    boxShadow: 'var(--tv-shadow-md)',
    border: '1px solid rgba(17,24,39,0.08)',
  },

  icon: {
    fontSize: 56,
    marginBottom: 18,
    filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.15))',
  },
  iconColor: (color: string) => ({
    fontSize: 56,
    marginBottom: 18,
    filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.15))',
    color,
  }),

  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: colors.neutral[800],
    letterSpacing: -0.4,
  },

  desc: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: 700,
    color: colors.neutral[600],
  },
};
export default FeatureCardStyle;

