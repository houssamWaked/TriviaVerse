import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import React from 'react';

function useMediaQuery(query) {
  const getMatch = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = React.useState(getMatch);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    onChange();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    // Safari < 14
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

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
  const isMobile = useMediaQuery('(max-width: 820px)');
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  React.useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <button
          type="button"
          className="tv-btn-reset tv-nav-logo"
          style={styles.logoWrapBtn}
          onClick={onHome}
        >
          <div style={styles.logoIcon}>{ICONS.brand.sparkles}</div>
          <span style={styles.logoText}>{STRINGS.COMMON.appName}</span>
        </button>

        {!isMobile && (
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
        )}

        <div style={styles.right}>
          {user ? (
            <>
              <button
                type="button"
                className="tv-btn-reset tv-nav-user"
                style={styles.userPillBtn}
                onClick={onProfile}
                title={STRINGS.NAV.profile}
              >
                <span style={styles.userIcon}>{ICONS.common.wave}</span>
                <span style={styles.userName}>
                  {user.username || STRINGS.COMMON.playerFallback}
                </span>
              </button>
              {!isMobile && (
                <button
                  type="button"
                  className="tv-btn-reset tv-nav-logout"
                  style={styles.logout}
                  onClick={onLogout}
                >
                  {STRINGS.COMMON.logout}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="tv-btn-reset tv-nav-cta"
              style={isMobile ? { ...styles.cta, ...styles.ctaMobile } : styles.cta}
              onClick={onJoin}
            >
              {STRINGS.COMMON.joinNow} {ICONS.common.rocket}
            </button>
          )}

          {isMobile && (
            <button
              type="button"
              className="tv-btn-reset"
              style={styles.menuBtn}
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="tv-nav-mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? ICONS.common.close : ICONS.common.menu}
            </button>
          )}
        </div>
      </div>

      {isMobile && menuOpen && (
        <div
          id="tv-nav-mobile-menu"
          style={styles.mobileMenu}
        >
          <div style={styles.mobileMenuInner}>
            <NavItem
              fullWidth
              icon={ICONS.common.search}
              label={STRINGS.NAV.quizzes}
              onClick={() => {
                setMenuOpen(false);
                onDiscoverQuizzes?.();
              }}
            />
            <NavItem
              fullWidth
              icon={ICONS.common.trophy}
              label={STRINGS.NAV.leaderboard}
              onClick={() => {
                setMenuOpen(false);
                onLeaderboard?.();
              }}
            />
            <NavItem
              fullWidth
              icon={ICONS.brand.sparkles}
              label={STRINGS.NAV.createQuiz}
              onClick={() => {
                setMenuOpen(false);
                onCreateQuiz?.();
              }}
            />

            {user && (
              <NavItem
                fullWidth
                icon={ICONS.common.handshake}
                label={STRINGS.NAV.friends}
                onClick={() => {
                  setMenuOpen(false);
                  onFriends?.();
                }}
              />
            )}

            {showAdmin && (
              <NavItem
                fullWidth
                icon={ICONS.common.wrench}
                label={STRINGS.NAV.admin}
                onClick={() => {
                  setMenuOpen(false);
                  onAdmin?.();
                }}
              />
            )}

            {user && (
              <button
                type="button"
                className="tv-btn-reset"
                style={styles.mobileLogout}
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
              >
                {STRINGS.COMMON.logout}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavItem({ icon, label, onClick, fullWidth = false }) {
  return (
    <button
      type="button"
      className="tv-btn-reset tv-nav-link"
      style={fullWidth ? { ...styles.link, ...styles.linkFull } : styles.link}
      onClick={onClick}
    >
      <span style={styles.linkIcon}>{icon}</span>
      {label}
    </button>
  );
}

const styles = {
  nav: {
    width: '100%',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(255,255,255,0.78)',
    WebkitBackdropFilter: 'blur(12px)',
    backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${colors.neutral[200]}`,
  },

  container: {
    minHeight: 72,
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },

  logoWrapBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: '0 0 auto',
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
    gap: 10,
    rowGap: 10,
    flex: '1 1 520px',
    flexWrap: 'wrap',
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
    padding: '10px 12px',
    borderRadius: 999,
  },
  linkIcon: {
    fontSize: 16,
  },

  right: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    flex: '0 0 auto',
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
  ctaMobile: { padding: '10px 14px', fontSize: 14 },

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
  userName: { lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

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

  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 950,
    color: colors.neutral[800],
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  },

  mobileMenu: {
    width: '100%',
    borderTop: `1px solid ${colors.neutral[200]}`,
    background: 'rgba(255,255,255,0.92)',
    WebkitBackdropFilter: 'blur(12px)',
    backdropFilter: 'blur(12px)',
  },
  mobileMenuInner: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '10px 18px 14px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
    alignItems: 'center',
  },
  linkFull: {
    justifyContent: 'flex-start',
    width: '100%',
    padding: '12px 14px',
    background: colors.neutral[50],
    border: `1px solid ${colors.neutral[200]}`,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  mobileLogout: {
    height: 44,
    padding: '0 14px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 950,
    color: colors.secondary[700],
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
};
