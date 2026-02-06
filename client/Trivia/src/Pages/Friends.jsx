import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import FriendsStyle from '../Styles/ComponentStyles/FriendsStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function formatDate(d) {
  if (!d) return '—';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleDateString();
}

export default function Friends({ user, onRequireAuth, onNavigateHome, onOpenFriend }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');

  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const [friendsRes, reqRes] = await Promise.all([
        api.listFriends(),
        api.listFriendRequests(),
      ]);
      setFriends(Array.isArray(friendsRes?.friends) ? friendsRes.friends : []);
      setIncoming(Array.isArray(reqRes?.incoming) ? reqRes.incoming : []);
      setOutgoing(Array.isArray(reqRes?.outgoing) ? reqRes.outgoing : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  const normalizedUsername = useMemo(() => String(username || '').trim(), [username]);

  const send = async () => {
    const u = normalizedUsername;
    if (!u) return;
    setBusy(true);
    setError('');
    try {
      await api.sendFriendRequest({ username: u });
      setUsername('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const accept = async (requestId) => {
    setBusy(true);
    setError('');
    try {
      await api.acceptFriendRequest(requestId);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const decline = async (requestId) => {
    setBusy(true);
    setError('');
    try {
      await api.declineFriendRequest(requestId);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (requestId) => {
    setBusy(true);
    setError('');
    try {
      await api.cancelFriendRequest(requestId);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div style={FriendsStyle.page}>
        <div style={FriendsStyle.container}>
          <div className="tv-card" style={FriendsStyle.lockCard}>
            <h2 style={FriendsStyle.lockTitle}>Login to add friends</h2>
            <p style={FriendsStyle.lockText}>
              Add friends, share private quizzes automatically, and compare stats.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...FriendsStyle.primaryBtn, background: colors.gradients.main }}
              onClick={() => onRequireAuth?.('friends')}
            >
              Join / Login 🚀
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...FriendsStyle.secondaryBtn, background: colors.neutral.white }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={FriendsStyle.page}>
      <div style={FriendsStyle.container}>
        <div style={FriendsStyle.hero}>
          <div style={FriendsStyle.badge}>
            <span style={FriendsStyle.badgeIcon}>🤝</span>
            <span style={FriendsStyle.badgeText}>Friends</span>
            <span style={FriendsStyle.badgeDot}>✨</span>
          </div>
          <h1 style={FriendsStyle.title}>
            Build your <span style={FriendsStyle.titleAccent}>crew</span>
          </h1>
          <p style={FriendsStyle.subtitle}>
            Private quizzes become shareable to your friends automatically. Also peek at their best
            custom quiz scores.
          </p>
        </div>

        <div className="tv-card" style={FriendsStyle.card}>
          <div style={FriendsStyle.row}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...FriendsStyle.btn, background: colors.neutral.white }}
              onClick={load}
              disabled={busy}
            >
              Refresh ↻
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{
                ...FriendsStyle.btn,
                background: colors.gradients.main,
                color: colors.neutral.white,
                border: 'none',
              }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>

          {!!error && <div style={FriendsStyle.error}>{error}</div>}

          <div style={{ marginTop: 14, ...FriendsStyle.grid }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={FriendsStyle.section}>
                <h3 style={FriendsStyle.sectionTitle}>Add a friend</h3>
                <div style={FriendsStyle.sectionSub}>
                  Type a username and send a request.
                </div>
                <div style={FriendsStyle.row}>
                  <input
                    style={FriendsStyle.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username…"
                    disabled={busy}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') send();
                    }}
                  />
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{
                      ...FriendsStyle.btn,
                      background: colors.gradients.main,
                      color: colors.neutral.white,
                      border: 'none',
                    }}
                    onClick={send}
                    disabled={busy || !normalizedUsername}
                  >
                    Send 📨
                  </button>
                </div>
                <div style={FriendsStyle.hint}>
                  Tip: if they already requested you, sending will auto-accept.
                </div>
              </div>

              <div style={FriendsStyle.section}>
                <h3 style={FriendsStyle.sectionTitle}>Requests</h3>
                <div style={FriendsStyle.sectionSub}>Incoming and outgoing requests.</div>

                <div style={FriendsStyle.subTitle}>Incoming</div>
                <div style={FriendsStyle.list}>
                  {incoming.map((r) => (
                    <div key={r.request_id} className="tv-card" style={FriendsStyle.listItem}>
                      <div style={FriendsStyle.itemTop}>
                        <div style={FriendsStyle.itemName}>
                          {r.user?.username || 'Unknown'}
                        </div>
                        <div style={FriendsStyle.actions}>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={{
                              ...FriendsStyle.miniBtn,
                              background: colors.gradients.main,
                              color: colors.neutral.white,
                              border: 'none',
                            }}
                            disabled={busy}
                            onClick={() => accept(r.request_id)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={FriendsStyle.miniBtn}
                            disabled={busy}
                            onClick={() => decline(r.request_id)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                      <div style={FriendsStyle.small}>Sent {formatDate(r.created_at)}</div>
                    </div>
                  ))}
                  {incoming.length === 0 && (
                    <div style={FriendsStyle.small}>No incoming requests.</div>
                  )}
                </div>

                <div style={FriendsStyle.subTitle}>Outgoing</div>
                <div style={FriendsStyle.list}>
                  {outgoing.map((r) => (
                    <div key={r.request_id} className="tv-card" style={FriendsStyle.listItem}>
                      <div style={FriendsStyle.itemTop}>
                        <div style={FriendsStyle.itemName}>
                          {r.user?.username || 'Unknown'}
                        </div>
                        <div style={FriendsStyle.actions}>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={FriendsStyle.miniBtn}
                            disabled={busy}
                            onClick={() => cancel(r.request_id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div style={FriendsStyle.small}>Sent {formatDate(r.created_at)}</div>
                    </div>
                  ))}
                  {outgoing.length === 0 && (
                    <div style={FriendsStyle.small}>No outgoing requests.</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={FriendsStyle.section}>
                <h3 style={FriendsStyle.sectionTitle}>Your friends</h3>
                <div style={FriendsStyle.sectionSub}>
                  Click a friend to open their profile.
                </div>

                <div style={FriendsStyle.list}>
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={FriendsStyle.listItem}
                      disabled={busy}
                      onClick={() => onOpenFriend?.(f.id)}
                    >
                      <div style={FriendsStyle.itemTop}>
                        <div style={FriendsStyle.itemName}>{f.username || 'Friend'}</div>
                        <div style={FriendsStyle.small}>Open →</div>
                      </div>
                    </button>
                  ))}
                  {friends.length === 0 && (
                    <div style={FriendsStyle.small}>No friends yet. Add someone!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
