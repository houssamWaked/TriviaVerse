import { STRINGS } from '@/constants/strings';
import AdminDashboard from '@/features/Admin/components/AdminDashboard';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import { useAdminAccess } from '@/features/Admin/hooks/useAdminAccess';

type AdminUser = {
  email?: string;
} | null;

export type AdminPageProps = {
  user?: AdminUser;
  onRequireAuth?(...args: [string?]): void;
  onNavigateHome?: () => void;
  onNavigateCreateQuiz?: () => void;
};

/**
 * Admin page gate: checks configured admin emails and renders dashboard.
 * @param user Current user snapshot.
 * @param onRequireAuth Callback to open login flow.
 * @returns React element.
 */
export default function AdminPage({
  user,
  onRequireAuth,
  onNavigateHome,
  onNavigateCreateQuiz,
}: AdminPageProps) {
  const { admins, isAdmin } = useAdminAccess(user);

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
              <code>{STRINGS.ADMIN_PAGE.env.api}</code>{' '}
              {STRINGS.ADMIN_PAGE.notConfigured.suffix}
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


