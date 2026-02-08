import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ModeStartStyle from '@/Styles/ComponentStyles/ModeStartStyle';
import MillionaireStyle from '@/Styles/ComponentStyles/MillionaireStyle';
import { getApiErrorMessage } from '@/utils/apiError';

export default function Millionaire({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ladders, setLadders] = useState([]);
  const [ladderId, setLadderId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getMillionaireConfig()
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.ladders) ? data.ladders : [];
        setLadders(rows);
        if (!ladderId && rows[0]?.id) setLadderId(rows[0].id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLadder = useMemo(
    () => ladders.find((l) => l.id === ladderId) || null,
    [ladders, ladderId]
  );

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.startMillionaireSession(
        ladderId ? { ladder_id: ladderId } : {}
      );
      onPlaySession?.(res.session_id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={ModeStartStyle.page}>
      <div style={ModeStartStyle.container}>
        <div style={ModeStartStyle.hero}>
          <div
            style={MillionaireStyle.crown}
            aria-label={STRINGS.MILLIONAIRE.aria.crown}
          >
            {ICONS.common.crown}
          </div>
          <h1 style={ModeStartStyle.title}>{STRINGS.MILLIONAIRE.title}</h1>
          <p style={ModeStartStyle.subtitle}>{STRINGS.MILLIONAIRE.subtitle}</p>
        </div>

        <div className="tv-card" style={ModeStartStyle.card}>
          <div style={MillionaireStyle.cardTopRow}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ModeStartStyle.btn}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.backHome}
            </button>
            <span style={ModeStartStyle.pill}>{STRINGS.MILLIONAIRE.lifelinesEnabled}</span>
          </div>

          {!!error && <div style={ModeStartStyle.error}>{error}</div>}

          <div
            className="tv-card"
            style={MillionaireStyle.rulesCard}
          >
            <h3 style={MillionaireStyle.rulesTitle}>
              {STRINGS.MILLIONAIRE.rulesTitle}
            </h3>

            <div style={MillionaireStyle.rulesList}>
              {STRINGS.MILLIONAIRE.rules.map((t) => (
                <div
                  key={t}
                  style={MillionaireStyle.ruleRow}
                >
                  <span style={MillionaireStyle.ruleTick}>
                    {ICONS.common.tick}
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {ladders.length > 0 ? (
              <div style={MillionaireStyle.ladderToggleWrap}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={MillionaireStyle.ladderToggleBtn}
                  onClick={() => setShowAdvanced((v) => !v)}
                  disabled={busy}
                >
                  {showAdvanced
                    ? STRINGS.MILLIONAIRE.ladder.toggleHide
                    : STRINGS.MILLIONAIRE.ladder.toggleShow}
                </button>

                {showAdvanced && (
                  <div style={ModeStartStyle.field}>
                    <span style={MillionaireStyle.ladderLabel}>
                      {STRINGS.MILLIONAIRE.ladder.configLabel}
                    </span>
                    <select
                      style={MillionaireStyle.ladderSelect}
                      value={ladderId}
                      onChange={(e) => setLadderId(e.target.value)}
                      disabled={busy}
                    >
                      {ladders.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <div style={MillionaireStyle.ladderCurrent}>
                      {STRINGS.MILLIONAIRE.ladder.currentPrefix}{' '}
                      {selectedLadder?.name || STRINGS.MILLIONAIRE.ladder.defaultName}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div style={MillionaireStyle.actions}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={MillionaireStyle.startBtn}
              onClick={start}
              disabled={busy}
            >
              {STRINGS.MILLIONAIRE.buttons.startGame}
            </button>

            {!user ? (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={MillionaireStyle.secondaryBtn}
                onClick={() => onRequireAuth?.('millionaire')}
                disabled={busy}
              >
                Login to save progress
              </button>
            ) : (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={MillionaireStyle.secondaryBtn}
                onClick={onNavigateHome}
                disabled={busy}
              >
                {STRINGS.COMMON.backHome}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
