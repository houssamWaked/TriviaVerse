import colors from '../../constants/colors'; // adjust path if needed

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <p style={styles.text}>
          Made with <span style={styles.heart}>💜</span> by{' '}
          <span style={styles.brand}>TriviaVerse</span> · © 2026
        </p>

        <p style={styles.tagline}>Keep learning, keep playing! 🎉</p>
      </div>
    </footer>
  );
}

/* ================= STYLES ================= */

const styles = {
  footer: {
    width: '100%',
    padding: '28px 16px',
    background: `linear-gradient(180deg, ${colors.secondary[50]} 0%, ${colors.neutral.white} 100%)`,
    borderTop: `1px solid ${colors.neutral[200]}`,
  },

  container: {
    maxWidth: 1200,
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  text: {
    fontSize: 15,
    fontWeight: 500,
    color: colors.neutral[700],
  },

  heart: {
    color: colors.primary[500],
  },

  brand: {
    fontWeight: 700,
    background: colors.gradients.main,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  tagline: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary[500],
  },
};
