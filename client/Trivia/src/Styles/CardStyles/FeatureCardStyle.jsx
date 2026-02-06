import colors from '../../constants/colors';
const FeatureCardStyle = {
  card: {
    background: colors.neutral.white,
    borderRadius: 22,
    padding: '34px 28px',
    textAlign: 'center',
    boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
  },

  icon: {
    fontSize: 56,
    marginBottom: 18,
    filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.15))',
  },

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
