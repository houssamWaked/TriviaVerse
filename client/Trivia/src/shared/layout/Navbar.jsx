import colors from '../../constants/colors'; // adjust path if needed

export default function Navbar({ user, onJoin, onLogout }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Left: Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>✨</div>
          <span style={styles.logoText}>TriviaVerse</span>
        </div>

        {/* Center: Links */}
        <div style={styles.links}>
          <NavItem icon="🏆" label="Leaderboard" />
          <NavItem icon="✨" label="Create Quiz" />
        </div>

        {/* Right: CTA */}
        <div style={styles.right}>
          {user ? (
            <>
              <div style={styles.userPill}>
                <span style={styles.userIcon}>👋</span>
                <span style={styles.userName}>{user.username || 'Player'}</span>
              </div>
              <button type="button" style={styles.logout} onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <button type="button" style={styles.cta} onClick={onJoin}>
              Join Now! 🚀
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavItem({ icon, label }) {
  return (
    <button type="button" style={styles.link}>
      <span style={styles.linkIcon}>{icon}</span>
      {label}
    </button>
  );
}

/* ================= STYLES ================= */

const styles = {
  nav: {
    width: '100%',
    background: colors.neutral.white,
    borderBottom: `1px solid ${colors.neutral[200]}`,
  },

  container: {
    height: 72,
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },

  /* Logo */
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: colors.gradients.main,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: colors.neutral.white,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    background: colors.gradients.main,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  /* Center links */
  links: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    flex: 1,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 600,
    color: colors.neutral[700],
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  linkIcon: {
    fontSize: 16,
  },

  /* CTA */
  right: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cta: {
    padding: '10px 22px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 700,
    color: colors.neutral.white,
    background: colors.gradients.main,
    boxShadow: `0 8px 20px rgba(139,44,255,0.25)`,
  },

  userPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 999,
    background: colors.neutral[100],
    border: `1px solid ${colors.neutral[200]}`,
    color: colors.neutral[800],
    fontSize: 14,
    fontWeight: 900,
  },
  userIcon: { fontSize: 16 },
  userName: { lineHeight: 1 },

  logout: {
    padding: '10px 14px',
    borderRadius: 999,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 900,
    color: colors.neutral[800],
    background: colors.neutral.white,
    boxShadow: `0 8px 20px rgba(0,0,0,0.08)`,
  },
};
