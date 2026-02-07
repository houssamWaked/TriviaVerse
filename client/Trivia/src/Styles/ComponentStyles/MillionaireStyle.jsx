import colors from '../../constants/colors';
import ModeStartStyle from './ModeStartStyle';

const MillionaireStyle = {
  crown: {
    width: 74,
    height: 74,
    borderRadius: 999,
    background: colors.accent.yellow,
    margin: '0 auto 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 18px 44px rgba(216, 46, 46, 0.18)',
    color: colors.neutral.white,
    fontSize: 34,
    fontWeight: 950,
  },

  cardTopRow: { ...ModeStartStyle.row, justifyContent: 'space-between' },

  rulesCard: {
    ...ModeStartStyle.section,
    maxWidth: 720,
    margin: '18px auto 0',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.14) 100%)',
    border: '1px solid rgba(255,255,255,0.32)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.14)',
    backdropFilter: 'blur(10px)',
  },
  rulesTitle: {
    ...ModeStartStyle.sectionTitle,
    textAlign: 'center',
    color: colors.neutral.white,
  },
  rulesList: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ruleRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 14,
    fontWeight: 900,
    color: 'rgba(255,255,255,0.94)',
    lineHeight: 1.55,
    textShadow: '0 10px 26px rgba(0,0,0,0.14)',
  },
  ruleTick: { color: colors.accent.green, fontWeight: 950 },

  ladderToggleWrap: { marginTop: 16 },
  ladderToggleBtn: {
    ...ModeStartStyle.btn,
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: colors.neutral.white,
  },
  ladderLabel: { ...ModeStartStyle.label, color: 'rgba(255,255,255,0.92)' },
  ladderSelect: {
    ...ModeStartStyle.select,
    background: 'rgba(255,255,255,0.92)',
    color: colors.neutral[900],
    border: '1px solid rgba(255,255,255,0.32)',
  },
  ladderCurrent: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.82)',
  },

  actions: {
    marginTop: 18,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  startBtn: {
    ...ModeStartStyle.btn,
    height: 54,
    minWidth: 180,
    border: 'none',
    background: colors.accent.yellow,
    color: colors.neutral.white,
    boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
  },
  secondaryBtn: {
    ...ModeStartStyle.btn,
    height: 54,
    minWidth: 180,
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: colors.neutral.white,
  },
};

export default MillionaireStyle;

