import colors from '../../constants/colors';
import AdminStyle from './AdminStyle';

const AdminGlobalQuestionsTabStyle = {
  rowMt10: { ...AdminStyle.row, marginTop: 10 },
  rowMt12: { ...AdminStyle.row, marginTop: 12 },
  listMt12: { ...AdminStyle.list, marginTop: 12 },
  selectFlex1: { ...AdminStyle.select, flex: 1 },
  inputFlex1: { ...AdminStyle.input, flex: 1 },
  resultLabel: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  checkbox: { marginTop: 3 },
  emptyText: { fontWeight: 850, color: colors.neutral[700] },
};

export default AdminGlobalQuestionsTabStyle;

