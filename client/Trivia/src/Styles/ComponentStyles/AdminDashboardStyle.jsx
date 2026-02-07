import colors from '../../constants/colors';
import AdminStyle from './AdminStyle';

const AdminDashboardStyle = {
  progressTrack: {
    height: 10,
    borderRadius: 999,
    background: colors.neutral[100],
    border: `1px solid ${colors.neutral[200]}`,
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    borderRadius: 999,
    background: colors.gradients.main,
  }),

  cardTopRowBetween: { ...AdminStyle.row, justifyContent: 'space-between' },
  gridMt14: { ...AdminStyle.grid, marginTop: 14 },
  rowMb12: { ...AdminStyle.row, marginBottom: 12 },
  rowMt10: { ...AdminStyle.row, marginTop: 10 },
  rowMt12: { ...AdminStyle.row, marginTop: 12 },
  rowMt14: { ...AdminStyle.row, marginTop: 14 },

  detailsMt12: { marginTop: 12 },
  detailsSummary: { cursor: 'pointer', fontWeight: 950, color: '#333' },
  detailsRowMt10: { marginTop: 10, ...AdminStyle.row },

  flowCard: (active) => ({
    ...AdminStyle.section,
    cursor: 'pointer',
    textAlign: 'left',
    border: active ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[200]}`,
  }),
  flowCardHeader: { display: 'flex', alignItems: 'center', gap: 10 },
  flowCardIcon: { fontSize: 22 },
  flowCardTitle: { fontWeight: 950, color: colors.neutral[900] },
  flowCardDesc: { marginTop: 2, fontWeight: 850, color: colors.neutral[650] },

  modeHeader: { display: 'flex', justifyContent: 'space-between', gap: 12 },

  inputW110: { ...AdminStyle.input, width: 110 },
  inputW120: { ...AdminStyle.input, width: 120 },
  inputW160: { ...AdminStyle.input, width: 160 },
  inputFlex1: { ...AdminStyle.input, flex: 1 },
  selectFlex1: { ...AdminStyle.select, flex: 1 },

  toggleLabel: { ...AdminStyle.smallHelp, cursor: 'pointer' },
  checkboxMr8: { marginRight: 8 },
  fieldFlex1NoMt: { ...AdminStyle.field, flex: 1, marginTop: 0 },

  emptyText: { fontWeight: 850, color: colors.neutral[700] },

  listMt12: { ...AdminStyle.list, marginTop: 12 },
  listItemMetaBetween: { ...AdminStyle.listItemMeta, justifyContent: 'space-between' },
  listItemMetaLeft: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },

  levelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  levelLeft: { flex: 1 },
  mt8: { marginTop: 8 },
  listItemMetaMt8: { ...AdminStyle.listItemMeta, marginTop: 8 },
  actionCol: { display: 'flex', flexDirection: 'column', gap: 10 },

  pickerLabel: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  checkboxMt3: { marginTop: 3 },

  dangerBtn: {
    ...AdminStyle.btn,
    background: colors.accent.red,
    border: 'none',
    color: colors.neutral.white,
  },
};

export default AdminDashboardStyle;

