import React from 'react';
import { api } from '@/api';
import getVerifyEmailErrorMessage from '../helpers/getVerifyEmailErrorMessage';

type VerifyEmailState = {
  status: 'idle' | 'loading' | 'ok' | 'error';
  message: string;
};

export type VerifyEmailPageProps = {
  token?: string;
  onOpenLogin?: () => void;
  onNavigateHome?: () => void;
};

/**
 * Email verification landing page: verifies a token and prompts the user to log in.
 */
export default function VerifyEmailPage({
  token = '',
  onOpenLogin,
  onNavigateHome,
}: VerifyEmailPageProps) {
  const [state, setState] = React.useState<VerifyEmailState>({ status: 'idle', message: '' });

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setState({ status: 'error', message: 'Missing verification token.' });
        return;
      }

      setState({ status: 'loading', message: 'Verifying your email...' });
      try {
        await api.verifyEmail({ token });
        if (cancelled) return;
        setState({ status: 'ok', message: 'Email verified. You can now log in.' });
      } catch (err) {
        if (cancelled) return;
        setState({ status: 'error', message: getVerifyEmailErrorMessage(err) });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Verify Email</h2>
      <p style={{ marginTop: 0, color: '#444' }}>{state.message}</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button type="button" className="tv-card" onClick={() => onNavigateHome?.()}>
          Home
        </button>
        <button
          type="button"
          className="tv-card"
          onClick={() => onOpenLogin?.()}
          disabled={state.status !== 'ok'}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
