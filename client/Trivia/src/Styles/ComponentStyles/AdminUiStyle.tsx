import colors from '../../constants/colors';
import AdminStyle from './AdminStyle';

const AdminUiStyle: any = {
  tabBtn: (active: boolean) => ({
    ...AdminStyle.tabBtn,
    ...(active ? AdminStyle.tabBtnActive : null),
  }),

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6, 8, 20, 0.55)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: (maxWidth: number | string) => ({
    width: '100%',
    maxWidth,
    maxHeight: 'calc(100vh - 36px)',
    overflow: 'auto',
    borderRadius: 22,
    background: colors.neutral.white,
    boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
    border: `1px solid ${colors.neutral[200]}`,
  }),
  modalHeader: {
    padding: 14,
    borderBottom: `1px solid ${colors.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: { fontWeight: 950, color: colors.neutral[900] },
  modalCloseBtn: { ...AdminStyle.btn, height: 40, borderRadius: 14 },
  modalBody: { padding: 14 },

  resultLabel: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  checkbox: { marginTop: 3 },
  emptyText: { fontWeight: 850, color: colors.neutral[700] },
};

export default AdminUiStyle;


