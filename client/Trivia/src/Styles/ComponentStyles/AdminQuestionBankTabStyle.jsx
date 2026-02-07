import AdminStyle from './AdminStyle';

const AdminQuestionBankTabStyle = {
  rowMt10: { ...AdminStyle.row, marginTop: 10 },
  rowMt12: { ...AdminStyle.row, marginTop: 12 },
  rowMt14: { ...AdminStyle.row, marginTop: 14 },
  rowMt8: { ...AdminStyle.row, marginTop: 8 },

  labelMr6: { ...AdminStyle.label, marginRight: 6 },
  range: { flex: 1, minWidth: 180 },
  inputW90: { ...AdminStyle.input, width: 90 },

  optionsWrap: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  inputFlex1: { ...AdminStyle.input, flex: 1 },

  toggleLabel: { ...AdminStyle.smallHelp, cursor: 'pointer' },
  checkboxMr8: { marginRight: 8 },

  advancedTitle: { fontSize: 12, fontWeight: 950, color: '#222' },
  modePillLabel: { ...AdminStyle.pill, cursor: 'pointer' },
  textareaMin70: { ...AdminStyle.textarea, minHeight: 70 },
  fieldFlex1NoMt: { ...AdminStyle.field, flex: 1, marginTop: 0 },

  quickFlowList: { marginTop: 10, marginBottom: 0, paddingLeft: 18 },
};

export default AdminQuestionBankTabStyle;

