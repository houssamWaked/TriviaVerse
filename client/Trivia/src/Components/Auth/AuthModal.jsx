import React, { useEffect, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import AuthModalStyle from '@/Styles/ComponentStyles/AuthModalStyle';

export default function AuthModal({
  open,
  mode = 'signup',
  onModeChange,
  onClose,
  onLogin,
  onSignup,
  onResendVerification,
  loading = false,
  error = '',
  errorCode = '',
}) {
  const emailRef = useRef(null);
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

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
      setResendBusy(false);
      setResendMessage('');
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

  const reset = ({ keepEmail = false } = {}) =>
    setValues((v) => ({
      username: '',
      email: keepEmail ? v.email : '',
      password: '',
      confirmPassword: '',
    }));

  const close = () => {
    if (loading || resendBusy) return;
    reset({ keepEmail: false });
    setResendMessage('');
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

  const canResend = !!String(values.email || '').trim();
  const showResend = isLogin && (!!errorCode || canResend);

  const resend = async () => {
    if (loading || resendBusy) return;
    if (!canResend) {
      setResendMessage('Enter your email above first.');
      return;
    }
    setResendBusy(true);
    setResendMessage('');
    try {
      await onResendVerification?.(String(values.email || '').trim());
      setResendMessage('If an account exists, a verification email was sent.');
    } catch (err) {
      setResendMessage(
        err?.response?.data?.message || err?.message || 'Failed to resend verification email.'
      );
    } finally {
      setResendBusy(false);
    }
  };

  const onOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <div style={AuthModalStyle.overlay} onMouseDown={onOverlayMouseDown}>
      <div style={AuthModalStyle.card}>
        <button type="button" style={AuthModalStyle.closeBtn} onClick={close}>
          {ICONS.common.close}
        </button>

        <div style={AuthModalStyle.left}>
          <div>
            <div style={AuthModalStyle.leftBadge}>
              <span style={AuthModalStyle.leftBadgeIcon}>
                {ICONS.brand.sparkles}
              </span>
              <span style={AuthModalStyle.leftBadgeText}>{STRINGS.AUTH.badge}</span>
            </div>

            <h2 style={AuthModalStyle.leftTitle}>
              {STRINGS.AUTH.welcomePrefix}{' '}
              <span style={AuthModalStyle.brand}>{STRINGS.COMMON.appName}</span>
            </h2>
            <p style={AuthModalStyle.leftSubtitle}>{STRINGS.AUTH.leftSubtitle}</p>

            <div style={AuthModalStyle.perks}>
              <div style={AuthModalStyle.perkRow}>
                <span style={AuthModalStyle.perkIcon}>{ICONS.common.trophy}</span>
                <span style={AuthModalStyle.perkText}>
                  {STRINGS.AUTH.perks.leaderboard}
                </span>
              </div>
              <div style={AuthModalStyle.perkRow}>
                <span style={AuthModalStyle.perkIcon}>{ICONS.common.gift}</span>
                <span style={AuthModalStyle.perkText}>
                  {STRINGS.AUTH.perks.badges}
                </span>
              </div>
              <div style={AuthModalStyle.perkRow}>
                <span style={AuthModalStyle.perkIcon}>
                  {ICONS.brand.sparkles}
                </span>
                <span style={AuthModalStyle.perkText}>
                  {STRINGS.AUTH.perks.createQuiz}
                </span>
              </div>
            </div>
          </div>

          <div style={AuthModalStyle.leftFooter}>
            <span style={AuthModalStyle.leftFooterDot}>{ICONS.common.dot}</span>
            <span>{STRINGS.AUTH.leftFooter}</span>
          </div>

          <span style={AuthModalStyle.sparkleTopRight}>
            {ICONS.common.star}
          </span>
          <span style={AuthModalStyle.sparkleBottomLeft}>
            {ICONS.brand.sparkles}
          </span>
        </div>

        <div style={AuthModalStyle.right}>
          <div style={AuthModalStyle.header}>
            <h3 style={AuthModalStyle.title}>
              {isLogin ? STRINGS.AUTH.header.login : STRINGS.AUTH.header.signup}
            </h3>
            <p style={AuthModalStyle.subtitle}>
              {isLogin ? STRINGS.AUTH.subtitle.login : STRINGS.AUTH.subtitle.signup}
            </p>
            {!!error && <p style={AuthModalStyle.errorBanner}>{error}</p>}
          </div>

          <div style={AuthModalStyle.tabRow}>
            <button
              type="button"
              style={AuthModalStyle.tabBtnState(mode === 'signup')}
              onClick={() => {
                setResendMessage('');
                reset({ keepEmail: true });
                onModeChange?.('signup');
              }}
              disabled={loading || resendBusy}
            >
              {STRINGS.AUTH.header.signup}
            </button>
            <button
              type="button"
              style={AuthModalStyle.tabBtnState(mode === 'login')}
              onClick={() => {
                setResendMessage('');
                reset({ keepEmail: true });
                onModeChange?.('login');
              }}
              disabled={loading || resendBusy}
            >
              {STRINGS.AUTH.header.login}
            </button>
          </div>

          <form style={AuthModalStyle.form} onSubmit={submit}>
            {!isLogin && (
              <label style={AuthModalStyle.field}>
                <span style={AuthModalStyle.label}>{STRINGS.AUTH.fields.username}</span>
                <input
                  style={AuthModalStyle.input}
                  value={values.username}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, username: e.target.value }))
                  }
                  placeholder={STRINGS.AUTH.placeholders.username}
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  disabled={loading}
                  required
                />
              </label>
            )}

            <label style={AuthModalStyle.field}>
              <span style={AuthModalStyle.label}>{STRINGS.AUTH.fields.email}</span>
              <input
                ref={emailRef}
                style={AuthModalStyle.input}
                value={values.email}
                onChange={(e) => {
                  setResendMessage('');
                  setValues((v) => ({ ...v, email: e.target.value }));
                }}
                placeholder={STRINGS.AUTH.placeholders.email}
                autoComplete="email"
                inputMode="email"
                disabled={loading || resendBusy}
                required
              />
            </label>

            <label style={AuthModalStyle.field}>
              <span style={AuthModalStyle.label}>{STRINGS.AUTH.fields.password}</span>
              <input
                style={AuthModalStyle.input}
                value={values.password}
                onChange={(e) =>
                  setValues((v) => ({ ...v, password: e.target.value }))
                }
                placeholder={STRINGS.AUTH.placeholders.password}
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={isLogin ? 1 : 8}
                disabled={loading || resendBusy}
                required
              />
            </label>

            {!isLogin && (
              <label style={AuthModalStyle.field}>
                <span style={AuthModalStyle.label}>
                  {STRINGS.AUTH.fields.confirmPassword}
                </span>
                <input
                  style={AuthModalStyle.input}
                  value={values.confirmPassword}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder={STRINGS.AUTH.placeholders.password}
                  type="password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                {values.confirmPassword.length > 0 &&
                  values.password !== values.confirmPassword && (
                    <span style={AuthModalStyle.errorText}>
                      {STRINGS.AUTH.errors.passwordMismatch}
                    </span>
                  )}
              </label>
            )}

            <button
              type="submit"
              className="tv-card"
              style={AuthModalStyle.submitBtnMain}
              disabled={loading || resendBusy}
            >
              {loading
                ? STRINGS.AUTH.submit.working
                : isLogin
                  ? STRINGS.AUTH.header.login
                  : STRINGS.AUTH.submit.createAccount}{' '}
              {ICONS.common.rocket}
            </button>

            {showResend && (
              <div style={AuthModalStyle.resendRow}>
                <button
                  type="button"
                  style={AuthModalStyle.resendBtn}
                  onClick={resend}
                  disabled={loading || resendBusy || !canResend}
                  title={!canResend ? 'Enter your email first' : undefined}
                >
                  {resendBusy ? 'Resending...' : 'Resend verification email'}
                </button>
                <span style={AuthModalStyle.resendHint}>
                  {errorCode === 'EMAIL_NOT_VERIFIED' ? 'Email not verified.' : 'Need to verify?'}
                </span>
              </div>
            )}
            {!!resendMessage && <p style={AuthModalStyle.resendMsg}>{resendMessage}</p>}

            <div style={AuthModalStyle.altRow}>
              <span style={AuthModalStyle.altText}>
                {isLogin ? STRINGS.AUTH.alt.dontHave : STRINGS.AUTH.alt.alreadyHave}
              </span>
              <button
                type="button"
                style={AuthModalStyle.altLink}
                onClick={() => {
                  setResendMessage('');
                  reset({ keepEmail: true });
                  onModeChange?.(isLogin ? 'signup' : 'login');
                }}
                disabled={loading || resendBusy}
              >
                {isLogin ? STRINGS.AUTH.header.signup : STRINGS.AUTH.header.login}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
