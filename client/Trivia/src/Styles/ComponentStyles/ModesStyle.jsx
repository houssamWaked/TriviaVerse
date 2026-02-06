import colors from '../../constants/colors';
const ModesStyle = {
  section: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '72px 18px',
  },

  container: {
    width: '100%',
    maxWidth: 1180,
    textAlign: 'center',
  },

  title: {
    margin: 0,
    fontSize: 58,
    fontWeight: 900,
    color: colors.neutral.white,
    textShadow: '0 10px 30px rgba(0,0,0,0.18)',
    letterSpacing: -0.8,
  },
  titleIcon: {
    marginLeft: 10,
    fontSize: 44,
    verticalAlign: 'middle',
  },

  subtitle: {
    margin: '12px 0 0',
    fontSize: 20,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 8px 18px rgba(0,0,0,0.12)',
  },

  grid: {
    marginTop: 46,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 26,
    justifyItems: 'center',
  },
};
export default ModesStyle;
