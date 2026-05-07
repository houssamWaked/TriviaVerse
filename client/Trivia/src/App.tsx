import React from 'react';
import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import './App.css';
import ClientRealtimeSync from './api/ClientRealtimeSync';
import { subscribeRealtimeEvent } from './api/realtimeEvents';
import HomePage from './Pages/Home';
import CreateQuizPage from './Pages/CreateQuiz';
import DiscoverQuizzesPage from './Pages/DiscoverQuizzes';
import QuizViewPage from './Pages/QuizView';
import PlaySessionPage from './Pages/PlaySession';
import FriendsPage from './Pages/Friends';
import ProfilePage from './Pages/Profile';
import DuelPlayPage from './Pages/DuelPlay';
import StoryPage from './Pages/Story';
import ClassicPage from './Pages/Classic';
import BlitzPage from './Pages/Blitz';
import MillionairePage from './Pages/Millionaire';
import LeaderboardPage from './Pages/Leaderboard';
import AdminPage from './Pages/Admin';
import VerifyEmailPage from './Pages/VerifyEmail';
import NavbarLayout from './shared/layout/Navbar';
import FooterLayout from './shared/layout/Footer';
import CookieBannerLayout from './shared/layout/CookieBanner';
import AuthModalComponent from '@/features/Auth/components/AuthModal';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { essentialCacheClearByPrefix } from '@/utils/webCache';
import { useAuth } from '@/store/hooks/useAuth';
import {
  api,
  clearAuthToken,
  getCurrentUser,
  getAuthToken,
  setAuthToken,
} from './api';
import type { StoredUser } from './api/userStore';

const Home = HomePage as any;
const CreateQuiz = CreateQuizPage as any;
const DiscoverQuizzes = DiscoverQuizzesPage as any;
const QuizView = QuizViewPage as any;
const PlaySession = PlaySessionPage as any;
const Friends = FriendsPage as any;
const Profile = ProfilePage as any;
const DuelPlay = DuelPlayPage as any;
const Story = StoryPage as any;
const Classic = ClassicPage as any;
const Blitz = BlitzPage as any;
const Millionaire = MillionairePage as any;
const Leaderboard = LeaderboardPage as any;
const Admin = AdminPage as any;
const VerifyEmail = VerifyEmailPage as any;
const Navbar = NavbarLayout as any;
const Footer = FooterLayout as any;
const CookieBanner = CookieBannerLayout as any;
const AuthModal = AuthModalComponent as any;
const strings = STRINGS as any;
const icons = ICONS as any;

type RouteName =
  | 'home'
  | 'create-quiz'
  | 'admin'
  | 'classic'
  | 'blitz'
  | 'millionaire'
  | 'leaderboard'
  | 'play'
  | 'quiz'
  | 'quizzes'
  | 'friend'
  | 'friends'
  | 'profile'
  | 'duel-play'
  | 'story'
  | 'verify-email';

type Route =
  | { name: 'home' }
  | { name: 'create-quiz' }
  | { name: 'admin' }
  | { name: 'classic' }
  | { name: 'blitz' }
  | { name: 'millionaire' }
  | { name: 'leaderboard' }
  | {
      name: 'play';
      sessionId: string;
      from: string;
      categoryId: string;
      levelNumber: number | null;
    }
  | { name: 'quiz'; quizId: string }
  | { name: 'quizzes' }
  | { name: 'friend'; friendUserId: string }
  | { name: 'friends' }
  | { name: 'profile' }
  | { name: 'duel-play'; duelId: string }
  | { name: 'story' }
  | { name: 'verify-email'; token: string };

type NavigateParams = {
  quizId?: string;
  sessionId?: string;
  from?: string;
  category?: string;
  level?: number | null;
  friendUserId?: string;
  duelId?: string;
};

type PostAuthRoute =
  | string
  | {
      name: RouteName;
      params?: NavigateParams;
    }
  | null;

type DuelToast = {
  count: number;
  challengerName: string;
  quizTitle: string;
} | null;

type AuthResult = {
  token?: string;
  user?: StoredUser;
  needs_email_verification?: boolean;
  email_delivery?: { ok?: boolean };
};

type DuelEntry = {
  id?: string | number;
  status?: string;
  challenger_user_id?: string;
  opponent_user_id?: string;
  created_at?: string | null;
  challenger_user?: { username?: string };
  quiz?: { title?: string };
};

type AuthErrorDetails = Array<{ message?: string }> | null;

/**
 * Parse the current hash URL into a typed route object.
 * @returns Current route representation used by the app.
 */
function getRoute(): Route {
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
      categoryId: query.get('category') || '',
      levelNumber: query.get('level') ? Number(query.get('level')) : null,
    };
  }
  if (parts[0] === 'quizzes' && parts[1])
    return { name: 'quiz', quizId: parts[1] };
  if (parts[0] === 'quizzes') return { name: 'quizzes' };
  if (parts[0] === 'friends' && parts[1])
    return { name: 'friend', friendUserId: parts[1] };
  if (parts[0] === 'friends') return { name: 'friends' };
  if (parts[0] === 'profile') return { name: 'profile' };
  if (parts[0] === 'duels' && parts[1] && parts[2] === 'play') {
    return { name: 'duel-play', duelId: parts[1] };
  }
  if (parts[0] === 'story') return { name: 'story' };
  if (parts[0] === 'verify-email') {
    return { name: 'verify-email', token: query.get('token') || '' };
  }
  return { name: 'home' };
}

/**
 * Navigate by updating the hash route (client-side routing).
 * @param route Target route name.
 * @param params Route params used to build the hash and query string.
 * @returns Void.
 */
function navigate(
  route: RouteName | 'friend' | 'quiz' | 'play' | 'duel-play',
  params: NavigateParams = {}
) {
  if (route === 'create-quiz') {
    const query = params.quizId
      ? `?quizId=${encodeURIComponent(params.quizId)}`
      : '';
    window.location.hash = `#/create-quiz${query}`;
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
  if (route === 'quiz' && params.quizId) {
    window.location.hash = `#/quizzes/${encodeURIComponent(params.quizId)}`;
    return;
  }
  if (route === 'play' && params.sessionId) {
    const query = new URLSearchParams();
    if (params.from) query.set('from', String(params.from));
    if (params.category) query.set('category', String(params.category));
    if (params.level != null) query.set('level', String(params.level));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    window.location.hash = `#/play/${encodeURIComponent(params.sessionId)}${suffix}`;
    return;
  }
  if (route === 'friends') {
    window.location.hash = '#/friends';
    return;
  }
  if (route === 'friend' && params.friendUserId) {
    window.location.hash = `#/friends/${encodeURIComponent(params.friendUserId)}`;
    return;
  }
  if (route === 'profile') {
    window.location.hash = '#/profile';
    return;
  }
  if (route === 'duel-play' && params.duelId) {
    window.location.hash = `#/duels/${encodeURIComponent(params.duelId)}/play`;
    return;
  }
  if (route === 'story') {
    window.location.hash = '#/story';
    return;
  }
  window.location.hash = '#/';
}

/**
 * Build the configured set of admin emails from env.
 * @returns Set of lowercased admin email strings.
 */
function getAdminEmailSet() {
  const raw =
    import.meta.env.VITE_ADMIN_EMAILS ||
    import.meta.env.VITE_ADMIN_EMAIL ||
    'wakedhusam1@gmail.com';
  return new Set(
    String(raw)
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Sort duel entries by newest created-at first.
 * @param entries Duel entries list.
 * @returns New sorted array.
 */
function sortDuelsNewestFirst(entries: DuelEntry[]) {
  return [...entries].sort((left, right) => {
    const leftTs = left?.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTs = right?.created_at
      ? new Date(right.created_at).getTime()
      : 0;
    return rightTs - leftTs;
  });
}

/**
 * Insert or update a duel entry by id, keeping newest-first sorting.
 * @param entries Existing duel entries.
 * @param nextEntry Duel entry to insert/update.
 * @returns Updated entries array.
 */
function upsertDuelEntry(entries: DuelEntry[], nextEntry: DuelEntry) {
  const duelId = String(nextEntry?.id || '').trim();
  if (!duelId) return entries;

  const index = entries.findIndex(
    (entry) => String(entry?.id || '') === duelId
  );
  if (index < 0) {
    return sortDuelsNewestFirst([nextEntry, ...entries]);
  }

  const next = [...entries];
  next[index] = {
    ...next[index],
    ...nextEntry,
  };
  return sortDuelsNewestFirst(next);
}

/**
 * Root application component (hash-based routing + auth/session bootstrap + realtime sync).
 * @returns App layout and the current page.
 */
function App() {
  const { user, signIn } = useAuth();
  const setUser = React.useCallback(
    (nextUser: StoredUser) => {
      signIn(nextUser);
    },
    [signIn]
  );
  const [route, setRoute] = React.useState<Route>(getRoute);
  const [duelEntries, setDuelEntries] = React.useState<DuelEntry[]>([]);
  const [pendingDuelCount, setPendingDuelCount] = React.useState(0);
  const [duelToast, setDuelToast] = React.useState<DuelToast>(null);
  const pendingDuelIdsRef = React.useRef<Set<string>>(new Set());
  const duelToastTimerRef = React.useRef<number | null>(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signup' | 'login'>('signup');
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [authErrorCode, setAuthErrorCode] = React.useState('');
  const [authErrorDetails, setAuthErrorDetails] =
    React.useState<AuthErrorDetails>(null);
  const [postAuthRoute, setPostAuthRoute] = React.useState<PostAuthRoute>(null);

  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search || '');
    const token = search.get('verify_email_token');
    if (token) {
      window.location.hash = `#/verify-email?token=${encodeURIComponent(token)}`;
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.hash
      );
      setRoute(getRoute());
      return;
    }

    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const existingUser = getCurrentUser();
      const existingToken = getAuthToken();
      if (!existingUser || existingToken) return;

      try {
        const result = (await api.refreshSession()) as AuthResult;
        if (cancelled) return;

        if (result?.token) setAuthToken(result.token);
        if (result?.user) {
          setUser(result.user);
        }
      } catch {
        if (cancelled) return;
      }
    }

    void bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    pendingDuelIdsRef.current = new Set();
    setPendingDuelCount(0);
    setDuelToast(null);
    setDuelEntries([]);
    if (!user?.id) return undefined;

    let cancelled = false;

    async function loadDuels() {
      try {
        const result = (await api.listDuelsFresh()) as {
          entries?: DuelEntry[];
        };
        if (cancelled) return;
        const entries = Array.isArray(result?.entries) ? result.entries : [];
        setDuelEntries(sortDuelsNewestFirst(entries));
      } catch (error) {
        if (cancelled) return;
        if (isUnauthorized(error)) {
          clearAuthToken();
          setUser(null);
        }
      }
    }

    const handleDuelChanged = (payload: { duel?: DuelEntry | null }) => {
      const nextEntry = payload?.duel;
      if (!nextEntry?.id) return;
      setDuelEntries((previous) => upsertDuelEntry(previous, nextEntry));
    };

    const handleConnected = () => {
      void loadDuels();
    };

    void loadDuels();
    const offDuelChanged = subscribeRealtimeEvent(
      'duel:changed',
      handleDuelChanged
    );
    const offConnected = subscribeRealtimeEvent(
      'socket:connected',
      handleConnected
    );

    return () => {
      cancelled = true;
      offDuelChanged();
      offConnected();
    };
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) return;

    const pending = duelEntries.filter(
      (entry) =>
        entry?.status === 'pending' && entry?.opponent_user_id === user.id
    );
    const nextIds = new Set(
      pending.map((entry) => String(entry?.id || '')).filter(Boolean)
    );
    const prevIds = pendingDuelIdsRef.current;
    const newlyArrived = pending.filter(
      (entry) => entry?.id && !prevIds.has(String(entry.id))
    );

    pendingDuelIdsRef.current = nextIds;
    setPendingDuelCount(nextIds.size);

    if (newlyArrived.length > 0) {
      const first = newlyArrived[0];
      const challengerName =
        first?.challenger_user?.username || strings.COMMON.playerFallback;
      const quizTitle = first?.quiz?.title || '';
      setDuelToast({
        count: newlyArrived.length,
        challengerName,
        quizTitle,
      });
    }
  }, [duelEntries, user?.id]);

  React.useEffect(() => {
    if (!duelToast) return undefined;
    if (duelToastTimerRef.current)
      window.clearTimeout(duelToastTimerRef.current);
    duelToastTimerRef.current = window.setTimeout(() => {
      setDuelToast(null);
    }, 8000);
    return () => {
      if (duelToastTimerRef.current)
        window.clearTimeout(duelToastTimerRef.current);
      duelToastTimerRef.current = null;
    };
  }, [duelToast]);

  const openAuth = (
    mode: 'signup' | 'login' = 'signup',
    nextRoute: PostAuthRoute = null
  ) => {
    setAuthError('');
    setAuthErrorCode('');
    setAuthErrorDetails(null);
    setAuthMode(mode);
    setPostAuthRoute(nextRoute);
    setAuthOpen(true);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    essentialCacheClearByPrefix('user:');
    clearAuthToken();
    setUser(null);
  };

  const navigateAfterAuth = (nextRoute: PostAuthRoute) => {
    if (!nextRoute) return;
    if (typeof nextRoute === 'string') {
      navigate(nextRoute as RouteName);
      return;
    }
    navigate(nextRoute.name, nextRoute.params);
  };

  const extractAuthErrorDetails = (error: any): AuthErrorDetails =>
    error?.response?.data?.details?.errors ||
    error?.response?.data?.errors ||
    null;

  const handleLogin = async (body: unknown) => {
    setAuthBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    setAuthErrorDetails(null);
    try {
      const result = (await api.login(body)) as AuthResult;
      essentialCacheClearByPrefix('user:');
      if (result.token) setAuthToken(result.token);
      if (result.user) {
        setUser(result.user);
      }
      setAuthOpen(false);
      navigateAfterAuth(postAuthRoute);
      setPostAuthRoute(null);
    } catch (error: any) {
      setAuthError(getApiErrorMessage(error));
      setAuthErrorCode(error?.response?.data?.code || '');
      setAuthErrorDetails(extractAuthErrorDetails(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (body: unknown) => {
    setAuthBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    setAuthErrorDetails(null);
    try {
      const result = (await api.register(body)) as AuthResult;
      if (result?.token) {
        essentialCacheClearByPrefix('user:');
        setAuthToken(result.token);
        if (result.user) {
          setUser(result.user);
        }
        setAuthOpen(false);
        navigateAfterAuth(postAuthRoute);
        setPostAuthRoute(null);
      } else {
        const deliveryFailed = result?.email_delivery?.ok === false;
        setAuthError(
          result?.needs_email_verification
            ? deliveryFailed
              ? 'Account created, but verification email could not be sent right now. Please press “Resend verification email”, then log in.'
              : 'Check your email to verify your account, then log in.'
            : strings.COMMON.errors.generic
        );
        setAuthErrorCode(
          result?.needs_email_verification ? 'EMAIL_NOT_VERIFIED' : ''
        );
        setAuthErrorDetails(null);
        setAuthMode('login');
      }
    } catch (error: any) {
      setAuthError(getApiErrorMessage(error));
      setAuthErrorCode(error?.response?.data?.code || '');
      setAuthErrorDetails(extractAuthErrorDetails(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleAuth = async (idToken: string) => {
    setAuthBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    setAuthErrorDetails(null);
    try {
      const result = (await api.googleAuth({
        id_token: idToken,
      })) as AuthResult;
      essentialCacheClearByPrefix('user:');
      if (result.token) setAuthToken(result.token);
      if (result.user) {
        setUser(result.user);
      }
      setAuthOpen(false);
      navigateAfterAuth(postAuthRoute);
      setPostAuthRoute(null);
    } catch (error: any) {
      setAuthError(getApiErrorMessage(error));
      setAuthErrorCode(error?.response?.data?.code || '');
      setAuthErrorDetails(extractAuthErrorDetails(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendVerification = async (email: string) => {
    await api.resendVerification({ email });
  };

  const isAdmin = React.useMemo(() => {
    const set = getAdminEmailSet();
    if (!user?.email) return false;
    if (set.size === 0) return false;
    return set.has(String(user.email).trim().toLowerCase());
  }, [user?.email]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <ClientRealtimeSync enabled={Boolean(user?.id)} />

      <Navbar
        user={user}
        duelNotifCount={pendingDuelCount}
        onJoin={() => {
          if (route.name === 'quiz') {
            return openAuth('signup', {
              name: 'quiz',
              params: { quizId: route.quizId },
            });
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

      {!!duelToast && user && (
        <Snackbar
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          onClose={() => setDuelToast(null)}
        >
          <Alert
            severity="info"
            variant="filled"
            sx={{
              width: '100%',
              minWidth: { sm: 380 },
              alignItems: 'flex-start',
            }}
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setDuelToast(null);
                    navigate('profile');
                  }}
                >
                  Open
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setDuelToast(null)}
                >
                  Dismiss
                </Button>
              </Stack>
            }
          >
            <Typography sx={{ fontWeight: 800 }}>
              {icons.common.bolt} {strings.DUELS.title}
            </Typography>
            <Typography variant="body2">
              {duelToast.count > 1
                ? `${duelToast.count} new duel requests`
                : `New duel request from ${duelToast.challengerName}`}
              {duelToast.quizTitle ? ` • ${duelToast.quizTitle}` : ''}
            </Typography>
          </Alert>
        </Snackbar>
      )}

      {route.name === 'create-quiz' ? (
        <CreateQuiz
          user={user}
          onRequireAuth={() => openAuth('login', 'create-quiz')}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'quizzes' ? (
        <DiscoverQuizzes
          user={user}
          onOpenQuiz={(quizId: string) => navigate('quiz', { quizId })}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'quiz' ? (
        <QuizView
          quizId={route.quizId}
          user={user}
          onRequireAuth={() =>
            openAuth('login', {
              name: 'quiz',
              params: { quizId: route.quizId },
            })
          }
          onBack={() => navigate('quizzes')}
          onEditQuiz={(quizId: string) => navigate('create-quiz', { quizId })}
          onPlaySession={(sessionId: string) => navigate('play', { sessionId })}
          onOpenDuel={(duelId: string) => navigate('duel-play', { duelId })}
        />
      ) : route.name === 'play' ? (
        <PlaySession
          sessionId={route.sessionId}
          user={user}
          variant={route.from === 'story' ? 'story' : 'default'}
          storyLevelNumber={route.from === 'story' ? route.levelNumber : null}
          classicCategoryId={route.from === 'classic' ? route.categoryId : null}
          classicLevelNumber={
            route.from === 'classic' ? route.levelNumber : null
          }
          backLabel={
            route.from === 'story'
              ? strings.PLAY.backToStory
              : route.from === 'classic'
                ? strings.PLAY.backToClassic
                : strings.PLAY.backToQuizzes
          }
          onRequireAuth={() =>
            openAuth('login', {
              name: 'play',
              params: { sessionId: route.sessionId, from: route.from || '' },
            })
          }
          onNavigateHome={() => navigate('home')}
          onBack={() =>
            route.from === 'story'
              ? navigate('story')
              : route.from === 'classic'
                ? navigate('classic')
                : navigate('quizzes')
          }
        />
      ) : route.name === 'friends' ? (
        <Friends
          user={user}
          onRequireAuth={() => openAuth('login', 'friends')}
          onNavigateHome={() => navigate('home')}
          onOpenFriend={(friendUserId: string) =>
            navigate('friend', { friendUserId })
          }
        />
      ) : route.name === 'friend' ? (
        <Profile
          user={user}
          friendUserId={route.friendUserId}
          onRequireAuth={() =>
            openAuth('login', {
              name: 'friend',
              params: { friendUserId: route.friendUserId },
            })
          }
          onBack={() => navigate('friends')}
          onOpenQuiz={(quizId: string) => navigate('quiz', { quizId })}
          onNavigateHome={() => navigate('home')}
        />
      ) : route.name === 'profile' ? (
        <Profile
          user={user}
          onRequireAuth={() => openAuth('login', 'profile')}
          onNavigateHome={() => navigate('home')}
          onOpenQuiz={(quizId: string) => navigate('quiz', { quizId })}
          onOpenDuel={(duelId: string) => navigate('duel-play', { duelId })}
        />
      ) : route.name === 'duel-play' ? (
        <DuelPlay
          user={user}
          duelId={route.duelId}
          onRequireAuth={() =>
            openAuth('login', {
              name: 'duel-play',
              params: { duelId: route.duelId },
            })
          }
          onBack={() => navigate('profile')}
        />
      ) : route.name === 'story' ? (
        <Story
          user={user}
          onRequireAuth={() => openAuth('login', 'story')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId: string, levelNumber: number) =>
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
          onPlaySession={(
            sessionId: string,
            categoryId: string,
            levelNumber: number | null
          ) =>
            levelNumber != null && categoryId
              ? navigate('play', {
                  sessionId,
                  from: 'classic',
                  category: categoryId,
                  level: levelNumber,
                })
              : navigate('play', { sessionId })
          }
        />
      ) : route.name === 'blitz' ? (
        <Blitz
          user={user}
          onRequireAuth={() => openAuth('login', 'blitz')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId: string) => navigate('play', { sessionId })}
          onOpenDuel={(duelId: string) => navigate('duel-play', { duelId })}
        />
      ) : route.name === 'millionaire' ? (
        <Millionaire
          user={user}
          onRequireAuth={() => openAuth('login', 'millionaire')}
          onNavigateHome={() => navigate('home')}
          onPlaySession={(sessionId: string) => navigate('play', { sessionId })}
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
          onRequireAuth={(next: string) => openAuth('login', next)}
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
        onGoogle={handleGoogleAuth}
        onResendVerification={handleResendVerification}
        loading={authBusy}
        error={authError}
        errorCode={authErrorCode}
        errorDetails={authErrorDetails}
      />
    </Box>
  );
}

export default App;
