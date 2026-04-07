import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import { subscribeRealtimeEvent } from '@/api/realtimeEvents';
import DuelPlayStyle from '@/Styles/ComponentStyles/DuelPlayStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type DuelUser = {
  id?: string;
} | null;

type DuelQuestionOption = {
  id: string;
  label?: string | null;
  text?: string | null;
};

type DuelAnswer = {
  user_id?: string | null;
  session_option_id?: string | null;
  is_correct?: boolean | null;
};

type DuelState = {
  status?: string | null;
  mode?: string | null;
  ms_until_start?: number | null;
  started_at?: string | null;
  challenger_user_id?: string | null;
  opponent_user_id?: string | null;
  challenger_points?: number | null;
  opponent_points?: number | null;
  winner_user_id?: string | null;
  quiz_id?: string | null;
  difficulty?: string | null;
  category_id?: string | null;
  question?: {
    question_index?: number | null;
    total_questions?: number | null;
    question_text?: string | null;
    time_limit_sec?: number | null;
    started_at?: string | null;
    correct_option_id?: string | null;
    options?: DuelQuestionOption[];
    answers?: DuelAnswer[];
    claim?: {
      winner_user_id?: string | null;
    } | null;
  } | null;
};

type DuelPlayProps = {
  user?: DuelUser;
  duelId?: string | null;
  onRequireAuth?: () => void;
  onBack?: () => void;
};

function formatMs(ms: number | string | null | undefined) {
  const x = Math.max(0, Number(ms) || 0);
  const s = Math.ceil(x / 1000);
  return `${s}s`;
}

function clampPct(n: number | string | null | undefined) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export default function DuelPlay({
  user,
  duelId,
  onRequireAuth,
  onBack,
}: DuelPlayProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<DuelState | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const busyRef = useRef(false);
  const lastQuestionIndexRef = useRef<number | null>(null);

  const load = async () => {
    if (!duelId) return;
    try {
      const res = (await api.getDuelState(duelId)) as DuelState;
      setState(res);
      setNowMs(Date.now());
      setError('');
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!user) return;

    const handleDuelState = (payload: { duelId?: string; state?: DuelState | null }) => {
      if (String(payload?.duelId || '') !== String(duelId || '')) return;
      if (busyRef.current) return;
      if (payload?.state) {
        setState(payload.state);
        setNowMs(Date.now());
        setError('');
      }
    };

    const handleConnected = () => {
      void load();
    };

    void load();
    const offState = subscribeRealtimeEvent('duel:state', handleDuelState);
    const offConnected = subscribeRealtimeEvent('socket:connected', handleConnected);

    return () => {
      offState();
      offConnected();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user, duelId]);

  const question = state?.question || null;
  const msUntilStart = useMemo(() => {
    const startedAtMs = state?.started_at ? new Date(state.started_at).getTime() : NaN;
    if (Number.isFinite(startedAtMs)) {
      return Math.max(0, startedAtMs - nowMs);
    }
    return Math.max(0, Number(state?.ms_until_start) || 0);
  }, [nowMs, state?.ms_until_start, state?.started_at]);
  const isCompleted = state?.status === 'completed';
  const duelMode = String(state?.mode || 'custom').trim().toLowerCase();

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

  const headerPct = isCompleted ? 100 : progressPct;

  const myAnswered = useMemo(() => {
    if (!myUserId) return false;
    const list = Array.isArray(question?.answers) ? question.answers : [];
    return list.some((a) => a.user_id === myUserId);
  }, [question?.answers, myUserId]);

  const myAnswer = useMemo(() => {
    if (!myUserId) return null;
    const list = Array.isArray(question?.answers) ? question.answers : [];
    return list.find((a) => a.user_id === myUserId) || null;
  }, [question?.answers, myUserId]);

  useEffect(() => {
    if (isCompleted) return undefined;
    if (msUntilStart <= 0 && !question?.started_at) return undefined;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCompleted, msUntilStart, question?.started_at]);

  useEffect(() => {
    if (!user || !duelId) return undefined;
    if (busy) return undefined;
    if (isCompleted) return undefined;

    const duelStartMs = state?.started_at ? new Date(state.started_at).getTime() : NaN;
    const questionStartMs = question?.started_at ? new Date(question.started_at).getTime() : NaN;
    const questionLimitMs = Math.max(0, (Number(question?.time_limit_sec) || 0) * 1000);

    let wakeAtMs = NaN;
    if (Number.isFinite(duelStartMs) && duelStartMs > Date.now()) {
      wakeAtMs = duelStartMs + 150;
    } else if (
      Number.isFinite(questionStartMs) &&
      questionLimitMs > 0 &&
      questionStartMs + questionLimitMs > Date.now()
    ) {
      wakeAtMs = questionStartMs + questionLimitMs + 150;
    }

    if (!Number.isFinite(wakeAtMs)) return undefined;

    const timeoutId = window.setTimeout(() => {
      void load();
    }, Math.max(150, wakeAtMs - Date.now()));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    busy,
    duelId,
    isCompleted,
    question?.question_index,
    question?.started_at,
    question?.time_limit_sec,
    state?.started_at,
    user,
  ]);

  useEffect(() => {
    const idx = question?.question_index ?? null;
    if (idx == null) return;
    if (lastQuestionIndexRef.current == null) {
      lastQuestionIndexRef.current = idx;
      return;
    }
    if (Number(lastQuestionIndexRef.current) !== Number(idx)) {
      lastQuestionIndexRef.current = idx;
      setSelectedOptionId(null);
    }
  }, [question?.question_index]);

  const claim = question?.claim || null;
  const claimText = useMemo(() => {
    if (!claim) return '';
    if (!myUserId) return STRINGS.DUEL_PLAY.pointClaimed;
    return claim.winner_user_id === myUserId
      ? STRINGS.DUEL_PLAY.youWonPoint
      : STRINGS.DUEL_PLAY.opponentWonPoint;
  }, [claim, myUserId]);

  const opponentUserId = useMemo(() => {
    if (!myUserId) return null;
    if (!state?.challenger_user_id || !state?.opponent_user_id) return null;
    return state.challenger_user_id === myUserId ? state.opponent_user_id : state.challenger_user_id;
  }, [myUserId, state?.challenger_user_id, state?.opponent_user_id]);

  const resultText = useMemo(() => {
    const winner = state?.winner_user_id ? String(state.winner_user_id) : '';
    if (winner) {
      if (!myUserId) return STRINGS.DUELS.result.tie;
      return winner === String(myUserId) ? STRINGS.PROFILE.duels.result.youWon : STRINGS.PROFILE.duels.result.youLost;
    }
    if (Number(myPoints) === Number(oppPoints)) return STRINGS.DUELS.result.tie;
    return Number(myPoints) > Number(oppPoints)
      ? STRINGS.PROFILE.duels.result.youWon
      : STRINGS.PROFILE.duels.result.youLost;
  }, [myPoints, myUserId, oppPoints, state?.winner_user_id]);

  const startRematch = async () => {
    if (busy) return;
    if (!opponentUserId) {
      setError('Missing opponent user id.');
      return;
    }

    const body = {
      friend_user_id: opponentUserId,
      mode: duelMode === 'blitz' ? 'blitz' : 'custom',
      ...(duelMode === 'blitz'
        ? {
            difficulty: state?.difficulty ?? null,
            category_id: state?.category_id ?? null,
          }
        : { quiz_id: state?.quiz_id }),
    };

    setBusy(true);
    setError('');
    try {
      const created = await api.createDuel(body);
      const nextDuelId = created?.id || created?.duel_id;
      if (!nextDuelId) throw new Error('Failed to create rematch duel.');
      if (typeof window !== 'undefined') {
        window.location.hash = `#/duels/${encodeURIComponent(String(nextDuelId))}/play`;
      }
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const answer = async (sessionOptionId: string) => {
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
          <h2 style={DuelPlayStyle.qTitle}>{STRINGS.DUEL_PLAY.title(headerPct)}</h2>

          {isCompleted ? (
            <>
              <div style={DuelPlayStyle.resultHeadline}>{resultText}</div>
              <div style={DuelPlayStyle.resultSub}>
                {duelMode === 'blitz' ? 'Blitz duel finished.' : 'Custom duel finished.'}
              </div>

              <div style={DuelPlayStyle.resultGrid}>
                <div style={DuelPlayStyle.resultStat}>
                  <div style={DuelPlayStyle.resultStatLabel}>You</div>
                  <div style={DuelPlayStyle.resultStatValue}>{myPoints}</div>
                </div>
                <div style={DuelPlayStyle.resultStat}>
                  <div style={DuelPlayStyle.resultStatLabel}>Opponent</div>
                  <div style={DuelPlayStyle.resultStatValue}>{oppPoints}</div>
                </div>
              </div>

              <div style={DuelPlayStyle.resultActions}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={DuelPlayStyle.btnWhite}
                  onClick={onBack}
                  disabled={busy}
                >
                  {STRINGS.COMMON.symbols.leftArrow} {STRINGS.COMMON.buttons.back}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={DuelPlayStyle.btnPrimary}
                  onClick={startRematch}
                  disabled={busy || !opponentUserId || (duelMode !== 'blitz' && !state?.quiz_id)}
                  title={!opponentUserId ? 'Missing opponent' : undefined}
                >
                  {ICONS.common.bolt} Rematch
                </button>
              </div>
            </>
          ) : !question ? (
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
                  const reveal = !!myAnswer;
                  const chosenId = myAnswer?.session_option_id ?? selectedOptionId;
                  const isChosen = chosenId != null && String(o.id) === String(chosenId);
                  const isCorrectOption =
                    question?.correct_option_id != null &&
                    String(o.id) === String(question.correct_option_id);
                  const isCorrectChosen = reveal && isChosen && myAnswer?.is_correct === true;
                  const isWrongChosen = reveal && isChosen && myAnswer?.is_correct === false;

                  const base = DuelPlayStyle.optionBtnState(selected, disabled);
                  const revealStyle = reveal
                    ? isCorrectChosen
                      ? {
                          background:
                            'linear-gradient(90deg, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0.08) 100%)',
                          border: '1px solid rgba(34,197,94,0.45)',
                        }
                      : isWrongChosen
                        ? {
                            background:
                              'linear-gradient(90deg, rgba(239,68,68,0.16) 0%, rgba(239,68,68,0.08) 100%)',
                            border: '1px solid rgba(239,68,68,0.45)',
                          }
                        : isCorrectOption
                          ? {
                              background:
                                'linear-gradient(90deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.06) 100%)',
                              border: '1px solid rgba(34,197,94,0.28)',
                            }
                          : {
                              opacity: 0.72,
                              filter: 'saturate(0.85) brightness(1.02)',
                            }
                    : null;

                  const resultIcon = reveal
                    ? isCorrectChosen
                      ? ICONS.common.tick
                      : isWrongChosen
                        ? ICONS.common.close
                        : isCorrectOption
                          ? ICONS.common.tick
                          : null
                    : null;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={{ ...base, ...(revealStyle || {}) }}
                      disabled={disabled}
                      onClick={() => answer(o.id)}
                    >
                      <span style={DuelPlayStyle.optionLabel}>{o.label}</span>
                      <span style={DuelPlayStyle.optionText}>{o.text}</span>
                      {!!resultIcon && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: 18,
                            fontWeight: 950,
                          }}
                          aria-hidden="true"
                        >
                          {resultIcon}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!!myAnswer && (
                <div
                  style={{
                    ...DuelPlayStyle.toast,
                    ...(myAnswer.is_correct ? DuelPlayStyle.toastOk : DuelPlayStyle.toastBad),
                  }}
                >
                  {myAnswer.is_correct ? (
                    <>
                      {ICONS.common.tick} {STRINGS.PLAY_SESSION.results.correctShort}
                    </>
                  ) : (
                    <>
                      {ICONS.common.close} {STRINGS.PLAY_SESSION.results.wrongShort}
                    </>
                  )}
                  {question?.correct_option_id ? (
                    <span style={{ color: 'inherit', opacity: 0.9 }}>
                      {' '}• Correct:{' '}
                      {(question.options || []).find(
                        (x) => String(x.id) === String(question.correct_option_id)
                      )?.label || ''}
                    </span>
                  ) : null}
                </div>
              )}

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

