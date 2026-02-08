import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import DuelPlayStyle from '@/Styles/ComponentStyles/DuelPlayStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

function formatMs(ms) {
  const x = Math.max(0, Number(ms) || 0);
  const s = Math.ceil(x / 1000);
  return `${s}s`;
}

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export default function DuelPlay({ user, duelId, onRequireAuth, onBack }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState(null);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const pollRef = useRef(null);

  const load = async () => {
    if (!duelId) return;
    try {
      const res = await api.getDuelState(duelId);
      setState(res);
      setError('');
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    pollRef.current = window.setInterval(load, 700);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user, duelId]);

  const question = state?.question || null;
  const msUntilStart = Number(state?.ms_until_start) || 0;
  const isCompleted = state?.status === 'completed';

  const myUserId = user?.id;
  const myPoints =
    myUserId && state?.challenger_user_id === myUserId
      ? state?.challenger_points ?? 0
      : state?.opponent_points ?? 0;
  const oppPoints =
    myUserId && state?.challenger_user_id === myUserId
      ? state?.opponent_points ?? 0
      : state?.challenger_points ?? 0;

  const progressPct = useMemo(() => {
    const a = Number(question?.question_index);
    const b = Number(question?.total_questions);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
    return clampPct(Math.round((a / b) * 100));
  }, [question?.question_index, question?.total_questions]);

  const myAnswered = useMemo(() => {
    if (!myUserId) return false;
    const list = Array.isArray(question?.answers) ? question.answers : [];
    return list.some((a) => a.user_id === myUserId);
  }, [question?.answers, myUserId]);

  const claim = question?.claim || null;
  const claimText = useMemo(() => {
    if (!claim) return '';
    if (!myUserId) return STRINGS.DUEL_PLAY.pointClaimed;
    return claim.winner_user_id === myUserId
      ? STRINGS.DUEL_PLAY.youWonPoint
      : STRINGS.DUEL_PLAY.opponentWonPoint;
  }, [claim, myUserId]);

  const answer = async (sessionOptionId) => {
    if (!duelId || !sessionOptionId) return;
    if (busy) return;
    if (msUntilStart > 0) return;
    if (isCompleted) return;
    if (myAnswered) return;

    setSelectedOptionId(sessionOptionId);
    setBusy(true);
    setError('');
    try {
      const res = await api.duelAnswer(duelId, { session_option_id: sessionOptionId });
      setState(res);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div style={DuelPlayStyle.page}>
        <div style={DuelPlayStyle.container}>
          <div className="tv-card" style={DuelPlayStyle.errorCard}>
            {STRINGS.DUEL_PLAY.locked}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={DuelPlayStyle.page}>
      <div style={DuelPlayStyle.container}>
        <div style={DuelPlayStyle.topRow}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={DuelPlayStyle.btnWhite}
            onClick={onBack}
            disabled={busy}
          >
            {STRINGS.COMMON.symbols.leftArrow} {STRINGS.COMMON.buttons.back}
          </button>

          <div style={DuelPlayStyle.pills}>
            <div style={DuelPlayStyle.pill}>
              {ICONS.common.trophy} {STRINGS.DUEL_PLAY.pills.score} {myPoints}:{oppPoints}
            </div>
            {question && (
              <div style={DuelPlayStyle.pill}>
                {ICONS.common.dot} {STRINGS.DUEL_PLAY.pills.q}{' '}
                {question.question_index}/{question.total_questions}
              </div>
            )}
            {msUntilStart > 0 && (
              <div style={DuelPlayStyle.pill}>
                {ICONS.common.timer} {STRINGS.DUEL_PLAY.pills.startsIn} {formatMs(msUntilStart)}
              </div>
            )}
            {isCompleted && (
              <div style={DuelPlayStyle.pill}>
                {ICONS.common.finishFlag} {STRINGS.DUEL_PLAY.pills.finished}
              </div>
            )}
          </div>
        </div>

        {!!error && <div style={DuelPlayStyle.errorCard}>{error}</div>}

        <div className="tv-card" style={DuelPlayStyle.card}>
          <h2 style={DuelPlayStyle.qTitle}>{STRINGS.DUEL_PLAY.title(progressPct)}</h2>

          {!question ? (
            <div style={DuelPlayStyle.toast}>
              {msUntilStart > 0 ? STRINGS.DUEL_PLAY.waiting : STRINGS.COMMON.loading}
            </div>
          ) : (
            <>
              <div style={DuelPlayStyle.qText}>{question.question_text}</div>

              <div style={DuelPlayStyle.options}>
                {(question.options || []).map((o) => {
                  const disabled = busy || myAnswered || msUntilStart > 0 || isCompleted;
                  const selected = selectedOptionId === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={DuelPlayStyle.optionBtnState(selected, disabled)}
                      disabled={disabled}
                      onClick={() => answer(o.id)}
                    >
                      <span style={DuelPlayStyle.optionLabel}>{o.label}</span>
                      <span style={DuelPlayStyle.optionText}>{o.text}</span>
                    </button>
                  );
                })}
              </div>

              {!!claimText && (
                <div
                  style={DuelPlayStyle.toastState(claim?.winner_user_id === myUserId)}
                >
                  {ICONS.common.bolt} {claimText}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
