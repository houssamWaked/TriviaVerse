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
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [data, setData] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);

  const load = async () => {
    setBusy(true);
    setError('');
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
  const questions = data?.questions || [];
  const canEdit = !!data?.can_edit;

  const ratingText = useMemo(() => {
    if (!ratings) return STRINGS.QUIZ_VIEW.rating.zero;
    return ratingLabel(ratings.ratings_avg, ratings.ratings_count);
  }, [ratings]);

  const onRate = async (value) => {
    if (!user) return onRequireAuth?.('quiz');

    setBusy(true);
    setError('');
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
              if (!user) return onRequireAuth?.('quiz');
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
        </div>

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
                  onClick={load}
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
                  <div style={QuizViewStyle.lbEmpty}>{STRINGS.QUIZ_VIEW.leaderboard.empty}</div>
                )}
              </div>
            </div>

            <div style={QuizViewStyle.questions}>
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="tv-card tv-card--hover"
                  style={QuizViewStyle.questionCard}
                >
                  <div style={QuizViewStyle.qTop}>
                    <span style={QuizViewStyle.qNum}>
                      {STRINGS.QUIZ_VIEW.questions.qPrefix}
                      {q.order_index}
                    </span>
                    <span style={QuizViewStyle.qMeta}>
                      {ICONS.common.timer} {q.time_limit_sec}
                      {STRINGS.COMMON.units.secondsShort} {STRINGS.COMMON.separators.middot}{' '}
                      {ICONS.common.star} {q.points}
                    </span>
                  </div>
                  <div style={QuizViewStyle.qText}>{q.question_text}</div>
                  <div style={QuizViewStyle.options}>
                    {(q.options || []).map((o) => (
                      <div key={o.id} style={QuizViewStyle.option}>
                        <span style={QuizViewStyle.optionIdx}>{o.order_index}.</span>
                        <span style={QuizViewStyle.optionText}>{o.option_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div style={QuizViewStyle.loading}>{STRINGS.QUIZ_VIEW.questions.none}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
