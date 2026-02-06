import React from 'react';
import './App.css';
import Home from './Pages/Home';
import CreateQuiz from './Pages/CreateQuiz';
import DiscoverQuizzes from './Pages/DiscoverQuizzes';
import QuizView from './Pages/QuizView';
import PlaySession from './Pages/PlaySession';
import MyPlays from './Pages/MyPlays';
import Friends from './Pages/Friends';
import FriendProfile from './Pages/FriendProfile';
import Navbar from './shared/layout/Navbar';
import Footer from './shared/layout/Footer';
import AuthModal from './Components/Auth/AuthModal';
import colors from './constants/colors';
import {
  api,
  clearAuthToken,
  clearCurrentUser,
  getCurrentUser,
  setAuthToken,
  setCurrentUser,
} from './api';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function getRoute() {
  const hash = String(window.location.hash || '').replace(/^#/, '') || '/';
  const [rawPath] = hash.split('?');
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'create-quiz') return { name: 'create-quiz' };
  if (parts[0] === 'play' && parts[1]) return { name: 'play', sessionId: parts[1] };
  if (parts[0] === 'quizzes' && parts[1]) return { name: 'quiz', quizId: parts[1] };
  if (parts[0] === 'quizzes') return { name: 'quizzes' };
  if (parts[0] === 'my-plays') return { name: 'my-plays' };
  if (parts[0] === 'friends' && parts[1]) return { name: 'friend', friendUserId: parts[1] };
  if (parts[0] === 'friends') return { name: 'friends' };
  return { name: 'home' };
}

function navigate(route, params = {}) {
  if (route === 'create-quiz') {
    const q = params.quizId ? `?quizId=${encodeURIComponent(params.quizId)}` : '';
    window.location.hash = `#/create-quiz${q}`;
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
    window.location.hash = `#/play/${encodeURIComponent(params.sessionId)}`;
    return;
  }
  if (route === 'my-plays') {
    window.location.hash = '#/my-plays';
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
  window.location.hash = '#/';
}

function App() {
  const [route, setRoute] = React.useState(getRoute);

  const [user, setUser] = React.useState(() => getCurrentUser());
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signup');
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [postAuthRoute, setPostAuthRoute] = React.useState(null);

  React.useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openAuth = (mode = 'signup', nextRoute = null) => {
    setAuthError('');
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
      if (postAuthRoute) {
        if (typeof postAuthRoute === 'string') navigate(postAuthRoute);
        else navigate(postAuthRoute.name, postAuthRoute.params);
      }
      setPostAuthRoute(null);
    } catch (err) {
      setAuthError(getApiErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.neutral.white }}>
      <Navbar
        user={user}
        onJoin={() => {
          if (route.name === 'quiz') {
            return openAuth('signup', { name: 'quiz', params: { quizId: route.quizId } });
          }
          if (route.name === 'play') {
            return openAuth('signup', {
              name: 'play',
              params: { sessionId: route.sessionId },
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
        onMyPlays={() => navigate('my-plays')}
        onFriends={() => navigate('friends')}
        onLeaderboard={() => window.alert('Leaderboard page coming soon!')}
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
        />
      ) : route.name === 'play' ? (
        <PlaySession
          sessionId={route.sessionId}
          user={user}
          onRequireAuth={() =>
            openAuth('login', { name: 'play', params: { sessionId: route.sessionId } })
          }
          onBack={() => navigate('quizzes')}
        />
      ) : route.name === 'my-plays' ? (
        <MyPlays
          user={user}
          onRequireAuth={() => openAuth('login', 'my-plays')}
          onOpenQuiz={(quizId) => navigate('quiz', { quizId })}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'friends' ? (
        <Friends
          user={user}
          onRequireAuth={() => openAuth('login', 'friends')}
          onNavigateHome={() => navigate('home')}
          onOpenFriend={(friendUserId) => navigate('friend', { friendUserId })}
        />
      ) : route.name === 'friend' ? (
        <FriendProfile
          user={user}
          friendUserId={route.friendUserId}
          onRequireAuth={() =>
            openAuth('login', { name: 'friend', params: { friendUserId: route.friendUserId } })
          }
          onBack={() => navigate('friends')}
          onOpenQuiz={(quizId) => navigate('quiz', { quizId })}
          onNavigateHome={() => navigate('home')}
        />
      ) : (
        <Home
          user={user}
          onRequireAuth={(next) => openAuth('login', next)}
          onNavigateCreateQuiz={() => navigate('create-quiz')}
        />
      )}

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

export default App;
