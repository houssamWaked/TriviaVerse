import React from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function AuthModalForm({
  mode,
  loading,
  resendBusy,
  values,
  setValues,
  setResendMessage,
  fieldErrors,
  bannerText,
  onModeChange,
  onSubmit,
  onReset,
  googleClientId,
  googleBtnRef,
  emailRef,
  showResend,
  resend,
  canResend,
  resendMessage,
}) {
  const isLogin = mode === 'login';

  return (
    <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, minWidth: 0 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            {isLogin ? STRINGS.AUTH.header.login : STRINGS.AUTH.header.signup}
          </Typography>
          <Typography color="text.secondary">
            {isLogin ? STRINGS.AUTH.subtitle.login : STRINGS.AUTH.subtitle.signup}
          </Typography>
          {!!bannerText && <Alert severity="error" sx={{ mt: 2 }}>{bannerText}</Alert>}
        </Box>

        <Tabs value={mode} onChange={(_, value) => {
          setResendMessage('');
          onReset({ keepEmail: true });
          onModeChange?.(value);
        }}>
          <Tab value="signup" label={STRINGS.AUTH.header.signup} disabled={loading || resendBusy} />
          <Tab value="login" label={STRINGS.AUTH.header.login} disabled={loading || resendBusy} />
        </Tabs>

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            {!!googleClientId && (
              <>
                <Box sx={{ opacity: loading || resendBusy ? 0.6 : 1 }}>
                  <div ref={googleBtnRef} />
                </Box>
                <Divider>{STRINGS.AUTH.or}</Divider>
              </>
            )}

            {!isLogin && (
              <TextField
                label={STRINGS.AUTH.fields.username}
                value={values.username}
                onChange={(e) => setValues((v) => ({ ...v, username: e.target.value }))}
                placeholder={STRINGS.AUTH.placeholders.username}
                autoComplete="username"
                inputProps={{ minLength: 3, maxLength: 30 }}
                disabled={loading}
                required
                error={fieldErrors.has('username')}
                helperText={fieldErrors.get('username') || ' '}
                fullWidth
              />
            )}

            <TextField
              inputRef={emailRef}
              label={STRINGS.AUTH.fields.email}
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
              error={fieldErrors.has('email')}
              helperText={fieldErrors.get('email') || ' '}
              fullWidth
            />

            <TextField
              label={STRINGS.AUTH.fields.password}
              value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              placeholder={STRINGS.AUTH.placeholders.password}
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              inputProps={{ minLength: isLogin ? 1 : 8 }}
              disabled={loading || resendBusy}
              required
              error={fieldErrors.has('password')}
              helperText={fieldErrors.get('password') || ' '}
              fullWidth
            />

            {!isLogin && (
              <TextField
                label={STRINGS.AUTH.fields.confirmPassword}
                value={values.confirmPassword}
                onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
                placeholder={STRINGS.AUTH.placeholders.password}
                type="password"
                autoComplete="new-password"
                disabled={loading}
                required
                error={values.confirmPassword.length > 0 && values.password !== values.confirmPassword}
                helperText={
                  values.confirmPassword.length > 0 && values.password !== values.confirmPassword
                    ? STRINGS.AUTH.errors.passwordMismatch
                    : ' '
                }
                fullWidth
              />
            )}

            <Button type="submit" variant="contained" size="large" disabled={loading || resendBusy} endIcon={<span>{ICONS.common.rocket}</span>}>
              {loading
                ? STRINGS.AUTH.submit.working
                : isLogin
                  ? STRINGS.AUTH.header.login
                  : STRINGS.AUTH.submit.createAccount}
            </Button>

            {showResend && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Button type="button" variant="text" onClick={resend} disabled={loading || resendBusy || !canResend}>
                  {resendBusy ? 'Resending...' : 'Resend verification email'}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Email not verified.
                </Typography>
              </Stack>
            )}

            {!!resendMessage && <Alert severity="info">{resendMessage}</Alert>}

            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {isLogin ? STRINGS.AUTH.alt.dontHave : STRINGS.AUTH.alt.alreadyHave}
              </Typography>
              <Button
                type="button"
                variant="text"
                onClick={() => {
                  setResendMessage('');
                  onReset({ keepEmail: true });
                  onModeChange?.(isLogin ? 'signup' : 'login');
                }}
                disabled={loading || resendBusy}
              >
                {isLogin ? STRINGS.AUTH.header.signup : STRINGS.AUTH.header.login}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
