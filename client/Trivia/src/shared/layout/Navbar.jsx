import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function Navbar({
  user,
  onJoin,
  onLogout,
  onCreateQuiz,
  onDiscoverQuizzes,
  onFriends,
  onProfile,
  showAdmin = false,
  onAdmin,
  onLeaderboard,
  onHome,
}) {
  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <button type="button" style={styles.logoWrapBtn} onClick={onHome}>
          <div style={styles.logoIcon}>{ICONS.brand.sparkles}</div>
          <span style={styles.logoText}>{STRINGS.COMMON.appName}</span>
        </button>

        <div style={styles.links}>
          <NavItem
            icon={ICONS.common.search}
            label={STRINGS.NAV.quizzes}
            onClick={onDiscoverQuizzes}
          />
          {user && (
            <NavItem
              icon={ICONS.common.handshake}
              label={STRINGS.NAV.friends}
              onClick={onFriends}
            />
          )}
          {showAdmin && (
            <NavItem
              icon={ICONS.common.wrench}
              label={STRINGS.NAV.admin}
              onClick={onAdmin}
            />
          )}
          <NavItem
            icon={ICONS.common.trophy}
            label={STRINGS.NAV.leaderboard}
            onClick={onLeaderboard}
          />
          <NavItem
            icon={ICONS.brand.sparkles}
            label={STRINGS.NAV.createQuiz}
            onClick={onCreateQuiz}
          />
        </div>

        <div style={styles.right}>
          {user ? (
            <>
              <button
                type="button"
                style={styles.userPillBtn}
                onClick={onProfile}
                title={STRINGS.NAV.profile}
              >
                <span style={styles.userIcon}>{ICONS.common.wave}</span>
                <span style={styles.userName}>
                  {user.username || STRINGS.COMMON.playerFallback}
                </span>
              </button>
              <button type="button" style={styles.logout} onClick={onLogout}>
                {STRINGS.COMMON.logout}
              </button>
            </>
          ) : (
            <button type="button" style={styles.cta} onClick={onJoin}>
              {STRINGS.COMMON.joinNow} {ICONS.common.rocket}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavItem({ icon, label, onClick }) {
  return (
    <button type="button" style={styles.link} onClick={onClick}>
      <span style={styles.linkIcon}>{icon}</span>
      {label}
    </button>
  );
}

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

  logoWrapBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },
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
    boxShadow: '0 8px 20px rgba(139,44,255,0.25)',
  },

  userPillBtn: {
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
    cursor: 'pointer',
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
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  },
};
