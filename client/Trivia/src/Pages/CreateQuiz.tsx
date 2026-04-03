import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import CreateQuizPageStyle from '@/Styles/ComponentStyles/CreateQuizPageStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type CreateQuizUser = {
  id?: string;
} | null;

type CreateQuizProps = {
  user?: CreateQuizUser;
  onRequireAuth?: () => void;
  onNavigateHome?: () => void;
};

function sortByOrderIndex(a: any, b: any) {
  return (a?.order_index ?? 0) - (b?.order_index ?? 0);
}

function validateQuestionsForPublish(questions: any[] = []) {
  const issues: string[] = [];
  for (const q of questions || []) {
    const opts = Array.isArray(q?.options) ? q.options : [];
    const optionCount = opts.length;
    const correctCount = opts.filter((o) => !!o.is_correct).length;
    const hasExplanation = !!String(q?.explanation || '').trim();

    if (optionCount < 2) {
      issues.push(
        STRINGS.CREATE_QUIZ.validation.questionNeedsOptions(q?.order_index ?? '?')
      );
    }
    if (correctCount !== 1) {
      issues.push(
        STRINGS.CREATE_QUIZ.validation.questionNeedsCorrect(
          q?.order_index ?? '?',
          correctCount
        )
      );
    }
    if (!hasExplanation) {
      issues.push(
        STRINGS.CREATE_QUIZ.validation.questionNeedsExplanation(q?.order_index ?? '?')
      );
    }
  }
  return issues;
}

export default function CreateQuiz({
  user,
  onRequireAuth,
  onNavigateHome,
}: CreateQuizProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [quiz, setQuiz] = useState<any>(null);
  const [quizEdit, setQuizEdit] = useState<any>(null);
  const [quizIdInput, setQuizIdInput] = useState('');

  const [quizForm, setQuizForm] = useState<{
    title: string;
    description: string;
    keywords: string;
    visibility: string;
  }>({
    title: STRINGS.CREATE_QUIZ.defaults.title,
    description: STRINGS.CREATE_QUIZ.defaults.description,
    keywords: '',
    visibility: STRINGS.CREATE_QUIZ.defaults.visibility,
  });

  const [myQuizzesBusy, setMyQuizzesBusy] = useState(false);
  const [myQuizFilter, setMyQuizFilter] = useState('');
  const [myQuizzes, setMyQuizzes] = useState<any[]>([]);

  const [questions, setQuestions] = useState<any[]>([]);
  const [questionForm, setQuestionForm] = useState<{
    question_text: string;
    explanation: string;
    time_limit_sec: number | string;
    points: number | string;
  }>({
    question_text: '',
    explanation: '',
    time_limit_sec: 30,
    points: 100,
  });

  const [optionDrafts, setOptionDrafts] = useState<Record<string, any>>({});
  const [explanationDrafts, setExplanationDrafts] = useState<Record<string, string>>({});
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessUsername, setAccessUsername] = useState('');
  const [accessList, setAccessList] = useState<any[]>([]);

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
    async (quizId: string) => {
      setError('');
      setBusy(true);
      try {
        const loaded = (await api.getQuiz(String(quizId).trim())) as any;
        setQuiz(loaded);
        setQuizEdit({
          title: loaded.title || '',
          description: loaded.description || '',
          keywords: loaded.keywords || '',
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

  const deleteQuiz = useCallback(
    async (quizId: string) => {
      const id = String(quizId || '').trim();
      if (!id) return;

      const ok = window.confirm(STRINGS.CREATE_QUIZ.buttons.deleteQuizForeverConfirm);
      if (!ok) return;

      setBusy(true);
      setError('');
      try {
        await api.deleteQuiz(id);
        if (quiz?.id === id) {
          setQuiz(null);
          setQuizEdit(null);
          setQuestions([]);
          setAccessList([]);
          setQuizIdInput('');
        }
        await refreshMyQuizzes();
      } catch (err) {
        if (isUnauthorized(err)) return onRequireAuth?.();
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [onRequireAuth, quiz?.id, refreshMyQuizzes]
  );

  const refreshAccess = useCallback(async () => {
    if (!quiz?.id) return;
    setAccessBusy(true);
    try {
      const list = (await api.listQuizAccess(quiz.id)) as any[];
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

    const publishIssues = validateQuestionsForPublish(questions);
    const canPublish = quiz.status !== 'published' && publishIssues.length === 0;
    const pillStyle = CreateQuizPageStyle.pillState(quiz.status === 'published');
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
              <span style={CreateQuizPageStyle.metaIcon}>{ICONS.common.lock}</span>
              {quiz.visibility}
            </span>
            <span style={CreateQuizPageStyle.metaItem}>
              <span style={CreateQuizPageStyle.metaIcon}>{ICONS.common.id}</span>
              <code style={CreateQuizPageStyle.code}>{quiz.id}</code>
            </span>
          </div>
        </div>

        <div style={CreateQuizPageStyle.actions}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={CreateQuizPageStyle.actionBtnWhite}
            onClick={onNavigateHome}
          >
            {STRINGS.COMMON.symbols.leftArrow} {STRINGS.CREATE_QUIZ.buttons.backHome}
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={CreateQuizPageStyle.actionBtnDelete}
            disabled={busy}
            onClick={() => deleteQuiz(quiz.id)}
            title={STRINGS.CREATE_QUIZ.buttons.deleteThisQuizTitle}
          >
            {STRINGS.CREATE_QUIZ.buttons.deleteQuiz}
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={CreateQuizPageStyle.actionBtnPublish}
            disabled={busy || !canPublish}
            onClick={async () => {
              const issues = validateQuestionsForPublish(questions);
              if (issues.length > 0) {
                setError(STRINGS.CREATE_QUIZ.publish.fixBefore(issues));
                return;
              }
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
            title={
              canPublish
                ? STRINGS.CREATE_QUIZ.buttons.publish
                : publishIssues.length
                  ? STRINGS.CREATE_QUIZ.buttons.publishDisabledTitle
                  : STRINGS.CREATE_QUIZ.buttons.publish
            }
          >
            {STRINGS.CREATE_QUIZ.buttons.publishRocket}
          </button>
        </div>
      </div>
    );
  }, [busy, deleteQuiz, onNavigateHome, onRequireAuth, quiz, questions, refreshMyQuizzes]);

  const refreshQuestions = async (quizId: string) => {
    const list = (await api.listQuizQuestions(quizId)) as any[];
    setQuestions(Array.isArray(list) ? list.sort(sortByOrderIndex) : []);
  };

  const setCorrectOption = async (question: any, optionId: string) => {
    if (!question?.id || !optionId || busy) return;
    const opts = (question.options || []).slice().sort(sortByOrderIndex);
    if (opts.length === 0) return;

    setBusy(true);
    setError('');
    try {
      for (const o of opts) {
        await api.patchOption(o.id, { is_correct: o.id === optionId });
      }
      await refreshQuestions(quiz.id);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
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
            <span style={CreateQuizPageStyle.heroBadgeIcon}>{ICONS.common.palette}</span>
            <span style={CreateQuizPageStyle.heroBadgeText}>
              {STRINGS.CREATE_QUIZ.hero.badgeText}
            </span>
            <span style={CreateQuizPageStyle.heroBadgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={CreateQuizPageStyle.heroTitle}>
            {STRINGS.CREATE_QUIZ.hero.titlePrefix}{' '}
            <span style={CreateQuizPageStyle.heroTitleAccent}>
              {STRINGS.CREATE_QUIZ.hero.titleAccent}
            </span>
          </h1>
          <p style={CreateQuizPageStyle.heroSubtitle}>
            {STRINGS.CREATE_QUIZ.hero.subtitle}
          </p>
        </div>

        {!canUseBuilder ? (
          <div className="tv-card" style={CreateQuizPageStyle.lockCard}>
            <h2 style={CreateQuizPageStyle.lockTitle}>{STRINGS.CREATE_QUIZ.locked.title}</h2>
            <p style={CreateQuizPageStyle.lockText}>
              {STRINGS.CREATE_QUIZ.locked.subtitle}
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={CreateQuizPageStyle.primaryBtnMain}
              onClick={() => onRequireAuth?.()}
            >
              {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
            </button>
          </div>
        ) : (
          <>
            {!!error && (
              <div className="tv-card" style={CreateQuizPageStyle.errorCard}>
                <div style={CreateQuizPageStyle.errorTitle}>{STRINGS.CREATE_QUIZ.errorTitle}</div>
                <div style={CreateQuizPageStyle.errorText}>{error}</div>
              </div>
            )}

            <div style={CreateQuizPageStyle.grid}>
              <div className="tv-card" style={CreateQuizPageStyle.panel}>
                <h2 style={CreateQuizPageStyle.panelTitle}>{STRINGS.CREATE_QUIZ.panels.create}</h2>

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
                        keywords: created.keywords || '',
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
                    <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.title}</span>
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
                    <span style={CreateQuizPageStyle.label}>
                      {STRINGS.CREATE_QUIZ.labels.description}
                    </span>
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
                    <span style={CreateQuizPageStyle.label}>
                      {STRINGS.CREATE_QUIZ.labels.keywords}
                    </span>
                    <input
                      style={CreateQuizPageStyle.input}
                      value={quizForm.keywords}
                      onChange={(e) =>
                        setQuizForm((v) => ({ ...v, keywords: e.target.value }))
                      }
                      placeholder={STRINGS.CREATE_QUIZ.placeholders.keywords}
                      maxLength={200}
                      disabled={busy}
                    />
                    <div style={CreateQuizPageStyle.panelHint}>
                      {STRINGS.CREATE_QUIZ.help.keywordsHint}
                    </div>
                  </label>

                  <label style={CreateQuizPageStyle.field}>
                    <span style={CreateQuizPageStyle.label}>
                      {STRINGS.CREATE_QUIZ.labels.visibility}
                    </span>
                    <select
                      style={CreateQuizPageStyle.input}
                      value={quizForm.visibility}
                      onChange={(e) =>
                        setQuizForm((v) => ({ ...v, visibility: e.target.value }))
                      }
                      disabled={busy}
                    >
                      <option value={STRINGS.COMMON.visibility.private}>
                        {STRINGS.COMMON.visibility.private}
                      </option>
                      <option value={STRINGS.COMMON.visibility.public}>
                        {STRINGS.COMMON.visibility.public}
                      </option>
                      <option value={STRINGS.COMMON.visibility.unlisted}>
                        {STRINGS.COMMON.visibility.unlisted}
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="tv-card tv-card--hover"
                    style={CreateQuizPageStyle.primaryBtnMain}
                    disabled={busy}
                  >
                    {STRINGS.CREATE_QUIZ.buttons.createDraft}
                  </button>
                </form>
              </div>

              <div className="tv-card" style={CreateQuizPageStyle.panel}>
                <div style={CreateQuizPageStyle.panelWideHeader}>
                  <h2 style={CreateQuizPageStyle.panelTitle}>{STRINGS.CREATE_QUIZ.panels.myQuizzes}</h2>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={CreateQuizPageStyle.secondaryBtnWhite}
                    disabled={busy || myQuizzesBusy}
                    onClick={async () => {
                      setError('');
                      await refreshMyQuizzes();
                    }}
                  >
                    {STRINGS.CREATE_QUIZ.buttons.refresh}
                  </button>
                </div>

                <p style={CreateQuizPageStyle.panelHint}>
                  {STRINGS.CREATE_QUIZ.help.myQuizzesHint}
                </p>

                <label style={CreateQuizPageStyle.field}>
                  <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.search}</span>
                  <input
                    style={CreateQuizPageStyle.input}
                    value={myQuizFilter}
                    onChange={(e) => setMyQuizFilter(e.target.value)}
                    placeholder={STRINGS.CREATE_QUIZ.placeholders.quizTitleSearch}
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
                      <div key={q.id} style={CreateQuizPageStyle.myQuizRow}>
                        <button
                          type="button"
                          className="tv-card tv-card--hover"
                          style={CreateQuizPageStyle.myQuizItemOpen}
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

                        <button
                          type="button"
                          className="tv-card tv-card--hover"
                          style={CreateQuizPageStyle.myQuizDeleteBtn}
                          disabled={busy}
                          onClick={() => deleteQuiz(q.id)}
                          title={STRINGS.CREATE_QUIZ.buttons.deleteQuizTitle}
                        >
                          🗑
                        </button>
                      </div>
                    ))}

                  {(!myQuizzes || myQuizzes.length === 0) && !myQuizzesBusy && (
                    <div style={CreateQuizPageStyle.emptyOptions}>
                      {STRINGS.CREATE_QUIZ.empty.noQuizzes}
                    </div>
                  )}

                  {myQuizzesBusy && (
                    <div style={CreateQuizPageStyle.emptyOptions}>
                      {STRINGS.CREATE_QUIZ.empty.loadingOptions}
                    </div>
                  )}
                </div>

                <div style={CreateQuizPageStyle.inlineRow}>
                  <input
                    style={CreateQuizPageStyle.input}
                    value={quizIdInput}
                    onChange={(e) => setQuizIdInput(e.target.value)}
                    placeholder={STRINGS.CREATE_QUIZ.placeholders.quizId}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={CreateQuizPageStyle.secondaryBtnWhite}
                    disabled={busy || !quizIdInput.trim()}
                    onClick={async () => {
                      await loadQuiz(quizIdInput.trim());
                    }}
                  >
                    {STRINGS.CREATE_QUIZ.buttons.open}
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
                      <h2 style={CreateQuizPageStyle.panelTitle}>{STRINGS.CREATE_QUIZ.panels.settings}</h2>
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={CreateQuizPageStyle.secondaryBtnWhite}
                        disabled={busy}
                        onClick={() => {
                          setQuiz(null);
                          setQuizEdit(null);
                          setQuestions([]);
                          setOptionDrafts({});
                        }}
                      >
                        {STRINGS.CREATE_QUIZ.buttons.close}
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
                            keywords: quizEdit.keywords || null,
                            visibility: quizEdit.visibility,
                          });
                          setQuiz(updated);
                          setQuizEdit({
                            title: updated.title || '',
                            description: updated.description || '',
                            keywords: updated.keywords || '',
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
                        <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.title}</span>
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
                        <span style={CreateQuizPageStyle.label}>
                          {STRINGS.CREATE_QUIZ.labels.description}
                        </span>
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
                        <span style={CreateQuizPageStyle.label}>
                          {STRINGS.CREATE_QUIZ.labels.keywords}
                        </span>
                        <input
                          style={CreateQuizPageStyle.input}
                          value={quizEdit.keywords}
                          onChange={(e) =>
                            setQuizEdit((v) => ({ ...v, keywords: e.target.value }))
                          }
                          placeholder={STRINGS.CREATE_QUIZ.placeholders.keywords}
                          maxLength={200}
                          disabled={busy}
                        />
                        <div style={CreateQuizPageStyle.panelHint}>
                          {STRINGS.CREATE_QUIZ.help.keywordsHint}
                        </div>
                      </label>

                      <label style={CreateQuizPageStyle.field}>
                        <span style={CreateQuizPageStyle.label}>
                          {STRINGS.CREATE_QUIZ.labels.visibility}
                        </span>
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
                          <option value={STRINGS.COMMON.visibility.private}>
                            {STRINGS.COMMON.visibility.private}
                          </option>
                          <option value={STRINGS.COMMON.visibility.public}>
                            {STRINGS.COMMON.visibility.public}
                          </option>
                          <option value={STRINGS.COMMON.visibility.unlisted}>
                            {STRINGS.COMMON.visibility.unlisted}
                          </option>
                        </select>
                      </label>

                      <button
                        type="submit"
                        className="tv-card tv-card--hover"
                        style={CreateQuizPageStyle.primaryBtnMain}
                        disabled={busy}
                      >
                        {STRINGS.CREATE_QUIZ.buttons.saveChanges}
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
                            style={CreateQuizPageStyle.secondaryBtnWhite}
                            disabled={busy || accessBusy}
                            onClick={refreshAccess}
                          >
                            {STRINGS.CREATE_QUIZ.buttons.refresh}
                          </button>
                        </div>

                        <p style={CreateQuizPageStyle.panelHint}>
                          {STRINGS.CREATE_QUIZ.help.privateAccessHint}
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
                            placeholder={STRINGS.CREATE_QUIZ.placeholders.accessUsername}
                            disabled={busy || accessBusy}
                            minLength={3}
                            maxLength={30}
                            required
                          />
                          <button
                            type="submit"
                            className="tv-card tv-card--hover"
                            style={CreateQuizPageStyle.secondaryBtnWhite}
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
                    <h2 style={CreateQuizPageStyle.panelTitle}>{STRINGS.CREATE_QUIZ.panels.addQuestions}</h2>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={CreateQuizPageStyle.secondaryBtnWhite}
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
                      {STRINGS.CREATE_QUIZ.buttons.refresh}
                    </button>
                  </div>

                  <form
                    style={CreateQuizPageStyle.questionForm}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setError('');
                      const explanation = String(questionForm.explanation || '').trim();
                      if (!explanation) {
                        setError('Explanation is required.');
                        return;
                      }
                      setBusy(true);
                      try {
                        const order_index = (questions?.length || 0) + 1;
                        await api.addQuizQuestion(quiz.id, {
                          question_text: questionForm.question_text,
                          explanation,
                          time_limit_sec: Number(questionForm.time_limit_sec) || 30,
                          points: Number(questionForm.points) || 100,
                          order_index,
                        });
                        setQuestionForm((v) => ({ ...v, question_text: '', explanation: '' }));
                        await refreshQuestions(quiz.id);
                      } catch (err) {
                        if (isUnauthorized(err)) return onRequireAuth?.();
                        setError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label style={CreateQuizPageStyle.fieldFlex1}>
                      <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.questionText}</span>
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
                      <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.timeSec}</span>
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

                    <label style={{ ...CreateQuizPageStyle.fieldFlex1, flexBasis: '100%' }}>
                      <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.explanation}</span>
                      <textarea
                        style={CreateQuizPageStyle.textarea}
                        value={questionForm.explanation}
                        onChange={(e) =>
                          setQuestionForm((v) => ({
                            ...v,
                            explanation: e.target.value,
                          }))
                        }
                        maxLength={2000}
                        placeholder={STRINGS.CREATE_QUIZ.placeholders.explanation}
                        disabled={busy}
                        required
                      />
                    </label>

                    <label style={CreateQuizPageStyle.smallField}>
                      <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.points}</span>
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
                      style={CreateQuizPageStyle.primaryBtnMainEnd}
                      disabled={busy}
                    >
                      {STRINGS.CREATE_QUIZ.buttons.addPlus}
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
                    const opts = (q.options || []).slice().sort(sortByOrderIndex);
                    const correctCount = opts.filter((o) => !!o.is_correct).length;

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

                        <label style={{ ...CreateQuizPageStyle.field, marginTop: 12 }}>
                          <span style={CreateQuizPageStyle.label}>{STRINGS.CREATE_QUIZ.labels.explanation}</span>
                          <textarea
                            style={CreateQuizPageStyle.textarea}
                            value={
                              explanationDrafts[q.id] ??
                              (q.explanation == null ? '' : String(q.explanation))
                            }
                            onChange={(e) =>
                              setExplanationDrafts((m) => ({ ...m, [q.id]: e.target.value }))
                            }
                            maxLength={2000}
                            placeholder={STRINGS.CREATE_QUIZ.placeholders.explanation}
                            disabled={busy}
                          />
                          <button
                            type="button"
                            className="tv-card tv-card--hover"
                            style={CreateQuizPageStyle.secondaryBtnWhite}
                            disabled={busy}
                            onClick={async () => {
                              setError('');
                              const v = String(explanationDrafts[q.id] ?? q.explanation ?? '').trim();
                              if (!v) {
                                setError('Explanation is required.');
                                return;
                              }
                              setBusy(true);
                              try {
                                await api.patchQuestion(q.id, { explanation: v });
                                setExplanationDrafts((m) => ({ ...m, [q.id]: v }));
                                await refreshQuestions(quiz.id);
                              } catch (err) {
                                if (isUnauthorized(err)) return onRequireAuth?.();
                                setError(getApiErrorMessage(err));
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            {STRINGS.CREATE_QUIZ.buttons.saveChanges}
                          </button>
                        </label>

                        <div style={CreateQuizPageStyle.options}>
                          {opts.map((o) => (
                            <div key={o.id} style={CreateQuizPageStyle.optionRow}>
                              <label
                                style={CreateQuizPageStyle.correctRadioLabel}
                                title={STRINGS.CREATE_QUIZ.buttons.markCorrectTitle}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={!!o.is_correct}
                                  disabled={busy}
                                  onChange={() => setCorrectOption(q, o.id)}
                                />
                              </label>
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
                              {STRINGS.CREATE_QUIZ.empty.optionsNeedTwo}
                            </div>
                          )}
                          {(q.options || []).length > 0 && correctCount !== 1 && (
                            <div style={CreateQuizPageStyle.emptyOptions}>
                              This question needs exactly 1 correct option (currently {correctCount}).
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
                            placeholder={STRINGS.CREATE_QUIZ.placeholders.optionText}
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
                            style={CreateQuizPageStyle.secondaryBtnWhite}
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

