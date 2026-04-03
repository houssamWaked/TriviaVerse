import colors from '../../constants/colors';
const statCardStyle: any = {
  /* Cards */
  cardsGrid: {
    marginTop: 56,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 18,
  },

  card: {
    background: colors.neutral.white,
    borderRadius: 'var(--tv-radius-lg)',
    padding: '22px 18px',
    textAlign: 'left',
    boxShadow: 'var(--tv-shadow-md)',
    border: '1px solid rgba(17,24,39,0.08)',
    minHeight: 120,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: 8,
  },
  cardValueColor: (color: string) => ({
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: 8,
    color,
  }),
  cardLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: colors.neutral[600],
  },
};
export default statCardStyle;

