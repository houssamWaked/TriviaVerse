import colors from '../constants/colors';

const AppStyle = {
  shell: { minHeight: '100vh', background: colors.neutral[50], color: colors.neutral[900] },

  duelToastWrap: {
    position: 'fixed',
    right: 18,
    bottom: 18,
    zIndex: 80,
    width: 'min(420px, calc(100vw - 36px))',
  },
  duelToastCard: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 14,
    border: `1px solid ${colors.neutral[200]}`,
    boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(10px)',
  },
  duelToastTitle: {
    fontSize: 13,
    fontWeight: 950,
    color: colors.neutral[900],
  },
  duelToastText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 850,
    color: colors.neutral[700],
    lineHeight: 1.4,
  },
  duelToastActions: {
    marginTop: 10,
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  duelToastBtnPrimary: {
    height: 40,
    padding: '0 14px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 950,
    color: colors.neutral.white,
    background: colors.gradients.main,
    boxShadow: '0 12px 26px rgba(139,44,255,0.22)',
  },
  duelToastBtn: {
    height: 40,
    padding: '0 14px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 950,
    background: colors.neutral.white,
    color: colors.neutral[900],
    boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
  },
};

export default AppStyle;
