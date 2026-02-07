import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import MyPlaysStyle from '@/Styles/ComponentStyles/MyPlaysStyle';
import { getApiErrorMessage } from '@/utils/apiError';

function formatDate(d) {
  if (!d) return STRINGS.COMMON.separators.emDash;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return STRINGS.COMMON.separators.emDash;
  return t.toLocaleDateString();
}

export default function MyPlays({ user, onRequireAuth, onOpenQuiz, onNavigateHome }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [entries, setEntries] = useState([]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api.listMyPlayedQuizzes();
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
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

  const filtered = useMemo(() => {
    const f = String(filter || '').trim().toLowerCase();
    if (!f) return entries;
    return entries.filter((e) => String(e.title || '').toLowerCase().includes(f));
  }, [entries, filter]);

  if (!user) {
    return (
      <div style={MyPlaysStyle.page}>
        <div style={MyPlaysStyle.container}>
          <div className="tv-card" style={MyPlaysStyle.lockCard}>
            <h2 style={MyPlaysStyle.lockTitle}>{STRINGS.MY_PLAYS.locked.title}</h2>
            <p style={MyPlaysStyle.lockText}>{STRINGS.MY_PLAYS.locked.subtitle}</p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={MyPlaysStyle.primaryBtnMain}
              onClick={() => onRequireAuth?.('my-plays')}
            >
              {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={MyPlaysStyle.secondaryBtnWhite}
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
    <div style={MyPlaysStyle.page}>
      <div style={MyPlaysStyle.container}>
        <div style={MyPlaysStyle.hero}>
          <div style={MyPlaysStyle.badge}>
            <span style={MyPlaysStyle.badgeIcon}>{ICONS.common.gamepad}</span>
            <span style={MyPlaysStyle.badgeText}>{STRINGS.MY_PLAYS.badge.text}</span>
            <span style={MyPlaysStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={MyPlaysStyle.title}>
            {STRINGS.MY_PLAYS.titlePrefix}{' '}
            <span style={MyPlaysStyle.titleAccent}>{STRINGS.MY_PLAYS.titleAccent}</span>
          </h1>
          <p style={MyPlaysStyle.subtitle}>{STRINGS.MY_PLAYS.subtitle}</p>
        </div>

        <div className="tv-card" style={MyPlaysStyle.card}>
          <div style={MyPlaysStyle.topRow}>
            <input
              style={MyPlaysStyle.input}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={STRINGS.MY_PLAYS.searchPlaceholder}
              disabled={busy}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={MyPlaysStyle.btnWhite}
              onClick={load}
              disabled={busy}
            >
              {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={MyPlaysStyle.btnPrimary}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
            </button>
          </div>

          {!!error && <div style={MyPlaysStyle.error}>{error}</div>}

          <div style={MyPlaysStyle.list}>
            {filtered.map((e) => (
              <button
                key={e.quiz_id}
                type="button"
                className="tv-card tv-card--hover"
                style={MyPlaysStyle.item}
                disabled={busy}
                onClick={() => onOpenQuiz?.(e.quiz_id)}
              >
                <div style={MyPlaysStyle.itemTop}>
                  <div style={MyPlaysStyle.itemTitle}>{e.title}</div>
                  <div style={MyPlaysStyle.scorePill}>
                    {ICONS.common.medal} {e.best_score}
                  </div>
                </div>
                <div style={MyPlaysStyle.meta}>
                  <span style={MyPlaysStyle.metaItem}>
                    {e.visibility === STRINGS.MY_PLAYS.visibility.private ? (
                      <>
                        {ICONS.common.lock} {STRINGS.MY_PLAYS.visibility.private}
                      </>
                    ) : (
                      <>
                        {ICONS.common.globe} {STRINGS.MY_PLAYS.visibility.public}
                      </>
                    )}
                  </span>
                  <span style={MyPlaysStyle.metaItem}>
                    {ICONS.common.calendar} {formatDate(e.updated_at)}
                  </span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && !busy && (
              <div style={MyPlaysStyle.empty}>
                {STRINGS.MY_PLAYS.empty} {ICONS.common.play}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
