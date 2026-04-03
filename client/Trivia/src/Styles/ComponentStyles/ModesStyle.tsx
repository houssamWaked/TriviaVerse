import colors from '../../constants/colors';
const ModesStyle: any = {
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
    fontSize: 'clamp(34px, 4.8vw, 58px)',
    fontWeight: 900,
    color: colors.neutral.white,
    textShadow: '0 10px 30px rgba(0,0,0,0.18)',
    letterSpacing: -0.8,
  },
  titleIcon: {
    marginLeft: 10,
    fontSize: 'clamp(28px, 3.8vw, 44px)',
    verticalAlign: 'middle',
  },

  subtitle: {
    margin: '12px 0 0',
    fontSize: 'clamp(16px, 2.2vw, 20px)',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.92)',
    textShadow: '0 8px 18px rgba(0,0,0,0.12)',
  },

  grid: {
    marginTop: 46,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
    gap: 26,
    justifyItems: 'center',
  },
};
export default ModesStyle;

