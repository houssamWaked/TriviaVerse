import React, { useEffect, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import AuthModalStyle from '@/Styles/ComponentStyles/AuthModalStyle';

function useMediaQuery(query, { enabled = true } = {}) {
  const getMatch = () => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (!enabled) return undefined;
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return undefined;
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

export default function AuthModal({
  open,
  mode = 'signup',
  onModeChange,
  onClose,
  onLogin,
  onSignup,
  onGoogle,
  onResendVerification,
  loading = false,
  error = '',
  errorCode = '',
  errorDetails = null,
}) {
  const emailRef = useRef(null);
  const googleBtnRef = useRef(null);
  const onGoogleRef = useRef(onGoogle);
  const googleRenderedRef = useRef(false);
  const googleClientId =
    typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string'
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID.trim()
      : '';
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const isCompact = useMediaQuery('(max-width: 720px)', { enabled: open });
  const isLogin = mode === 'login';

  const detailsList = Array.isArray(errorDetails) ? errorDetails : [];
  const fieldErrors = new Map(
    detailsList
      .map((e) => [String(e?.field || '').trim(), String(e?.message || '').trim()])
      .filter(([f, m]) => f && m)
  );
  const bannerText = detailsList.length > 0 ? String(error || '').split('\n')[0] : error;

  useEffect(() => {
    onGoogleRef.current = onGoogle;
  }, [onGoogle]);

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

  useEffect(() => {
    if (!open) return undefined;
    if (!googleClientId) return undefined;

    let cancelled = false;
    googleRenderedRef.current = false;

    const render = () => {
      if (cancelled) return false;
      const g = window?.google?.accounts?.id;
      if (!g || !googleBtnRef.current) return false;

      try {
        googleBtnRef.current.innerHTML = '';
      } catch {
        // ignore
      }

      try {
        g.initialize({
          client_id: googleClientId,
          callback: (resp) => {
            const credential = resp?.credential;
            if (!credential) return;
            if (typeof onGoogleRef.current === 'function') {
              onGoogleRef.current(credential);
            }
          },
        });
        g.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: isCompact ? 300 : 360,
        });
        googleRenderedRef.current = true;
        return true;
      } catch {
        return false;
      }
    };

    if (render()) {
      return () => {
        cancelled = true;
        try {
          window?.google?.accounts?.id?.cancel?.();
        } catch {
          // ignore
        }
      };
    }

    let tries = 0;
    const t = window.setInterval(() => {
      tries += 1;
      if (render()) window.clearInterval(t);
      if (tries > 30) window.clearInterval(t);
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(t);
      try {
        window?.google?.accounts?.id?.cancel?.();
      } catch {
        // ignore
      }
    };
  }, [open, googleClientId, isCompact]);

  if (!open) return null;

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
  const showResend = isLogin && errorCode === 'EMAIL_NOT_VERIFIED';

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
      <div
        style={{
          ...AuthModalStyle.card,
          maxWidth: isCompact ? 560 : AuthModalStyle.card.maxWidth,
        }}
      >
        <button
          type="button"
          style={{
            ...AuthModalStyle.closeBtn,
            ...(isCompact
              ? {
                  border: '1px solid rgba(17,24,39,0.12)',
                  background: 'rgba(17,24,39,0.06)',
                  color: 'rgba(17,24,39,0.92)',
                }
              : null),
          }}
          onClick={close}
        >
          {ICONS.common.close}
        </button>

        {!isCompact && (
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
        )}

        <div style={AuthModalStyle.right}>
          <div style={AuthModalStyle.header}>
            <h3 style={AuthModalStyle.title}>
              {isLogin ? STRINGS.AUTH.header.login : STRINGS.AUTH.header.signup}
            </h3>
            <p style={AuthModalStyle.subtitle}>
              {isLogin ? STRINGS.AUTH.subtitle.login : STRINGS.AUTH.subtitle.signup}
            </p>
            {!!bannerText && <p style={AuthModalStyle.errorBanner}>{bannerText}</p>}
          </div>

          <div
            style={{
              ...AuthModalStyle.tabRow,
              ...(isCompact ? { width: '100%', justifyContent: 'center' } : null),
            }}
          >
            <button
              type="button"
              style={{
                ...AuthModalStyle.tabBtnState(mode === 'signup'),
                ...(isCompact ? { flex: 1 } : null),
              }}
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
              style={{
                ...AuthModalStyle.tabBtnState(mode === 'login'),
                ...(isCompact ? { flex: 1 } : null),
              }}
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
            {!!googleClientId && (
              <>
                <div
                  style={{
                    ...AuthModalStyle.socialWrap,
                    ...(loading || resendBusy ? AuthModalStyle.socialDisabled : null),
                  }}
                >
                  <div ref={googleBtnRef} />
                </div>

                <div style={AuthModalStyle.dividerRow}>
                  <div style={AuthModalStyle.dividerLine} />
                  <span style={AuthModalStyle.dividerText}>{STRINGS.AUTH.or}</span>
                  <div style={AuthModalStyle.dividerLine} />
                </div>
              </>
            )}

            {!isLogin && (
              <label style={AuthModalStyle.field}>
                <span style={AuthModalStyle.label}>{STRINGS.AUTH.fields.username}</span>
                <input
                  style={{
                    ...AuthModalStyle.input,
                    ...(fieldErrors.has('username') ? AuthModalStyle.inputError : null),
                  }}
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
                {fieldErrors.has('username') ? (
                  <span style={AuthModalStyle.errorText}>
                    {fieldErrors.get('username')}
                  </span>
                ) : null}
              </label>
            )}

            <label style={AuthModalStyle.field}>
              <span style={AuthModalStyle.label}>{STRINGS.AUTH.fields.email}</span>
              <input
                ref={emailRef}
                style={{
                  ...AuthModalStyle.input,
                  ...(fieldErrors.has('email') ? AuthModalStyle.inputError : null),
                }}
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
              {fieldErrors.has('email') ? (
                <span style={AuthModalStyle.errorText}>
                  {fieldErrors.get('email')}
                </span>
              ) : null}
            </label>

            <label style={AuthModalStyle.field}>
              <span style={AuthModalStyle.label}>{STRINGS.AUTH.fields.password}</span>
              <input
                style={{
                  ...AuthModalStyle.input,
                  ...(fieldErrors.has('password') ? AuthModalStyle.inputError : null),
                }}
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
              {fieldErrors.has('password') ? (
                <span style={AuthModalStyle.errorText}>
                  {fieldErrors.get('password')}
                </span>
              ) : null}
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
