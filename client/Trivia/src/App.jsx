import React from 'react';
import './App.css';
import Home from './Pages/Home';
import CreateQuiz from './Pages/CreateQuiz';
import DiscoverQuizzes from './Pages/DiscoverQuizzes';
import QuizView from './Pages/QuizView';
import PlaySession from './Pages/PlaySession';
import Friends from './Pages/Friends';
import Profile from './Pages/Profile';
import DuelPlay from './Pages/DuelPlay';
import Story from './Pages/Story';
import Classic from './Pages/Classic';
import Blitz from './Pages/Blitz';
import Millionaire from './Pages/Millionaire';
import Leaderboard from './Pages/Leaderboard';
import Admin from './Pages/Admin';
import VerifyEmail from './Pages/VerifyEmail';
import Navbar from './shared/layout/Navbar';
import Footer from './shared/layout/Footer';
import CookieBanner from './shared/layout/CookieBanner';
import AuthModal from './Components/Auth/AuthModal';
import AppStyle from './Styles/AppStyle';
import { getApiErrorMessage } from '@/utils/apiError';
import { STRINGS } from '@/constants/strings';
import {
  api,
  clearAuthToken,
  clearCurrentUser,
  getCurrentUser,
  setAuthToken,
  setCurrentUser,
} from './api';

function getRoute() {
  const hash = String(window.location.hash || '').replace(/^#/, '') || '/';
  const [rawPath, rawQuery] = hash.split('?');
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const parts = path.split('/').filter(Boolean);
  const query = new URLSearchParams(rawQuery || '');

  if (parts[0] === 'create-quiz') return { name: 'create-quiz' };
  if (parts[0] === 'admin') return { name: 'admin' };
  if (parts[0] === 'classic') return { name: 'classic' };
  if (parts[0] === 'blitz') return { name: 'blitz' };
  if (parts[0] === 'millionaire') return { name: 'millionaire' };
  if (parts[0] === 'leaderboard') return { name: 'leaderboard' };
  if (parts[0] === 'play' && parts[1]) {
    return {
      name: 'play',
      sessionId: parts[1],
      from: query.get('from') || '',
      levelNumber: query.get('level') ? Number(query.get('level')) : null,
    };
  }
  if (parts[0] === 'quizzes' && parts[1]) return { name: 'quiz', quizId: parts[1] };
  if (parts[0] === 'quizzes') return { name: 'quizzes' };
  if (parts[0] === 'friends' && parts[1]) return { name: 'friend', friendUserId: parts[1] };
  if (parts[0] === 'friends') return { name: 'friends' };
  if (parts[0] === 'profile') return { name: 'profile' };
  if (parts[0] === 'duels' && parts[1] && parts[2] === 'play') {
    return { name: 'duel-play', duelId: parts[1] };
  }
  if (parts[0] === 'story') {
    return { name: 'story' };
  }
  if (parts[0] === 'verify-email') {
    return { name: 'verify-email', token: query.get('token') || '' };
  }
  return { name: 'home' };
}

function navigate(route, params = {}) {
  if (route === 'create-quiz') {
    const q = params.quizId ? `?quizId=${encodeURIComponent(params.quizId)}` : '';
    window.location.hash = `#/create-quiz${q}`;
    return;
  }
  if (route === 'admin') {
    window.location.hash = '#/admin';
    return;
  }
  if (route === 'classic') {
    window.location.hash = '#/classic';
    return;
  }
  if (route === 'blitz') {
    window.location.hash = '#/blitz';
    return;
  }
  if (route === 'millionaire') {
    window.location.hash = '#/millionaire';
    return;
  }
  if (route === 'leaderboard') {
    window.location.hash = '#/leaderboard';
    return;
  }
  if (route === 'quizzes') {
    window.location.hash = '#/quizzes';
    return;
  }
  if (route === 'quiz') {
    window.location.hash = `#/quizzes/${encodeURIComponent(params.quizId)}`;
    return;
  }
  if (route === 'play') {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', String(params.from));
    if (params.level != null) qs.set('level', String(params.level));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    window.location.hash = `#/play/${encodeURIComponent(params.sessionId)}${q}`;
    return;
  }
  if (route === 'friends') {
    window.location.hash = '#/friends';
    return;
  }
  if (route === 'friend') {
    window.location.hash = `#/friends/${encodeURIComponent(params.friendUserId)}`;
    return;
  }
  if (route === 'profile') {
    window.location.hash = '#/profile';
    return;
  }
  if (route === 'duel-play') {
    window.location.hash = `#/duels/${encodeURIComponent(params.duelId)}/play`;
    return;
  }
  if (route === 'story') {
    window.location.hash = '#/story';
    return;
  }
  window.location.hash = '#/';
}

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

function App() {
  const [route, setRoute] = React.useState(getRoute);

  const [user, setUser] = React.useState(() => getCurrentUser());
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signup');
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [authErrorCode, setAuthErrorCode] = React.useState('');
  const [postAuthRoute, setPostAuthRoute] = React.useState(null);

  React.useEffect(() => {
    // Supabase magic links append auth params in the URL fragment, which
    // conflicts with our hash router. To keep things simple, we rely on a
    // query param (`verify_email_token`) and then rewrite to our hash route.
    const search = new URLSearchParams(window.location.search || '');
    const token = search.get('verify_email_token');
    if (token) {
      window.location.hash = `#/verify-email?token=${encodeURIComponent(token)}`;
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      setRoute(getRoute());
      return;
    }

    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openAuth = (mode = 'signup', nextRoute = null) => {
    setAuthError('');
    setAuthErrorCode('');
    setAuthMode(mode);
    setPostAuthRoute(nextRoute);
    setAuthOpen(true);
  };

  const logout = () => {
    clearAuthToken();
    clearCurrentUser();
    setUser(null);
  };

  const handleLogin = async (body) => {
    setAuthBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    try {
      const result = await api.login(body);
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setUser(result.user);
      setAuthOpen(false);
      if (postAuthRoute) {
        if (typeof postAuthRoute === 'string') navigate(postAuthRoute);
        else navigate(postAuthRoute.name, postAuthRoute.params);
      }
      setPostAuthRoute(null);
    } catch (err) {
      setAuthError(getApiErrorMessage(err));
      setAuthErrorCode(err?.response?.data?.code || '');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (body) => {
    setAuthBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    try {
      const result = await api.register(body);
      if (result?.token) {
        setAuthToken(result.token);
        setCurrentUser(result.user);
        setUser(result.user);
        setAuthOpen(false);
        if (postAuthRoute) {
          if (typeof postAuthRoute === 'string') navigate(postAuthRoute);
          else navigate(postAuthRoute.name, postAuthRoute.params);
        }
        setPostAuthRoute(null);
      } else {
        setAuthError(
          result?.needs_email_verification
            ? 'Check your email to verify your account, then log in.'
            : STRINGS.COMMON.errors.generic
        );
        setAuthErrorCode(result?.needs_email_verification ? 'EMAIL_NOT_VERIFIED' : '');
        setAuthMode('login');
      }
    } catch (err) {
      setAuthError(getApiErrorMessage(err));
      setAuthErrorCode(err?.response?.data?.code || '');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendVerification = async (email) => {
    await api.resendVerification({ email });
  };

  const isAdmin = React.useMemo(() => {
    const set = getAdminEmailSet();
    if (!user?.email) return false;
    if (set.size === 0) return false;
    return set.has(String(user.email).trim().toLowerCase());
  }, [user?.email]);

  return (
    <div style={AppStyle.shell}>
      <Navbar
        user={user}
        onJoin={() => {
          if (route.name === 'quiz') {
            return openAuth('signup', { name: 'quiz', params: { quizId: route.quizId } });
          }
          if (route.name === 'play') {
            return openAuth('signup', {
              name: 'play',
              params: { sessionId: route.sessionId, from: route.from || '' },
            });
          }
          if (route.name === 'duel-play') {
            return openAuth('signup', {
              name: 'duel-play',
              params: { duelId: route.duelId },
            });
          }
          if (route.name === 'friend') {
            return openAuth('signup', {
              name: 'friend',
              params: { friendUserId: route.friendUserId },
            });
          }
          return openAuth('signup', route.name);
        }}
        onLogout={logout}
        onCreateQuiz={() => {
          if (!user) return openAuth('signup', 'create-quiz');
          return navigate('create-quiz');
        }}
        onDiscoverQuizzes={() => navigate('quizzes')}
        onFriends={() => navigate('friends')}
        showAdmin={isAdmin}
        onAdmin={() => navigate('admin')}
        onLeaderboard={() => navigate('leaderboard')}
        onHome={() => navigate('home')}
        onProfile={() => navigate('profile')}
      />

      {route.name === 'create-quiz' ? (
        <CreateQuiz
          user={user}
          onRequireAuth={() => openAuth('login', 'create-quiz')}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'quizzes' ? (
        <DiscoverQuizzes
          user={user}
          onOpenQuiz={(quizId) => navigate('quiz', { quizId })}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'quiz' ? (
        <QuizView
          quizId={route.quizId}
          user={user}
          onRequireAuth={() =>
            openAuth('login', { name: 'quiz', params: { quizId: route.quizId } })
          }
          onBack={() => navigate('quizzes')}
          onEditQuiz={(quizId) => navigate('create-quiz', { quizId })}
          onPlaySession={(sessionId) => navigate('play', { sessionId })}
          onOpenDuel={(duelId) => navigate('duel-play', { duelId })}
        />
      ) : route.name === 'play' ? (
        <PlaySession
          sessionId={route.sessionId}
          user={user}
          variant={route.from === 'story' ? 'story' : 'default'}
          storyLevelNumber={route.from === 'story' ? route.levelNumber : null}
          backLabel={
            route.from === 'story' ? STRINGS.PLAY.backToStory : STRINGS.PLAY.backToQuizzes
          }
          onRequireAuth={() =>
            openAuth('login', {
              name: 'play',
              params: { sessionId: route.sessionId, from: route.from || '' },
            })
          }
          onBack={() => (route.from === 'story' ? navigate('story') : navigate('quizzes'))}
        />
      ) : route.name === 'friends' ? (
        <Friends
          user={user}
          onRequireAuth={() => openAuth('login', 'friends')}
          onNavigateHome={() => navigate('home')}
          onOpenFriend={(friendUserId) => navigate('friend', { friendUserId })}
        />
      ) : route.name === 'friend' ? (
        <Profile
          user={user}
          friendUserId={route.friendUserId}
          onRequireAuth={() =>
            openAuth('login', { name: 'friend', params: { friendUserId: route.friendUserId } })
          }
          onBack={() => navigate('friends')}
          onOpenQuiz={(quizId) => navigate('quiz', { quizId })}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'profile' ? (
        <Profile
          user={user}
          onRequireAuth={() => openAuth('login', 'profile')}
          onNavigateHome={() => navigate('home')}
          onOpenQuiz={(quizId) => navigate('quiz', { quizId })}
          onOpenDuel={(duelId) => navigate('duel-play', { duelId })}
        />
      ) : route.name === 'duel-play' ? (
        <DuelPlay
          user={user}
          duelId={route.duelId}
          onRequireAuth={() =>
            openAuth('login', { name: 'duel-play', params: { duelId: route.duelId } })
          }
          onBack={() => navigate('profile')}
        />
      ) : route.name === 'story' ? (
        <Story
          user={user}
          onRequireAuth={() => openAuth('login', 'story')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId, levelNumber) =>
            navigate('play', { sessionId, from: 'story', level: levelNumber })
          }
        />
      ) : route.name === 'verify-email' ? (
        <VerifyEmail
          token={route.token}
          onOpenLogin={() => openAuth('login', 'home')}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'classic' ? (
        <Classic
          user={user}
          onRequireAuth={() => openAuth('login', 'classic')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId) => navigate('play', { sessionId })}
        />
      ) : route.name === 'blitz' ? (
        <Blitz
          user={user}
          onRequireAuth={() => openAuth('login', 'blitz')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId) => navigate('play', { sessionId })}
        />
      ) : route.name === 'millionaire' ? (
        <Millionaire
          user={user}
          onRequireAuth={() => openAuth('login', 'millionaire')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId) => navigate('play', { sessionId })}
        />
      ) : route.name === 'leaderboard' ? (
        <Leaderboard onNavigateHome={() => navigate('home')} />
      ) : route.name === 'admin' ? (
        <Admin
          user={user}
          onRequireAuth={() => openAuth('login', 'admin')}
          onNavigateHome={() => navigate('home')}
          onNavigateCreateQuiz={() => navigate('create-quiz')}
        />
      ) : (
        <Home
          user={user}
          onRequireAuth={(next) => openAuth('login', next)}
          onNavigateCreateQuiz={() => navigate('create-quiz')}
          onNavigateStory={() => navigate('story')}
          onNavigateClassic={() => navigate('classic')}
          onNavigateBlitz={() => navigate('blitz')}
          onNavigateMillionaire={() => navigate('millionaire')}
        />
      )}

      <Footer />
      <CookieBanner />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onResendVerification={handleResendVerification}
        loading={authBusy}
        error={authError}
        errorCode={authErrorCode}
      />
    </div>
  );
}

export default App;
