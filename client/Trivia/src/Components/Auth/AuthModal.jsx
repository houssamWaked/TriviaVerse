import React, { useEffect, useRef, useState } from 'react';
import { Box, Dialog, DialogContent, IconButton, Paper, useMediaQuery, useTheme } from '@mui/material';
import { ICONS } from '@/constants/icons';
import AuthModalIllustration from './AuthModalIllustration';
import AuthModalForm from './AuthModalForm';

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
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const emailRef = useRef(null);
  const googleBtnRef = useRef(null);
  const onGoogleRef = useRef(onGoogle);
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
    const timer = window.setTimeout(() => emailRef.current?.focus?.(), 0);
    return () => window.clearTimeout(timer);
  }, [open, mode]);

  useEffect(() => {
    if (!open || !googleClientId) return undefined;

    let cancelled = false;

    const render = () => {
      if (cancelled) return false;
      const g = window?.google?.accounts?.id;
      if (!g || !googleBtnRef.current) return false;

      try {
        googleBtnRef.current.innerHTML = '';
        g.initialize({
          client_id: googleClientId,
          callback: (resp) => {
            const credential = resp?.credential;
            if (credential && typeof onGoogleRef.current === 'function') {
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
          width: isCompact ? 280 : 340,
        });
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
    const interval = window.setInterval(() => {
      tries += 1;
      if (render() || tries > 30) window.clearInterval(interval);
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      try {
        window?.google?.accounts?.id?.cancel?.();
      } catch {
        // ignore
      }
    };
  }, [open, googleClientId, isCompact]);

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
    setResendBusy(false);
    onClose?.();
  };

  const submit = (e) => {
    e.preventDefault();
    if (!isLogin && values.password !== values.confirmPassword) return;

    if (isLogin) onLogin?.({ email: values.email, password: values.password });
    else {
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

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth fullScreen={isCompact}>
      <DialogContent sx={{ p: 0 }}>
        <Paper sx={{ display: 'flex', minHeight: isCompact ? '100vh' : 680, position: 'relative' }}>
          <IconButton onClick={close} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
            <span>{ICONS.common.close}</span>
          </IconButton>

          {!isCompact && <AuthModalIllustration />}

          <Box sx={{ flex: 1 }}>
            <AuthModalForm
              mode={mode}
              loading={loading}
              resendBusy={resendBusy}
              values={values}
              setValues={setValues}
              setResendMessage={setResendMessage}
              fieldErrors={fieldErrors}
              bannerText={bannerText}
              onModeChange={onModeChange}
              onSubmit={submit}
              onReset={reset}
              googleClientId={googleClientId}
              googleBtnRef={googleBtnRef}
              emailRef={emailRef}
              showResend={showResend}
              resend={resend}
              canResend={canResend}
              resendMessage={resendMessage}
            />
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}
