import colors from '../../constants/colors';

const MillionaireStyle: any = {
  crown: {
    width: 82,
    height: 82,
    borderRadius: 999,
    background: colors.accent.yellow,
    margin: '0 auto 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 22px 60px rgba(0,0,0,0.22)',
    color: colors.neutral.white,
    fontSize: 36,
    fontWeight: 950,
  },

  stageCard: {
    background: colors.neutral.white,
    borderRadius: 28,
    padding: 22,
    boxShadow: '0 26px 70px rgba(0,0,0,0.22)',
    maxWidth: 960,
    margin: '0 auto',
  },

  error: {
    marginBottom: 14,
    padding: '10px 12px',
    borderRadius: 16,
    border: `1px solid ${colors.secondary[100]}`,
    background: colors.secondary[50],
    color: colors.secondary[700],
    fontSize: 13,
    fontWeight: 900,
  },

  stageGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: 22,
    alignItems: 'start',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral[900],
    marginBottom: 10,
  },

  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  ruleRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 13,
    fontWeight: 850,
    color: colors.neutral[700],
    lineHeight: 1.55,
  },

  ruleDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: colors.accent.yellow,
    marginTop: 4,
    boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
  },

  toggleBtn: {
    height: 42,
    padding: '0 14px',
    borderRadius: 999,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
  },

  ladderBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral[50],
  },

  select: {
    width: '100%',
    height: 42,
    borderRadius: 14,
    border: `1px solid ${colors.neutral[300]}`,
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 900,
    outline: 'none',
  },

  ladderCurrent: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 850,
    color: colors.neutral[600],
  },

  actions: {
    marginTop: 20,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },

  startBtn: {
    height: 54,
    minWidth: 200,
    borderRadius: 16,
    border: 'none',
    background: colors.accent.yellow,
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: '0 22px 60px rgba(245,158,11,0.38)',
  },

  secondaryBtn: {
    height: 54,
    minWidth: 200,
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    color: colors.neutral[900],
    fontSize: 14,
    fontWeight: 950,
    cursor: 'pointer',
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
  },
};

export default MillionaireStyle;

