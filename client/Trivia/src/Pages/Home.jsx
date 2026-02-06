import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import Navbar from '../shared/layout/Navbar';
import Footer from '../shared/layout/Footer';
import HomeHero from '../Components/HomeComponents/HomeHero';
import Modes from '../Components/HomeComponents/Modes';
import CreateQuizBanner from '../Components/HomeComponents/CreateQuizBanner';
import FeaturesStrip from '../Components/HomeComponents/FeaturesStrip';
import AuthModal from '../Components/Auth/AuthModal';
import {
  api,
  clearAuthToken,
  clearCurrentUser,
  getCurrentUser,
  setAuthToken,
  setCurrentUser,
} from '../api';

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.neutral.white,
  },
  main: {
    width: '100%',
    background: colors.gradients.main,
    display: 'flex',
    flexDirection: 'column',
  },
};

function formatCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  if (num >= 1_000_000) return `${Math.floor(num / 1_000_000)}M+`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}K+`;
  return String(num);
}

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(() => getCurrentUser());

  const [metricsRaw, setMetricsRaw] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getHomeMetrics()
      .then((data) => {
        if (cancelled) return;
        setMetricsRaw(data);
      })
      .catch(() => {
        // keep defaults if backend is down
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!metricsRaw) return undefined;
    return {
      active_players: formatCount(metricsRaw.active_players),
      questions: formatCount(metricsRaw.questions),
      quizzes_created: formatCount(metricsRaw.quizzes_created),
      fun_level: `${metricsRaw.fun_level ?? 100}%`,
    };
  }, [metricsRaw]);

  const logout = () => {
    clearAuthToken();
    clearCurrentUser();
    setUser(null);
  };

  const openJoin = (mode = 'signup') => {
    setAuthError('');
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleLogin = async (body) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const result = await api.login(body);
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setUser(result.user);
      setAuthOpen(false);
    } catch (err) {
      setAuthError(getApiErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (body) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const result = await api.register(body);
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setUser(result.user);
      setAuthOpen(false);
    } catch (err) {
      setAuthError(getApiErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!user) return openJoin('signup');

    try {
      const quiz = await api.createQuiz({
        title: 'My Trivia Quiz ✨',
        description: 'A fun quiz made on TriviaVerse!',
        visibility: 'private',
      });
      window.alert(`Quiz created!\n\nID: ${quiz.id}`);
    } catch (err) {
      window.alert(getApiErrorMessage(err));
    }
  };

  return (
    <div style={styles.page}>
      <Navbar
        user={user}
        onJoin={() => openJoin('signup')}
        onLogout={logout}
      />
      <main style={styles.main}>
        <HomeHero
          metrics={metrics}
          onCreateQuiz={handleCreateQuiz}
          onStartPlaying={() => {
            const el = document.getElementById('modes');
            el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
          }}
        />
        <div id="modes">
          <Modes />
        </div>
        <CreateQuizBanner onCreate={handleCreateQuiz} />
        <FeaturesStrip />
      </main>
      <Footer />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        loading={authBusy}
        error={authError}
      />
    </div>
  );
}
export default Home;
