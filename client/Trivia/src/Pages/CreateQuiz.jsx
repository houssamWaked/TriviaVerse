import React, { useCallback, useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import CreateQuizPageStyle from '../Styles/ComponentStyles/CreateQuizPageStyle';

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

function sortByOrderIndex(a, b) {
  return (a?.order_index ?? 0) - (b?.order_index ?? 0);
}

export default function CreateQuiz({
  user,
  onRequireAuth,
  onNavigateHome,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [quiz, setQuiz] = useState(null);
  const [quizEdit, setQuizEdit] = useState(null);
  const [quizIdInput, setQuizIdInput] = useState('');

  const [quizForm, setQuizForm] = useState({
    title: 'My Trivia Quiz ✨',
    description: 'A fun quiz made on TriviaVerse!',
    visibility: 'private',
  });

  const [myQuizzesBusy, setMyQuizzesBusy] = useState(false);
  const [myQuizFilter, setMyQuizFilter] = useState('');
  const [myQuizzes, setMyQuizzes] = useState([]);

  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    time_limit_sec: 30,
    points: 100,
  });

  const [optionDrafts, setOptionDrafts] = useState({});
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessUsername, setAccessUsername] = useState('');
  const [accessList, setAccessList] = useState([]);

  const canUseBuilder = !!user;

  const refreshMyQuizzes = useCallback(async () => {
    setMyQuizzesBusy(true);
    try {
      const list = await api.listMyQuizzes();
      setMyQuizzes(Array.isArray(list) ? list : []);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    } finally {
      setMyQuizzesBusy(false);
    }
  }, [onRequireAuth]);

  const loadQuiz = useCallback(
    async (quizId) => {
      setError('');
      setBusy(true);
      try {
        const loaded = await api.getQuiz(String(quizId).trim());
        setQuiz(loaded);
        setQuizEdit({
          title: loaded.title || '',
          description: loaded.description || '',
          visibility: loaded.visibility || 'private',
        });
        setQuizIdInput(loaded.id);
      } catch (err) {
        if (isUnauthorized(err)) return onRequireAuth?.();
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [onRequireAuth]
  );

  const refreshAccess = useCallback(async () => {
    if (!quiz?.id) return;
    setAccessBusy(true);
    try {
      const list = await api.listQuizAccess(quiz.id);
      setAccessList(Array.isArray(list) ? list : []);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    } finally {
      setAccessBusy(false);
    }
  }, [onRequireAuth, quiz?.id]);

  const quizHeader = useMemo(() => {
    if (!quiz) return null;
    const pillStyle = {
      ...CreateQuizPageStyle.pill,
      ...(quiz.status === 'published' ? CreateQuizPageStyle.pillOk : {}),
    };
    return (
      <div style={CreateQuizPageStyle.quizHeader}>
        <div>
          <div style={CreateQuizPageStyle.quizTitleRow}>
            <h2 style={CreateQuizPageStyle.quizTitle}>{quiz.title}</h2>
            <span style={pillStyle}>{quiz.status}</span>
          </div>
          {!!quiz.description && (
            <p style={CreateQuizPageStyle.quizDesc}>{quiz.description}</p>
          )}
          <div style={CreateQuizPageStyle.metaRow}>
            <span style={CreateQuizPageStyle.metaItem}>
              <span style={CreateQuizPageStyle.metaIcon}>🔒</span>
              {quiz.visibility}
            </span>
            <span style={CreateQuizPageStyle.metaItem}>
              <span style={CreateQuizPageStyle.metaIcon}>🆔</span>
              <code style={CreateQuizPageStyle.code}>{quiz.id}</code>
            </span>
          </div>
        </div>

        <div style={CreateQuizPageStyle.actions}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...CreateQuizPageStyle.actionBtn, background: colors.neutral.white }}
            onClick={onNavigateHome}
          >
            ← Back Home
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{
              ...CreateQuizPageStyle.actionBtn,
              background: colors.gradients.main,
              color: colors.neutral.white,
            }}
            disabled={busy || quiz.status === 'published'}
            onClick={async () => {
              setError('');
              setBusy(true);
              try {
                const updated = await api.publishQuiz(quiz.id);
                setQuiz(updated);
                await refreshMyQuizzes();
              } catch (err) {
                if (isUnauthorized(err)) return onRequireAuth?.();
                setError(getApiErrorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            Publish 🚀
          </button>
        </div>
      </div>
    );
  }, [busy, onNavigateHome, onRequireAuth, quiz, refreshMyQuizzes]);

  const refreshQuestions = async (quizId) => {
    const list = await api.listQuizQuestions(quizId);
    setQuestions(Array.isArray(list) ? list.sort(sortByOrderIndex) : []);
  };

  useEffect(() => {
    if (!canUseBuilder) {
      setMyQuizzes([]);
      return;
    }

    setError('');
    refreshMyQuizzes();
  }, [canUseBuilder, refreshMyQuizzes]);

  useEffect(() => {
    if (!quiz?.id) return;
    setError('');
    setBusy(true);
    refreshQuestions(quiz.id)
      .catch((err) => {
        if (isUnauthorized(err)) return onRequireAuth?.();
        setError(getApiErrorMessage(err));
      })
      .finally(() => setBusy(false));
  }, [quiz?.id, onRequireAuth]);

  useEffect(() => {
    const hash = String(window.location.hash || '');
    const queryPart = hash.split('?')[1] || '';
    const params = new URLSearchParams(queryPart);
    const quizId = params.get('quizId');
    if (quizId) loadQuiz(quizId);
  }, [loadQuiz]);

  useEffect(() => {
    if (!quiz?.id) return;
    if (quiz.visibility !== 'private') {
      setAccessList([]);
      return;
    }
    refreshAccess();
  }, [quiz?.id, quiz?.visibility, refreshAccess]);

  return (
    <div style={CreateQuizPageStyle.page}>
      <div style={CreateQuizPageStyle.container}>
        <div style={CreateQuizPageStyle.hero}>
          <div style={CreateQuizPageStyle.heroBadge}>
            <span style={CreateQuizPageStyle.heroBadgeIcon}>🎨</span>
            <span style={CreateQuizPageStyle.heroBadgeText}>
              Build a quiz in minutes
            </span>
            <span style={CreateQuizPageStyle.heroBadgeDot}>✨</span>
          </div>
          <h1 style={CreateQuizPageStyle.heroTitle}>
            Create Your <span style={CreateQuizPageStyle.heroTitleAccent}>Quiz</span>
          </h1>
          <p style={CreateQuizPageStyle.heroSubtitle}>
            Add questions, set correct answers, then publish and share with friends.
          </p>
        </div>

        {!canUseBuilder ? (
          <div className="tv-card" style={CreateQuizPageStyle.lockCard}>
            <h2 style={CreateQuizPageStyle.lockTitle}>Login to create quizzes</h2>
            <p style={CreateQuizPageStyle.lockText}>
              You need an account to save drafts and publish your quiz.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{
                ...CreateQuizPageStyle.primaryBtn,
                background: colors.gradients.main,
              }}
              onClick={() => onRequireAuth?.()}
            >
              Join / Login 🚀
            </button>
          </div>
        ) : (
          <>
            {!!error && (
              <div className="tv-card" style={CreateQuizPageStyle.errorCard}>
                <div style={CreateQuizPageStyle.errorTitle}>Oops</div>
                <div style={CreateQuizPageStyle.errorText}>{error}</div>
              </div>
            )}

            <div style={CreateQuizPageStyle.grid}>
              <div className="tv-card" style={CreateQuizPageStyle.panel}>
                <h2 style={CreateQuizPageStyle.panelTitle}>1) Create quiz</h2>

                <form
                  style={CreateQuizPageStyle.form}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError('');
                    setBusy(true);
                    try {
                      const created = await api.createQuiz(quizForm);
                      setQuiz(created);
                      setQuizEdit({
                        title: created.title || '',
                        description: created.description || '',
                        visibility: created.visibility || 'private',
                      });
                      setQuizIdInput(created.id);
                      await refreshMyQuizzes();
                    } catch (err) {
                      if (isUnauthorized(err)) return onRequireAuth?.();
                      setError(getApiErrorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label style={CreateQuizPageStyle.field}>
                    <span style={CreateQuizPageStyle.label}>Title</span>
                    <input
                      style={CreateQuizPageStyle.input}
                      value={quizForm.title}
                      onChange={(e) =>
                        setQuizForm((v) => ({ ...v, title: e.target.value }))
                      }
                      maxLength={120}
                      required
                      disabled={busy}
                    />
                  </label>

                  <label style={CreateQuizPageStyle.field}>
                    <span style={CreateQuizPageStyle.label}>Description</span>
                    <textarea
                      style={CreateQuizPageStyle.textarea}
                      value={quizForm.description}
                      onChange={(e) =>
                        setQuizForm((v) => ({ ...v, description: e.target.value }))
                      }
                      maxLength={1000}
                      disabled={busy}
                    />
                  </label>

                  <label style={CreateQuizPageStyle.field}>
                    <span style={CreateQuizPageStyle.label}>Visibility</span>
                    <select
                      style={CreateQuizPageStyle.input}
                      value={quizForm.visibility}
                      onChange={(e) =>
                        setQuizForm((v) => ({ ...v, visibility: e.target.value }))
                      }
                      disabled={busy}
                    >
                      <option value="private">private</option>
                      <option value="public">public</option>
                      <option value="unlisted">unlisted</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="tv-card tv-card--hover"
                    style={{
                      ...CreateQuizPageStyle.primaryBtn,
                      background: colors.gradients.main,
                    }}
                    disabled={busy}
                  >
                    Create draft ✨
                  </button>
                </form>
              </div>

              <div className="tv-card" style={CreateQuizPageStyle.panel}>
                <div style={CreateQuizPageStyle.panelWideHeader}>
                  <h2 style={CreateQuizPageStyle.panelTitle}>2) My quizzes</h2>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{
                      ...CreateQuizPageStyle.secondaryBtn,
                      background: colors.neutral.white,
                    }}
                    disabled={busy || myQuizzesBusy}
                    onClick={async () => {
                      setError('');
                      await refreshMyQuizzes();
                    }}
                  >
                    Refresh ↻
                  </button>
                </div>

                <p style={CreateQuizPageStyle.panelHint}>
                  Open any quiz you’ve created (by name, not UUID).
                </p>

                <label style={CreateQuizPageStyle.field}>
                  <span style={CreateQuizPageStyle.label}>Search</span>
                  <input
                    style={CreateQuizPageStyle.input}
                    value={myQuizFilter}
                    onChange={(e) => setMyQuizFilter(e.target.value)}
                    placeholder="Type a quiz title..."
                    disabled={busy || myQuizzesBusy}
                  />
                </label>

                <div style={CreateQuizPageStyle.myQuizList}>
                  {(myQuizzes || [])
                    .filter((q) => {
                      const t = String(q?.title || '').toLowerCase();
                      const f = String(myQuizFilter || '').trim().toLowerCase();
                      if (!f) return true;
                      return t.includes(f);
                    })
                    .slice(0, 30)
                    .map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        className="tv-card tv-card--hover"
                        style={CreateQuizPageStyle.myQuizItem}
                        disabled={busy}
                        onClick={() => loadQuiz(q.id)}
                      >
                        <div style={CreateQuizPageStyle.myQuizTitleRow}>
                          <span style={CreateQuizPageStyle.myQuizTitle}>
                            {q.title || 'Untitled quiz'}
                          </span>
                          <span style={CreateQuizPageStyle.myQuizStatus}>
                            {q.status || 'draft'}
                          </span>
                        </div>
                        <div style={CreateQuizPageStyle.myQuizMeta}>
                          <span style={CreateQuizPageStyle.myQuizMetaItem}>
                            🔒 {q.visibility || 'private'}
                          </span>
                        </div>
                      </button>
                    ))}

                  {(!myQuizzes || myQuizzes.length === 0) && !myQuizzesBusy && (
                    <div style={CreateQuizPageStyle.emptyOptions}>
                      No quizzes yet — create your first draft on the left ✨
                    </div>
                  )}

                  {myQuizzesBusy && (
                    <div style={CreateQuizPageStyle.emptyOptions}>Loading…</div>
                  )}
                </div>

                <div style={CreateQuizPageStyle.inlineRow}>
                  <input
                    style={CreateQuizPageStyle.input}
                    value={quizIdInput}
                    onChange={(e) => setQuizIdInput(e.target.value)}
                    placeholder="Quiz ID (UUID)"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{
                      ...CreateQuizPageStyle.secondaryBtn,
                      background: colors.neutral.white,
                    }}
                    disabled={busy || !quizIdInput.trim()}
                    onClick={async () => {
                      await loadQuiz(quizIdInput.trim());
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            {!!quiz && (
              <div style={CreateQuizPageStyle.builder}>
                {quizHeader}

                {!!quizEdit && (
                  <div className="tv-card" style={CreateQuizPageStyle.panelWide}>
                    <div style={CreateQuizPageStyle.panelWideHeader}>
                      <h2 style={CreateQuizPageStyle.panelTitle}>Quiz settings</h2>
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={{
                          ...CreateQuizPageStyle.secondaryBtn,
                          background: colors.neutral.white,
                        }}
                        disabled={busy}
                        onClick={() => {
                          setQuiz(null);
                          setQuizEdit(null);
                          setQuestions([]);
                          setOptionDrafts({});
                        }}
                      >
                        Close ✕
                      </button>
                    </div>

                    <form
                      style={CreateQuizPageStyle.form}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setError('');
                        setBusy(true);
                        try {
                          const updated = await api.patchQuiz(quiz.id, {
                            title: quizEdit.title,
                            description: quizEdit.description || null,
                            visibility: quizEdit.visibility,
                          });
                          setQuiz(updated);
                          setQuizEdit({
                            title: updated.title || '',
                            description: updated.description || '',
                            visibility: updated.visibility || 'private',
                          });
                          await refreshMyQuizzes();
                        } catch (err) {
                          if (isUnauthorized(err)) return onRequireAuth?.();
                          setError(getApiErrorMessage(err));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <label style={CreateQuizPageStyle.field}>
                        <span style={CreateQuizPageStyle.label}>Title</span>
                        <input
                          style={CreateQuizPageStyle.input}
                          value={quizEdit.title}
                          onChange={(e) =>
                            setQuizEdit((v) => ({ ...v, title: e.target.value }))
                          }
                          maxLength={120}
                          required
                          disabled={busy}
                        />
                      </label>

                      <label style={CreateQuizPageStyle.field}>
                        <span style={CreateQuizPageStyle.label}>Description</span>
                        <textarea
                          style={CreateQuizPageStyle.textarea}
                          value={quizEdit.description}
                          onChange={(e) =>
                            setQuizEdit((v) => ({
                              ...v,
                              description: e.target.value,
                            }))
                          }
                          maxLength={1000}
                          disabled={busy}
                        />
                      </label>

                      <label style={CreateQuizPageStyle.field}>
                        <span style={CreateQuizPageStyle.label}>Visibility</span>
                        <select
                          style={CreateQuizPageStyle.input}
                          value={quizEdit.visibility}
                          onChange={(e) =>
                            setQuizEdit((v) => ({
                              ...v,
                              visibility: e.target.value,
                            }))
                          }
                          disabled={busy}
                        >
                          <option value="private">private</option>
                          <option value="public">public</option>
                          <option value="unlisted">unlisted</option>
                        </select>
                      </label>

                      <button
                        type="submit"
                        className="tv-card tv-card--hover"
                        style={{
                          ...CreateQuizPageStyle.primaryBtn,
                          background: colors.gradients.main,
                        }}
                        disabled={busy}
                      >
                        Save changes 💾
                      </button>
                    </form>

                    {quiz.visibility === 'private' && (
                      <div style={CreateQuizPageStyle.accessWrap}>
                        <div style={CreateQuizPageStyle.accessHeader}>
                          <h3 style={CreateQuizPageStyle.accessTitle}>
                            Friends access
                          </h3>
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={{
                              ...CreateQuizPageStyle.secondaryBtn,
                              background: colors.neutral.white,
                            }}
                            disabled={busy || accessBusy}
                            onClick={refreshAccess}
                          >
                            Refresh ↻
                          </button>
                        </div>

                        <p style={CreateQuizPageStyle.panelHint}>
                          Add usernames that can view this private quiz.
                        </p>

                        <form
                          style={CreateQuizPageStyle.inlineRow}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!accessUsername.trim()) return;
                            setError('');
                            setAccessBusy(true);
                            try {
                              await api.addQuizAccess(quiz.id, {
                                username: accessUsername.trim(),
                              });
                              setAccessUsername('');
                              await refreshAccess();
                            } catch (err) {
                              if (isUnauthorized(err)) return onRequireAuth?.();
                              setError(getApiErrorMessage(err));
                            } finally {
                              setAccessBusy(false);
                            }
                          }}
                        >
                          <input
                            style={CreateQuizPageStyle.input}
                            value={accessUsername}
                            onChange={(e) => setAccessUsername(e.target.value)}
                            placeholder="Username (e.g. coolplayer123)"
                            disabled={busy || accessBusy}
                            minLength={3}
                            maxLength={30}
                            required
                          />
                          <button
                            type="submit"
                            className="tv-card tv-card--hover"
                            style={{
                              ...CreateQuizPageStyle.secondaryBtn,
                              background: colors.neutral.white,
                            }}
                            disabled={busy || accessBusy}
                          >
                            Add
                          </button>
                        </form>

                        <div style={CreateQuizPageStyle.accessList}>
                          {accessList.map((u) => (
                            <div key={u.user_id} style={CreateQuizPageStyle.accessItem}>
                              <span style={CreateQuizPageStyle.accessUser}>
                                👤 {u.username}
                              </span>
                              <button
                                type="button"
                                className="tv-card tv-card--hover"
                                style={CreateQuizPageStyle.accessRemove}
                                disabled={busy || accessBusy}
                                onClick={async () => {
                                  setError('');
                                  setAccessBusy(true);
                                  try {
                                    await api.removeQuizAccess(quiz.id, u.user_id);
                                    await refreshAccess();
                                  } catch (err) {
                                    if (isUnauthorized(err)) return onRequireAuth?.();
                                    setError(getApiErrorMessage(err));
                                  } finally {
                                    setAccessBusy(false);
                                  }
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {accessList.length === 0 && !accessBusy && (
                            <div style={CreateQuizPageStyle.emptyOptions}>
                              No friends added yet.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="tv-card" style={CreateQuizPageStyle.panelWide}>
                  <div style={CreateQuizPageStyle.panelWideHeader}>
                    <h2 style={CreateQuizPageStyle.panelTitle}>3) Add questions</h2>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={{
                        ...CreateQuizPageStyle.secondaryBtn,
                        background: colors.neutral.white,
                      }}
                      disabled={busy}
                      onClick={async () => {
                        setError('');
                        setBusy(true);
                        try {
                          await refreshQuestions(quiz.id);
                        } catch (err) {
                          if (isUnauthorized(err)) return onRequireAuth?.();
                          setError(getApiErrorMessage(err));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Refresh ↻
                    </button>
                  </div>

                  <form
                    style={CreateQuizPageStyle.questionForm}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setError('');
                      setBusy(true);
                      try {
                        const order_index = (questions?.length || 0) + 1;
                        await api.addQuizQuestion(quiz.id, {
                          question_text: questionForm.question_text,
                          time_limit_sec: Number(questionForm.time_limit_sec) || 30,
                          points: Number(questionForm.points) || 100,
                          order_index,
                        });
                        setQuestionForm((v) => ({ ...v, question_text: '' }));
                        await refreshQuestions(quiz.id);
                      } catch (err) {
                        if (isUnauthorized(err)) return onRequireAuth?.();
                        setError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label style={{ ...CreateQuizPageStyle.field, flex: 1 }}>
                      <span style={CreateQuizPageStyle.label}>Question text</span>
                      <input
                        style={CreateQuizPageStyle.input}
                        value={questionForm.question_text}
                        onChange={(e) =>
                          setQuestionForm((v) => ({
                            ...v,
                            question_text: e.target.value,
                          }))
                        }
                        minLength={5}
                        maxLength={600}
                        required
                        disabled={busy}
                      />
                    </label>

                    <label style={CreateQuizPageStyle.smallField}>
                      <span style={CreateQuizPageStyle.label}>Time (sec)</span>
                      <input
                        style={CreateQuizPageStyle.input}
                        type="number"
                        value={questionForm.time_limit_sec}
                        onChange={(e) =>
                          setQuestionForm((v) => ({
                            ...v,
                            time_limit_sec: e.target.value,
                          }))
                        }
                        min={3}
                        max={600}
                        disabled={busy}
                      />
                    </label>

                    <label style={CreateQuizPageStyle.smallField}>
                      <span style={CreateQuizPageStyle.label}>Points</span>
                      <input
                        style={CreateQuizPageStyle.input}
                        type="number"
                        value={questionForm.points}
                        onChange={(e) =>
                          setQuestionForm((v) => ({
                            ...v,
                            points: e.target.value,
                          }))
                        }
                        min={0}
                        max={100000}
                        disabled={busy}
                      />
                    </label>

                    <button
                      type="submit"
                      className="tv-card tv-card--hover"
                      style={{
                        ...CreateQuizPageStyle.primaryBtn,
                        background: colors.gradients.main,
                        alignSelf: 'flex-end',
                      }}
                      disabled={busy}
                    >
                      Add ➕
                    </button>
                  </form>
                </div>

                <div style={CreateQuizPageStyle.questionsGrid}>
                  {questions.map((q) => {
                    const draft = optionDrafts[q.id] || {
                      option_text: '',
                      is_correct: false,
                      order_index: (q.options?.length || 0) + 1,
                    };

                    return (
                      <div
                        key={q.id}
                        className="tv-card tv-card--hover"
                        style={CreateQuizPageStyle.questionCard}
                      >
                        <div style={CreateQuizPageStyle.questionTop}>
                          <div style={CreateQuizPageStyle.questionNumber}>
                            Q{q.order_index}
                          </div>
                          <div style={CreateQuizPageStyle.questionMeta}>
                            <span style={CreateQuizPageStyle.questionMetaItem}>
                              ⏱ {q.time_limit_sec}s
                            </span>
                            <span style={CreateQuizPageStyle.questionMetaItem}>
                              ⭐ {q.points}
                            </span>
                          </div>
                        </div>

                        <div style={CreateQuizPageStyle.questionText}>
                          {q.question_text}
                        </div>

                        <div style={CreateQuizPageStyle.options}>
                          {(q.options || []).slice().sort(sortByOrderIndex).map((o) => (
                            <div key={o.id} style={CreateQuizPageStyle.optionRow}>
                              <div style={CreateQuizPageStyle.optionLabel}>
                                {o.order_index}.
                              </div>
                              <div style={CreateQuizPageStyle.optionText}>
                                {o.option_text}
                              </div>
                              {o.is_correct && (
                                <span style={CreateQuizPageStyle.correctPill}>
                                  correct
                                </span>
                              )}
                            </div>
                          ))}
                          {(q.options || []).length === 0 && (
                            <div style={CreateQuizPageStyle.emptyOptions}>
                              Add at least 2 options and mark 1 as correct.
                            </div>
                          )}
                        </div>

                        <form
                          style={CreateQuizPageStyle.addOptionRow}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setError('');
                            setBusy(true);
                            try {
                              await api.addOption(q.id, {
                                option_text: draft.option_text,
                                is_correct: !!draft.is_correct,
                                order_index: Number(draft.order_index) || 1,
                              });
                              setOptionDrafts((m) => ({
                                ...m,
                                [q.id]: {
                                  option_text: '',
                                  is_correct: false,
                                  order_index: (q.options?.length || 0) + 2,
                                },
                              }));
                              await refreshQuestions(quiz.id);
                            } catch (err) {
                              if (isUnauthorized(err)) return onRequireAuth?.();
                              setError(getApiErrorMessage(err));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <input
                            style={CreateQuizPageStyle.input}
                            value={draft.option_text}
                            onChange={(e) =>
                              setOptionDrafts((m) => ({
                                ...m,
                                [q.id]: { ...draft, option_text: e.target.value },
                              }))
                            }
                            placeholder="Option text"
                            maxLength={300}
                            required
                            disabled={busy}
                          />

                          <label style={CreateQuizPageStyle.checkbox}>
                            <input
                              type="checkbox"
                              checked={!!draft.is_correct}
                              onChange={(e) =>
                                setOptionDrafts((m) => ({
                                  ...m,
                                  [q.id]: { ...draft, is_correct: e.target.checked },
                                }))
                              }
                              disabled={busy}
                            />
                            correct
                          </label>

                          <button
                            type="submit"
                            className="tv-card tv-card--hover"
                            style={{
                              ...CreateQuizPageStyle.secondaryBtn,
                              background: colors.neutral.white,
                            }}
                            disabled={busy}
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
