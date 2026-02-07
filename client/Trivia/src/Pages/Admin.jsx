import React, { useMemo } from 'react';
import colors from '../constants/colors';
import AdminStyle from '../Styles/ComponentStyles/AdminStyle';
import AdminDashboard from '../Components/Admin/AdminDashboard';

function getAdminEmailSet() {
  const raw =
    import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '';
  return new Set(
    String(raw)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default function Admin({
  user,
  onRequireAuth,
  onNavigateHome,
  onNavigateCreateQuiz,
}) {
  const admins = useMemo(() => getAdminEmailSet(), []);
  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    if (admins.size === 0) return false;
    return admins.has(String(user.email).trim().toLowerCase());
  }, [admins, user?.email]);

  if (!user) {
    return (
      <div style={AdminStyle.page}>
        <div style={AdminStyle.container}>
          <div className="tv-card" style={AdminStyle.card}>
            <h2 style={{ margin: 0, fontWeight: 950, color: colors.neutral[900] }}>
              Admin login required
            </h2>
            <p style={{ marginTop: 10, fontWeight: 850, color: colors.neutral[700] }}>
              Login with the admin email to access the dashboard.
            </p>
            <div style={{ marginTop: 14, ...AdminStyle.row }}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                onClick={() => onRequireAuth?.('admin')}
              >
                Login
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={onNavigateHome}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (admins.size === 0) {
    return (
      <div style={AdminStyle.page}>
        <div style={AdminStyle.container}>
          <div className="tv-card" style={AdminStyle.card}>
            <h2 style={{ margin: 0, fontWeight: 950, color: colors.neutral[900] }}>
              Admin is not configured
            </h2>
            <p style={{ marginTop: 10, fontWeight: 850, color: colors.neutral[700] }}>
              Set <code>VITE_ADMIN_EMAILS</code> in the client and <code>ADMIN_EMAILS</code> in the
              API.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...AdminStyle.btn, marginTop: 14 }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={AdminStyle.page}>
        <div style={AdminStyle.container}>
          <div className="tv-card" style={AdminStyle.card}>
            <h2 style={{ margin: 0, fontWeight: 950, color: colors.neutral[900] }}>
              Forbidden
            </h2>
            <p style={{ marginTop: 10, fontWeight: 850, color: colors.neutral[700] }}>
              Your account is not in the admin allowlist.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...AdminStyle.btn, marginTop: 14 }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      user={user}
      onNavigateHome={onNavigateHome}
      onNavigateCreateQuiz={onNavigateCreateQuiz}
    />
  );
}
