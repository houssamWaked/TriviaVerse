import colors from '../../constants/colors';
import ModeStartStyle from './ModeStartStyle';

const BlitzStyle = {
  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.26)',
    margin: '0 auto 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
    color: colors.neutral.white,
    fontSize: 30,
    fontWeight: 950,
    backdropFilter: 'blur(10px)',
  },

  center: { textAlign: 'center' },

  howToCard: {
    ...ModeStartStyle.section,
    maxWidth: 720,
    margin: '18px auto 0',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%)',
    border: '1px solid rgba(255,255,255,0.30)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.14)',
    backdropFilter: 'blur(12px)',
  },
  howToTitle: {
    ...ModeStartStyle.sectionTitle,
    textAlign: 'center',
    color: colors.neutral.white,
  },
  howToList: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: 'rgba(255,255,255,0.94)',
    fontWeight: 850,
    lineHeight: 1.55,
  },
  howToRow: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  howToBullet: { color: colors.accent.yellow, fontWeight: 950 },

  difficultyBlock: { marginTop: 16 },
  difficultyTitle: { fontWeight: 950, color: 'rgba(255,255,255,0.92)' },
  difficultyRow: { ...ModeStartStyle.row, justifyContent: 'center', marginTop: 10 },
  difficultyBtn: (selected) => ({
    ...ModeStartStyle.btn,
    background: selected ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: colors.neutral.white,
    minWidth: 160,
  }),
  difficultySelected: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 850,
    color: 'rgba(255,255,255,0.86)',
  },

  statsGrid: {
    marginTop: 18,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    maxWidth: 820,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  statCard: {
    borderRadius: 18,
    padding: 16,
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.20)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.16)',
    backdropFilter: 'blur(12px)',
    color: colors.neutral.white,
    textAlign: 'center',
  },
  statIcon: { fontSize: 20, fontWeight: 950, opacity: 0.95 },
  statValue: { marginTop: 10, fontSize: 28, fontWeight: 950 },
  statLabel: { marginTop: 6, fontSize: 12, fontWeight: 850, opacity: 0.9 },

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
    minWidth: 200,
    border: 'none',
    background: colors.accent.red,
    color: colors.neutral.white,
    boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
  },
  homeBtn: {
    ...ModeStartStyle.btn,
    height: 54,
    minWidth: 180,
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: colors.neutral.white,
  },
  loginBtn: {
    ...ModeStartStyle.btn,
    height: 54,
    minWidth: 180,
    background: 'rgba(0,0,0,0.18)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: colors.neutral.white,
  },
};

export default BlitzStyle;

