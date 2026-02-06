import colors from '../../constants/colors';
const ModeCardStyle = {
  card: {
    width: 270,
    height: 330,
    borderRadius: 22,
    padding: '34px 26px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    boxShadow: '0 18px 40px rgba(0,0,0,0.20)',
  },

  cardIcon: {
    fontSize: 64,
    marginBottom: 18,
    filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.18))',
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: 900,
    color: colors.neutral.white,
    marginBottom: 10,
    textShadow: '0 8px 18px rgba(0,0,0,0.16)',
  },

  cardDesc: {
    fontSize: 14,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 1.35,
    textShadow: '0 6px 14px rgba(0,0,0,0.14)',
    marginBottom: 22,
  },

  cardBtn: {
    marginTop: 'auto',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.22)',
    color: colors.neutral.white,
    fontSize: 15,
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
    backdropFilter: 'blur(8px)',
  },

  playIcon: {
    fontSize: 16,
    transform: 'translateY(1px)',
  },
};
export default ModeCardStyle;
