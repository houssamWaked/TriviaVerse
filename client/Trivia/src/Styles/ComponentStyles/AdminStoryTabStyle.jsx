import colors from '../../constants/colors';
import AdminStyle from './AdminStyle';

const AdminStoryTabStyle = {
  toggleLabel: { ...AdminStyle.smallHelp, cursor: 'pointer' },
  checkboxMr8: { marginRight: 8 },

  rowMt10: { ...AdminStyle.row, marginTop: 10 },
  rowMt12: { ...AdminStyle.row, marginTop: 12 },
  rowMt14: { ...AdminStyle.row, marginTop: 14 },

  fieldFlex1NoMt: { ...AdminStyle.field, flex: 1, marginTop: 0 },

  seedCountInput: { ...AdminStyle.input, width: 120 },

  selectFlex1: { ...AdminStyle.select, flex: 1 },
  inputFlex1: { ...AdminStyle.input, flex: 1 },

  emptyText: { fontWeight: 850, color: colors.neutral[700] },
};

export default AdminStoryTabStyle;

