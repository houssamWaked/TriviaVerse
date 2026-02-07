import colors from '../../constants/colors';
const statCardStyle = {
  /* Cards */
  cardsGrid: {
    marginTop: 56,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 18,
  },

  card: {
    background: colors.neutral.white,
    borderRadius: 18,
    padding: '22px 18px',
    textAlign: 'left',
    boxShadow: '0 14px 30px rgba(0,0,0,0.16)',
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
  cardValueColor: (color) => ({
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
