import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import FriendsStyle from '@/Styles/ComponentStyles/FriendsStyle';
import { getApiErrorMessage } from '@/utils/apiError';

function formatDate(d) {
  if (!d) return STRINGS.COMMON.separators.emDash;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return STRINGS.COMMON.separators.emDash;
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
            <h2 style={FriendsStyle.lockTitle}>{STRINGS.FRIENDS.locked.title}</h2>
            <p style={FriendsStyle.lockText}>{STRINGS.FRIENDS.locked.subtitle}</p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendsStyle.primaryBtnMain}
              onClick={() => onRequireAuth?.('friends')}
            >
              {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendsStyle.secondaryBtnWhite}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
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
            <span style={FriendsStyle.badgeIcon}>{ICONS.common.handshake}</span>
            <span style={FriendsStyle.badgeText}>{STRINGS.FRIENDS.badge.text}</span>
            <span style={FriendsStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={FriendsStyle.title}>
            {STRINGS.FRIENDS.titlePrefix}{' '}
            <span style={FriendsStyle.titleAccent}>{STRINGS.FRIENDS.titleAccent}</span>
          </h1>
          <p style={FriendsStyle.subtitle}>{STRINGS.FRIENDS.subtitle}</p>
        </div>

        <div className="tv-card" style={FriendsStyle.card}>
          <div style={FriendsStyle.row}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendsStyle.btnWhite}
              onClick={load}
              disabled={busy}
            >
              {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendsStyle.btnPrimary}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
            </button>
          </div>

          {!!error && <div style={FriendsStyle.error}>{error}</div>}

          <div style={FriendsStyle.gridMt14}>
            <div style={FriendsStyle.sideCol}>
              <div style={FriendsStyle.section}>
                <h3 style={FriendsStyle.sectionTitle}>{STRINGS.FRIENDS.add.title}</h3>
                <div style={FriendsStyle.sectionSub}>{STRINGS.FRIENDS.add.subtitle}</div>
                <div style={FriendsStyle.row}>
                  <input
                    style={FriendsStyle.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={STRINGS.FRIENDS.add.placeholder}
                    disabled={busy}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') send();
                    }}
                  />
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={FriendsStyle.btnPrimary}
                    onClick={send}
                    disabled={busy || !normalizedUsername}
                  >
                    {STRINGS.FRIENDS.buttons.send} {ICONS.common.mail}
                  </button>
                </div>
                <div style={FriendsStyle.hint}>{STRINGS.FRIENDS.add.tip}</div>
              </div>

              <div style={FriendsStyle.section}>
                <h3 style={FriendsStyle.sectionTitle}>{STRINGS.FRIENDS.requests.title}</h3>
                <div style={FriendsStyle.sectionSub}>{STRINGS.FRIENDS.requests.subtitle}</div>

                <div style={FriendsStyle.subTitle}>{STRINGS.FRIENDS.requests.incoming}</div>
                <div style={FriendsStyle.list}>
                  {incoming.map((r) => (
                    <div key={r.request_id} className="tv-card" style={FriendsStyle.listItem}>
                      <div style={FriendsStyle.itemTop}>
                        <div style={FriendsStyle.itemName}>
                          {r.user?.username || STRINGS.FRIENDS.list.unknown}
                        </div>
                        <div style={FriendsStyle.actions}>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={FriendsStyle.miniBtnPrimary}
                            disabled={busy}
                            onClick={() => accept(r.request_id)}
                          >
                            {STRINGS.FRIENDS.buttons.accept}
                          </button>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={FriendsStyle.miniBtn}
                            disabled={busy}
                            onClick={() => decline(r.request_id)}
                          >
                            {STRINGS.FRIENDS.buttons.decline}
                          </button>
                        </div>
                      </div>
                      <div style={FriendsStyle.small}>
                        {STRINGS.FRIENDS.requests.sentPrefix} {formatDate(r.created_at)}
                      </div>
                    </div>
                  ))}
                  {incoming.length === 0 && (
                    <div style={FriendsStyle.small}>{STRINGS.FRIENDS.requests.noneIncoming}</div>
                  )}
                </div>

                <div style={FriendsStyle.subTitle}>{STRINGS.FRIENDS.requests.outgoing}</div>
                <div style={FriendsStyle.list}>
                  {outgoing.map((r) => (
                    <div key={r.request_id} className="tv-card" style={FriendsStyle.listItem}>
                      <div style={FriendsStyle.itemTop}>
                        <div style={FriendsStyle.itemName}>
                          {r.user?.username || STRINGS.FRIENDS.list.unknown}
                        </div>
                        <div style={FriendsStyle.actions}>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={FriendsStyle.miniBtn}
                            disabled={busy}
                            onClick={() => cancel(r.request_id)}
                          >
                            {STRINGS.FRIENDS.buttons.cancel}
                          </button>
                        </div>
                      </div>
                      <div style={FriendsStyle.small}>
                        {STRINGS.FRIENDS.requests.sentPrefix} {formatDate(r.created_at)}
                      </div>
                    </div>
                  ))}
                  {outgoing.length === 0 && (
                    <div style={FriendsStyle.small}>{STRINGS.FRIENDS.requests.noneOutgoing}</div>
                  )}
                </div>
              </div>
            </div>

            <div style={FriendsStyle.sideCol}>
              <div style={FriendsStyle.section}>
                <h3 style={FriendsStyle.sectionTitle}>{STRINGS.FRIENDS.list.title}</h3>
                <div style={FriendsStyle.sectionSub}>{STRINGS.FRIENDS.list.subtitle}</div>

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
                        <div style={FriendsStyle.itemName}>
                          {f.username || STRINGS.FRIENDS.list.friendFallback}
                        </div>
                        <div style={FriendsStyle.small}>{STRINGS.FRIENDS.list.openHint}</div>
                      </div>
                    </button>
                  ))}
                  {friends.length === 0 && (
                    <div style={FriendsStyle.small}>{STRINGS.FRIENDS.list.none}</div>
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
