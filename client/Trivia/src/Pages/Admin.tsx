import React, { useMemo } from 'react';
import { STRINGS } from '@/constants/strings';
import AdminDashboard from '@/Components/Admin/AdminDashboard';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';

type AdminUser = {
  email?: string;
} | null;

type AdminProps = {
  user?: AdminUser;
  onRequireAuth?: (mode?: string) => void;
  onNavigateHome?: () => void;
  onNavigateCreateQuiz?: () => void;
};

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
}: AdminProps) {
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
            <h2 style={AdminStyle.simpleTitle}>
              {STRINGS.ADMIN_PAGE.loginRequired.title}
            </h2>
            <p style={AdminStyle.simpleText}>
              {STRINGS.ADMIN_PAGE.loginRequired.subtitle}
            </p>
            <div style={AdminStyle.rowMt14}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btnPrimaryFull}
                onClick={() => onRequireAuth?.('admin')}
              >
                {STRINGS.AUTH.header.login}
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={onNavigateHome}
              >
                {STRINGS.COMMON.buttons.home}
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
            <h2 style={AdminStyle.simpleTitle}>
              {STRINGS.ADMIN_PAGE.notConfigured.title}
            </h2>
            <p style={AdminStyle.simpleText}>
              {STRINGS.ADMIN_PAGE.notConfigured.prefix}{' '}
              <code>{STRINGS.ADMIN_PAGE.env.client}</code>{' '}
              {STRINGS.ADMIN_PAGE.notConfigured.middle}{' '}
              <code>{STRINGS.ADMIN_PAGE.env.api}</code> {STRINGS.ADMIN_PAGE.notConfigured.suffix}
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btnMt14}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
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
            <h2 style={AdminStyle.simpleTitle}>
              {STRINGS.ADMIN_PAGE.forbidden.title}
            </h2>
            <p style={AdminStyle.simpleText}>
              {STRINGS.ADMIN_PAGE.forbidden.subtitle}
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btnMt14}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
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

