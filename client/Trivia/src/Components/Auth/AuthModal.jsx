import React, { useEffect, useRef, useState } from 'react';
import colors from '../../constants/colors';
import AuthModalStyle from '../../Styles/ComponentStyles/AuthModalStyle';

export default function AuthModal({
  open,
  mode = 'signup',
  onModeChange,
  onClose,
  onLogin,
  onSignup,
  loading = false,
  error = '',
}) {
  const emailRef = useRef(null);
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (loading) return;
      setValues({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);

    const t = window.setTimeout(() => emailRef.current?.focus?.(), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, mode, loading]);

  if (!open) return null;

  const isLogin = mode === 'login';

  const reset = () =>
    setValues({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

  const close = () => {
    if (loading) return;
    reset();
    onClose?.();
  };

  const submit = (e) => {
    e.preventDefault();

    if (!isLogin && values.password !== values.confirmPassword) return;

    if (isLogin) {
      onLogin?.({ email: values.email, password: values.password });
    } else {
      onSignup?.({
        username: values.username,
        email: values.email,
        password: values.password,
      });
    }
  };

  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) close();
  };

  const tabBtn = (tabMode) => ({
    ...AuthModalStyle.tabBtn,
    ...(mode === tabMode ? AuthModalStyle.tabBtnActive : {}),
  });

  return (
    <div style={AuthModalStyle.overlay} onMouseDown={onOverlayMouseDown}>
      <div style={AuthModalStyle.card}>
        <button type="button" style={AuthModalStyle.closeBtn} onClick={close}>
          ✕
        </button>

        <div style={AuthModalStyle.left}>
          <div>
            <div style={AuthModalStyle.leftBadge}>
              <span style={AuthModalStyle.leftBadgeIcon}>✨</span>
              <span style={AuthModalStyle.leftBadgeText}>Join the fun</span>
            </div>

            <h2 style={AuthModalStyle.leftTitle}>
              Welcome to <span style={AuthModalStyle.brand}>TriviaVerse</span>
            </h2>
            <p style={AuthModalStyle.leftSubtitle}>
              Play with friends, earn rewards, and create quizzes that go viral.
            </p>

            <div style={AuthModalStyle.perks}>
              <div style={AuthModalStyle.perkRow}>
                <span style={AuthModalStyle.perkIcon}>🏆</span>
                <span style={AuthModalStyle.perkText}>Climb the leaderboard</span>
              </div>
              <div style={AuthModalStyle.perkRow}>
                <span style={AuthModalStyle.perkIcon}>🎁</span>
                <span style={AuthModalStyle.perkText}>
                  Unlock badges & streaks
                </span>
              </div>
              <div style={AuthModalStyle.perkRow}>
                <span style={AuthModalStyle.perkIcon}>✨</span>
                <span style={AuthModalStyle.perkText}>Create your own quiz</span>
              </div>
            </div>
          </div>

          <div style={AuthModalStyle.leftFooter}>
            <span style={AuthModalStyle.leftFooterDot}>●</span>
            <span>One account, all modes</span>
          </div>

          <span style={{ ...AuthModalStyle.sparkle, top: 18, right: 20 }}>
            ⭐
          </span>
          <span style={{ ...AuthModalStyle.sparkle, bottom: 22, left: 22 }}>
            ✨
          </span>
        </div>

        <div style={AuthModalStyle.right}>
          <div style={AuthModalStyle.header}>
            <h3 style={AuthModalStyle.title}>
              {isLogin ? 'Login' : 'Sign up'}
            </h3>
            <p style={AuthModalStyle.subtitle}>
              {isLogin
                ? 'Welcome back — let’s keep your streak going.'
                : 'Create your account in seconds.'}
            </p>
            {!!error && <p style={AuthModalStyle.errorBanner}>{error}</p>}
          </div>

          <div style={AuthModalStyle.tabRow}>
            <button
              type="button"
              style={tabBtn('signup')}
              onClick={() => {
                reset();
                onModeChange?.('signup');
              }}
              disabled={loading}
            >
              Sign up
            </button>
            <button
              type="button"
              style={tabBtn('login')}
              onClick={() => {
                reset();
                onModeChange?.('login');
              }}
              disabled={loading}
            >
              Login
            </button>
          </div>

          <form style={AuthModalStyle.form} onSubmit={submit}>
            {!isLogin && (
              <label style={AuthModalStyle.field}>
                <span style={AuthModalStyle.label}>Username</span>
                <input
                  style={AuthModalStyle.input}
                  value={values.username}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, username: e.target.value }))
                  }
                  placeholder="coolplayer123"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  disabled={loading}
                  required
                />
              </label>
            )}

            <label style={AuthModalStyle.field}>
              <span style={AuthModalStyle.label}>Email</span>
              <input
                ref={emailRef}
                style={AuthModalStyle.input}
                value={values.email}
                onChange={(e) =>
                  setValues((v) => ({ ...v, email: e.target.value }))
                }
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                required
              />
            </label>

            <label style={AuthModalStyle.field}>
              <span style={AuthModalStyle.label}>Password</span>
              <input
                style={AuthModalStyle.input}
                value={values.password}
                onChange={(e) =>
                  setValues((v) => ({ ...v, password: e.target.value }))
                }
                placeholder="••••••••"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? 1 : 8}
                disabled={loading}
                required
              />
            </label>

            {!isLogin && (
              <label style={AuthModalStyle.field}>
                <span style={AuthModalStyle.label}>Confirm password</span>
                <input
                  style={AuthModalStyle.input}
                  value={values.confirmPassword}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                {values.confirmPassword.length > 0 &&
                  values.password !== values.confirmPassword && (
                    <span style={AuthModalStyle.errorText}>
                      Passwords don’t match.
                    </span>
                  )}
              </label>
            )}

            <button
              type="submit"
              className="tv-card"
              style={{
                ...AuthModalStyle.submitBtn,
                background: colors.gradients.main,
              }}
              disabled={loading}
            >
              {loading
                ? 'Working...'
                : isLogin
                  ? 'Login'
                  : 'Create account'}{' '}
              🚀
            </button>

            <div style={AuthModalStyle.altRow}>
              <span style={AuthModalStyle.altText}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </span>
              <button
                type="button"
                style={AuthModalStyle.altLink}
                onClick={() => {
                  reset();
                  onModeChange?.(isLogin ? 'signup' : 'login');
                }}
                disabled={loading}
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
