import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import QuizViewStyle from '../Styles/ComponentStyles/QuizViewStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function isUnauthorized(err) {
  return Number(err?.response?.status) === 401;
}

function ratingLabel(avg, count) {
  const a = Number(avg);
  const c = Number(count);
  const avgText = Number.isFinite(a) ? a.toFixed(a % 1 === 0 ? 0 : 1) : '0';
  const countText = Number.isFinite(c) ? c : 0;
  return `⭐ ${avgText} · ${countText} ratings`;
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
    if (!ratings) return '⭐ 0 · 0 ratings';
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
            style={{ ...QuizViewStyle.btn, background: colors.neutral.white }}
            onClick={onBack}
            disabled={busy}
          >
            ← Back
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{
              ...QuizViewStyle.btn,
              background: colors.gradients.main,
              color: colors.neutral.white,
            }}
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
            Play ▶
          </button>

          {canEdit && (
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{
                ...QuizViewStyle.btn,
                background: colors.gradients.main,
                color: colors.neutral.white,
              }}
              onClick={() => onEditQuiz?.(quizId)}
              disabled={busy}
            >
              Edit ✍️
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
                style={{ ...QuizViewStyle.btn, marginTop: 12, background: colors.neutral.white }}
                onClick={() => onRequireAuth?.('quiz')}
              >
                Login to view
              </button>
            )}
          </div>
        )}

        {!quiz ? (
          <div style={QuizViewStyle.loading}>{busy ? 'Loading…' : 'Not found'}</div>
        ) : (
          <>
            <div className="tv-card" style={QuizViewStyle.headerCard}>
              <div style={QuizViewStyle.headerTop}>
                <div>
                  <div style={QuizViewStyle.ownerRow}>
                    <span style={QuizViewStyle.ownerIcon}>👤</span>
                    <span style={QuizViewStyle.ownerName}>
                      {quiz.owner?.username || 'Unknown'}
                    </span>
                    <span style={QuizViewStyle.dot}>·</span>
                    <span style={QuizViewStyle.visibility}>
                      {quiz.visibility === 'private' ? '🔒 private' : '🌍 public'}
                    </span>
                  </div>
                  <h1 style={QuizViewStyle.title}>{quiz.title}</h1>
                  {!!quiz.description && (
                    <p style={QuizViewStyle.desc}>{quiz.description}</p>
                  )}
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
                          style={{
                            ...QuizViewStyle.starBtn,
                            ...(active ? QuizViewStyle.starActive : {}),
                          }}
                          onClick={() => onRate(n)}
                          disabled={busy}
                          title={`Rate ${n}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  {!user && (
                    <div style={QuizViewStyle.rateHint}>Login to rate</div>
                  )}
                </div>
              </div>
            </div>

            <div className="tv-card" style={QuizViewStyle.headerCard}>
              <div style={QuizViewStyle.lbHeader}>
                <div>
                  <h2 style={QuizViewStyle.lbTitle}>Leaderboard</h2>
                  {Number.isFinite(Number(leaderboard?.my_best_score)) && (
                    <div style={QuizViewStyle.lbMine}>
                      Your best: 🏅 {leaderboard.my_best_score}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={{ ...QuizViewStyle.btn, background: colors.neutral.white }}
                  disabled={busy}
                  onClick={load}
                >
                  Refresh ↻
                </button>
              </div>

              <div style={QuizViewStyle.lbList}>
                {(leaderboard?.entries || []).slice(0, 10).map((e) => (
                  <div key={e.user_id} style={QuizViewStyle.lbRow}>
                    <span style={QuizViewStyle.lbRank}>#{e.rank_position}</span>
                    <span style={QuizViewStyle.lbName}>{e.username || 'Player'}</span>
                    <span style={QuizViewStyle.lbScore}>🏅 {e.best_score}</span>
                  </div>
                ))}

                {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                  <div style={QuizViewStyle.lbEmpty}>
                    No scores yet — be the first to play!
                  </div>
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
                    <span style={QuizViewStyle.qNum}>Q{q.order_index}</span>
                    <span style={QuizViewStyle.qMeta}>
                      ⏱ {q.time_limit_sec}s · ⭐ {q.points}
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
                <div style={QuizViewStyle.loading}>No questions yet.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
