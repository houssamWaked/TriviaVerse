import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import QuizViewStyle from '@/Styles/ComponentStyles/QuizViewStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

function ratingLabel(avg, count) {
  const a = Number(avg);
  const c = Number(count);
  const avgText = Number.isFinite(a) ? a.toFixed(a % 1 === 0 ? 0 : 1) : '0';
  const countText = Number.isFinite(c) ? c : 0;
  return STRINGS.QUIZ_VIEW.rating.label(avgText, countText);
}

export default function QuizView({
  quizId,
  user,
  onRequireAuth,
  onBack,
  onEditQuiz,
  onPlaySession,
  onOpenDuel,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [data, setData] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);

  const [duelOpen, setDuelOpen] = useState(false);
  const [duelFriends, setDuelFriends] = useState([]);
  const [duelFriendId, setDuelFriendId] = useState('');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportMessage, setReportMessage] = useState('');

  const load = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    setNeedsLogin(false);
    try {
      const [details, summary, lb] = await Promise.all([
        api.getPublicQuiz(quizId),
        api.getPublicQuizRatings(quizId),
        api.getPublicQuizLeaderboard(quizId, 10),
      ]);
      setData(details);
      setRatings(summary);
      setLeaderboard(lb);
    } catch (err) {
      if (isUnauthorized(err)) setNeedsLogin(true);
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, !!user]);

  const quiz = data?.quiz;
  const canEdit = !!data?.can_edit;
  const duelAllowed = quiz?.status === 'published';
  const questionsCount = Number(data?.questions_count);

  const ratingText = useMemo(() => {
    if (!ratings) return STRINGS.QUIZ_VIEW.rating.zero;
    return ratingLabel(ratings.ratings_avg, ratings.ratings_count);
  }, [ratings]);

  const onRate = async (value) => {
    if (!user) return onRequireAuth?.('quiz');

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const next = await api.rateQuiz(quizId, { rating: value });
      setRatings(next);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('quiz');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!user) return onRequireAuth?.('quiz');
    if (!quizId) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api.reportQuiz(quizId, {
        reason: reportReason,
        message: reportMessage,
      });
      setReportOpen(false);
      setReportMessage('');
      setSuccess('Report submitted. Thank you!');
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('quiz');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={QuizViewStyle.page}>
      <div style={QuizViewStyle.container}>
        <div style={QuizViewStyle.topRow}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={QuizViewStyle.btnWhite}
            onClick={onBack}
            disabled={busy}
          >
            {STRINGS.COMMON.symbols.leftArrow} {STRINGS.QUIZ_VIEW.buttons.back}
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={QuizViewStyle.btnPrimary}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const started = await api.startCustomQuizSession(quizId);
                onPlaySession?.(started.session_id);
              } catch (err) {
                if (isUnauthorized(err)) return onRequireAuth?.('quiz');
                setError(getApiErrorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            {STRINGS.QUIZ_VIEW.buttons.play} {ICONS.common.play}
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={QuizViewStyle.btnWhite}
            disabled={busy}
            onClick={async () => {
              if (!user) return onRequireAuth?.('quiz');
              const next = !duelOpen;
              setDuelOpen(next);
              if (next) setReportOpen(false);
              if (next && duelFriends.length === 0) {
                setBusy(true);
                setError('');
                try {
                  const res = await api.listFriends();
                  setDuelFriends(Array.isArray(res?.friends) ? res.friends : []);
                } catch (err) {
                  if (isUnauthorized(err)) return onRequireAuth?.('quiz');
                  setError(getApiErrorMessage(err));
                } finally {
                  setBusy(false);
                }
              }
            }}
          >
            {STRINGS.QUIZ_VIEW.buttons.duel} {ICONS.common.bolt}
          </button>

          {canEdit && (
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={QuizViewStyle.btnPrimary}
              onClick={() => onEditQuiz?.(quizId)}
              disabled={busy}
            >
              {STRINGS.QUIZ_VIEW.buttons.edit} {ICONS.common.edit}
            </button>
          )}

          {!canEdit && (
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={QuizViewStyle.btnWhite}
              disabled={busy}
              onClick={() => {
                if (!user) return onRequireAuth?.('quiz');
                setReportOpen((v) => !v);
                setDuelOpen(false);
              }}
              title="Report this quiz"
            >
              {STRINGS.QUIZ_VIEW.buttons.report} {ICONS.common.finishFlag}
            </button>
          )}
        </div>

        {!!success && (
          <div className="tv-card" style={QuizViewStyle.successCard}>
            {success}
          </div>
        )}

        {!!error && (
          <div className="tv-card" style={QuizViewStyle.errorCard}>
            <div>{error}</div>
            {needsLogin && (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={QuizViewStyle.btnWhiteMt12}
                onClick={() => onRequireAuth?.('quiz')}
              >
                {STRINGS.QUIZ_VIEW.buttons.loginToView}
              </button>
            )}
          </div>
        )}

        {!quiz ? (
          <div style={QuizViewStyle.loading}>
            {busy ? STRINGS.QUIZ_VIEW.states.loading : STRINGS.QUIZ_VIEW.states.notFound}
          </div>
        ) : (
          <>
            {reportOpen && (
              <div className="tv-card" style={QuizViewStyle.reportCard}>
                <div style={QuizViewStyle.reportTitle}>
                  {ICONS.common.finishFlag} Report this quiz
                </div>
                <div style={QuizViewStyle.reportSub}>
                  Tell us what’s wrong. Admins will review it.
                </div>

                <div style={QuizViewStyle.reportRow}>
                  <select
                    style={QuizViewStyle.select}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    disabled={busy}
                  >
                    <option value="spam">Spam</option>
                    <option value="hate">Hate / abuse</option>
                    <option value="copyright">Copyright</option>
                    <option value="wrong_answers">Wrong answers</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <textarea
                  style={QuizViewStyle.reportTextarea}
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Add details (optional)…"
                  disabled={busy}
                />

                <div style={QuizViewStyle.reportActions}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={QuizViewStyle.btnPrimary}
                    onClick={submitReport}
                    disabled={busy}
                  >
                    Submit report
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={QuizViewStyle.btnWhite}
                    onClick={() => setReportOpen(false)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {duelOpen && (
              <div className="tv-card" style={QuizViewStyle.duelCard}>
                <div style={QuizViewStyle.duelTop}>
                  <div>
                    <h2 style={QuizViewStyle.duelTitle}>{STRINGS.QUIZ_VIEW.duel.title}</h2>
                    <div style={QuizViewStyle.duelSub}>
                      {duelAllowed
                        ? STRINGS.QUIZ_VIEW.duel.subtitle
                        : STRINGS.QUIZ_VIEW.duel.needPublished}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={QuizViewStyle.btnWhite}
                    disabled={busy}
                    onClick={() => setDuelOpen(false)}
                  >
                    {STRINGS.COMMON.buttons.close}
                  </button>
                </div>

                <div style={QuizViewStyle.duelRow}>
                  <select
                    style={QuizViewStyle.select}
                    value={duelFriendId}
                    onChange={(e) => setDuelFriendId(e.target.value)}
                    disabled={busy || !duelAllowed}
                  >
                    <option value="">{STRINGS.QUIZ_VIEW.duel.friendPlaceholder}</option>
                    {(duelFriends || []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.username}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={QuizViewStyle.btnPrimary}
                    disabled={busy || !duelAllowed || !duelFriendId || !onOpenDuel}
                    onClick={async () => {
                      if (!user) return onRequireAuth?.('quiz');
                      if (!duelFriendId) return;
                      setBusy(true);
                      setError('');
                      try {
                        const created = await api.createDuel({
                          friend_user_id: duelFriendId,
                          quiz_id: quizId,
                        });
                        setDuelOpen(false);
                        setDuelFriendId('');
                        onOpenDuel?.(created?.id);
                      } catch (err) {
                        if (isUnauthorized(err)) return onRequireAuth?.('quiz');
                        setError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {STRINGS.QUIZ_VIEW.duel.send} {ICONS.common.rocket}
                  </button>
                </div>

                {!busy && duelFriends.length === 0 && (
                  <div style={QuizViewStyle.duelHint}>{STRINGS.QUIZ_VIEW.duel.noFriends}</div>
                )}
              </div>
            )}

            <div className="tv-card" style={QuizViewStyle.headerCard}>
              <div style={QuizViewStyle.headerTop}>
                <div>
                  <div style={QuizViewStyle.ownerRow}>
                    <span style={QuizViewStyle.ownerIcon}>{ICONS.common.user}</span>
                    <span style={QuizViewStyle.ownerName}>
                      {quiz.owner?.username || STRINGS.QUIZ_VIEW.ownerUnknown}
                    </span>
                    <span style={QuizViewStyle.dot}>{STRINGS.COMMON.separators.middot}</span>
                    <span style={QuizViewStyle.visibility}>
                      {quiz.visibility === STRINGS.QUIZ_VIEW.visibility.private ? (
                        <>
                          {ICONS.common.lock} {STRINGS.QUIZ_VIEW.visibility.private}
                        </>
                      ) : (
                        <>
                          {ICONS.common.globe} {STRINGS.QUIZ_VIEW.visibility.public}
                        </>
                      )}
                    </span>
                    {Number.isFinite(questionsCount) && (
                      <>
                        <span style={QuizViewStyle.dot}>{STRINGS.COMMON.separators.middot}</span>
                        <span style={QuizViewStyle.visibility}>
                          {ICONS.common.question} {questionsCount}
                        </span>
                      </>
                    )}
                  </div>
                  <h1 style={QuizViewStyle.title}>{quiz.title}</h1>
                  {!!quiz.description && <p style={QuizViewStyle.desc}>{quiz.description}</p>}
                </div>

                <div style={QuizViewStyle.ratingBox}>
                  <div style={QuizViewStyle.ratingText}>{ratingText}</div>
                  <div style={QuizViewStyle.starsRow}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = (ratings?.my_rating || 0) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          style={QuizViewStyle.starBtnState(active)}
                          onClick={() => onRate(n)}
                          disabled={busy}
                          title={STRINGS.QUIZ_VIEW.rating.rateTitle(n)}
                        >
                          {ICONS.common.starFilled}
                        </button>
                      );
                    })}
                  </div>
                  {!user && <div style={QuizViewStyle.rateHint}>{STRINGS.QUIZ_VIEW.rating.loginToRate}</div>}
                </div>
              </div>
            </div>

            <div className="tv-card" style={QuizViewStyle.headerCard}>
              <div style={QuizViewStyle.lbHeader}>
                <div>
                  <h2 style={QuizViewStyle.lbTitle}>{STRINGS.QUIZ_VIEW.leaderboard.title}</h2>
                  {Number.isFinite(Number(leaderboard?.my_best_score)) && (
                    <div style={QuizViewStyle.lbMine}>
                      {STRINGS.QUIZ_VIEW.leaderboard.myBestPrefix} {ICONS.common.medal}{' '}
                      {leaderboard.my_best_score}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={QuizViewStyle.btnWhite}
                  disabled={busy}
                  onClick={() => {
                    api.invalidatePublicQuizLeaderboard?.(quizId);
                    load();
                  }}
                >
                  {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
                </button>
              </div>

              <div style={QuizViewStyle.lbList}>
                {(leaderboard?.entries || []).slice(0, 10).map((e) => (
                  <div key={e.user_id} style={QuizViewStyle.lbRow}>
                    <span style={QuizViewStyle.lbRank}>
                      {STRINGS.COMMON.symbols.hash}
                      {e.rank_position}
                    </span>
                    <span style={QuizViewStyle.lbName}>
                      {e.username || STRINGS.COMMON.playerFallback}
                    </span>
                    <span style={QuizViewStyle.lbScore}>
                      {ICONS.common.medal} {e.best_score}
                    </span>
                  </div>
                ))}

                {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                  <div style={QuizViewStyle.lbEmpty}>
                    {leaderboard?.not_configured
                      ? STRINGS.QUIZ_VIEW.leaderboard.notConfigured
                      : STRINGS.QUIZ_VIEW.leaderboard.empty}
                  </div>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
