import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import AdminQuestionBankTab from './AdminQuestionBankTab';
import { AdminModal } from './AdminUi';
import { getApiErrorMessage } from '@/utils/apiError';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

const DEFAULT_GLOBAL_QUESTION_OPTIONS = [
  STRINGS.ADMIN.placeholders.optionA,
  STRINGS.ADMIN.placeholders.optionB,
  STRINGS.ADMIN.placeholders.optionC,
  STRINGS.ADMIN.placeholders.optionD,
];

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function toggleIdLimited(list, id, max = 0) {
  const exists = list.includes(id);
  if (exists) return list.filter((x) => x !== id);
  if (max && list.length >= max) return list;
  return [...list, id];
}

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div style={AdminDashboardStyle.progressTrack}>
      <div style={AdminDashboardStyle.progressFill(pct)} />
    </div>
  );
}

export default function AdminDashboard({
  user,
  onNavigateHome,
  onNavigateCreateQuiz,
}) {
  const [workspace, setWorkspace] = useState('story'); // story | modes | questions | reports
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [levels, setLevels] = useState([]);
  const [modeCounts, setModeCounts] = useState({
    classic: 0,
    blitz: 0,
    millionaire: 0,
  });

  const [levelForm, setLevelForm] = useState({
    title: '',
    showAdvanced: false,
    difficulty_min: 1,
    difficulty_max: 3,
    pass_score_min: 0,
    xp_reward: 100,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    difficulty_rating: 5,
    correctIndex: 0,
    options: DEFAULT_GLOBAL_QUESTION_OPTIONS,
    modes: { classic: true, blitz: true, millionaire: true },
    showAdvanced: false,
    explanation: '',
    time_limit_sec: 30,
    points: 100,
  });

  const [editQuestion, setEditQuestion] = useState({
    open: false,
    id: '',
    question_text: '',
    explanation: '',
    difficulty_rating: 5,
    time_limit_sec: 30,
    points: 100,
    options: DEFAULT_GLOBAL_QUESTION_OPTIONS,
    correctIndex: 0,
  });

  const [modeSeedCount, setModeSeedCount] = useState({
    classic: 25,
    blitz: 25,
    millionaire: 25,
  });

  const [classicCategoriesOpen, setClassicCategoriesOpen] = useState(false);
  const [classicCategories, setClassicCategories] = useState([]);
  const [classicCategoryForm, setClassicCategoryForm] = useState({ name: '', icon: '' });
  const [classicCategorySeedCounts, setClassicCategorySeedCounts] = useState({});

  const [reportsStatus, setReportsStatus] = useState('open'); // open | resolved
  const [reports, setReports] = useState([]);
  const [reportsLimit] = useState(50);
  const [reportsOffset, setReportsOffset] = useState(0);

  const [pool, setPool] = useState({
    open: false,
    kind: null, // 'mode' | 'level'
    id: '',
    title: '',
    questions: [],
    limit: 50,
    offset: 0,
  });

  const [picker, setPicker] = useState({
    open: false,
    target: null, // { kind:'mode'|'level', id, title }
    q: '',
    results: [],
    selected: [],
    exclude_ids: [],
    maxSelect: 50,
    limit: 30,
    offset: 0,
  });

  const selectedLevel = useMemo(() => {
    if (pool.kind !== 'level') return null;
    return levels.find((l) => l.id === pool.id) || null;
  }, [levels, pool.id, pool.kind]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadReports = async ({ status = reportsStatus, offset = 0 } = {}) => {
    const s = String(status || 'open').trim();
    const off = Math.max(0, Number(offset) || 0);

    setBusy(true);
    clearMessages();
    try {
      const res = await api.adminListQuizReports({ status: s, limit: reportsLimit, offset: off });
      setReports(Array.isArray(res?.entries) ? res.entries : []);
      setReportsStatus(s);
      setReportsOffset(off);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadDashboard = async () => {
    setBusy(true);
    clearMessages();
    try {
      const [levelsRes, classicRes, blitzRes, milRes] = await Promise.all([
        api.adminListStoryLevels(),
        api.adminModePoolSummary('classic'),
        api.adminModePoolSummary('blitz'),
        api.adminModePoolSummary('millionaire'),
      ]);
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
      setModeCounts({
        classic: classicRes?.count ?? 0,
        blitz: blitzRes?.count ?? 0,
        millionaire: milRes?.count ?? 0,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadClassicCategories = async () => {
    setBusy(true);
    clearMessages();
    try {
      const res = await api.adminListClassicCategories();
      setClassicCategories(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openClassicCategories = async () => {
    setClassicCategoriesOpen(true);
    await loadClassicCategories();
  };

  useEffect(() => {
    if (!user) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  useEffect(() => {
    if (!user) return;
    if (workspace !== 'reports') return;
    loadReports({ status: reportsStatus, offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, !!user]);

  const createLevel = async () => {
    const title = String(levelForm.title || '').trim();
    if (!title) return;

    setBusy(true);
    clearMessages();
    try {
      const payload = { title };
      if (levelForm.showAdvanced) {
        payload.difficulty_min = clampInt(levelForm.difficulty_min, 1, 10);
        payload.difficulty_max = clampInt(levelForm.difficulty_max, 1, 10);
        payload.pass_score_min = clampInt(levelForm.pass_score_min, 0, 1000000);
        payload.xp_reward = clampInt(levelForm.xp_reward, 0, 1000000);
      }

      const created = await api.adminCreateStoryLevel(payload);
      setSuccess(STRINGS.ADMIN.toasts.createdLevel(created.level_number, created.title));
      setLevelForm((v) => ({ ...v, title: '' }));
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const createQuestion = async () => {
    const question_text = String(questionForm.question_text || '').trim();
    if (!question_text) return;

    const explanation = String(questionForm.explanation || '').trim();
    if (!explanation) {
      setError('Explanation is required.');
      return;
    }

    const options = (questionForm.options || [])
      .map((t) => String(t || '').trim())
      .filter(Boolean);
    if (options.length < 2) return;

    const correctIndex = Math.max(
      0,
      Math.min(options.length - 1, Number(questionForm.correctIndex) || 0)
    );
    const payloadOptions = options.map((t, idx) => ({
      option_text: t,
      is_correct: idx === correctIndex,
    }));
    const modes = Object.entries(questionForm.modes || {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);

    setBusy(true);
    clearMessages();
    try {
      const payload = {
        question_text,
        difficulty_rating: clampInt(questionForm.difficulty_rating, 1, 10),
        explanation,
        options: payloadOptions,
        modes: questionForm.showAdvanced ? modes : [],
      };
      if (questionForm.showAdvanced) {
        payload.time_limit_sec = clampInt(questionForm.time_limit_sec, 3, 600);
        payload.points = clampInt(questionForm.points, 0, 100000);
      }

      const res = await api.adminCreateGlobalQuestion(payload);
      setSuccess(STRINGS.ADMIN.toasts.createdQuestion(res.question_id));
      setQuestionForm((v) => ({
        ...v,
        question_text: '',
        correctIndex: 0,
        options: DEFAULT_GLOBAL_QUESTION_OPTIONS,
        explanation: '',
      }));
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteLevel = async (lvl) => {
    if (!lvl?.id) return;
    const levelId = String(lvl.id || '').trim();
    if (!levelId) return;

    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.confirm.deleteStoryLevel(lvl.level_number, lvl.title));
    if (!ok) return;

    setBusy(true);
    clearMessages();
    try {
      await api.adminDeleteStoryLevel(levelId);
      setSuccess(STRINGS.ADMIN.toasts.levelDeleted);
      if (pool.open && pool.kind === 'level' && pool.id === levelId) {
        setPool((v) => ({ ...v, open: false }));
      }
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const createClassicCategory = async () => {
    const name = String(classicCategoryForm.name || '').trim();
    const icon = String(classicCategoryForm.icon || '').trim();
    if (!name) return;

    setBusy(true);
    clearMessages();
    try {
      await api.adminCreateClassicCategory({ name, icon: icon || null });
      setSuccess(STRINGS.ADMIN.toasts.categoryCreated);
      setClassicCategoryForm({ name: '', icon: '' });
      await loadClassicCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteClassicCategory = async (categoryId, categoryName) => {
    const cid = String(categoryId || '').trim();
    if (!cid) return;
    const name =
      String(categoryName || '').trim() || STRINGS.ADMIN.text.thisCategoryFallback;

    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.confirm.deleteClassicCategory(name));
    if (!ok) return;

    setBusy(true);
    clearMessages();
    try {
      await api.adminDeleteClassicCategory(cid);
      setSuccess(STRINGS.ADMIN.toasts.categoryDeleted);
      await loadClassicCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openEditGlobalQuestion = async (questionId) => {
    const qid = String(questionId || '').trim();
    if (!qid) return;

    setBusy(true);
    clearMessages();
    try {
      const q = await api.adminGetGlobalQuestion(qid);
      const opts = Array.isArray(q?.options) ? q.options.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) : [];
      const optionTexts = opts.map((o) => String(o?.option_text || '').trim());
      const correctIndex = Math.max(
        0,
        Math.min(optionTexts.length - 1, opts.findIndex((o) => !!o.is_correct))
      );

      setEditQuestion({
        open: true,
        id: qid,
        question_text: q?.question_text || '',
        explanation: q?.explanation || '',
        difficulty_rating: Number(q?.difficulty_rating) || 5,
        time_limit_sec: Number(q?.time_limit_sec) || 30,
        points: Number(q?.points) || 100,
        options: optionTexts.length ? optionTexts : DEFAULT_GLOBAL_QUESTION_OPTIONS,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveEditedGlobalQuestion = async () => {
    const qid = String(editQuestion.id || '').trim();
    if (!qid) return;

    const question_text = String(editQuestion.question_text || '').trim();
    const explanation = String(editQuestion.explanation || '').trim();
    if (!question_text) {
      setError('Question text is required.');
      return;
    }
    if (!explanation) {
      setError('Explanation is required.');
      return;
    }

    const options = (editQuestion.options || []).map((t) => String(t || '').trim()).filter(Boolean);
    if (options.length < 2) {
      setError('Provide at least 2 options.');
      return;
    }

    const correctIndex = Math.max(0, Math.min(options.length - 1, Number(editQuestion.correctIndex) || 0));
    const payloadOptions = options.map((t, idx) => ({ option_text: t, is_correct: idx === correctIndex }));

    setBusy(true);
    clearMessages();
    try {
      await api.adminPatchGlobalQuestion(qid, {
        question_text,
        explanation,
        difficulty_rating: clampInt(editQuestion.difficulty_rating, 1, 10),
        time_limit_sec: clampInt(editQuestion.time_limit_sec, 3, 600),
        points: clampInt(editQuestion.points, 0, 100000),
      });

      await api.adminReplaceGlobalQuestionOptions(qid, { options: payloadOptions });
      setSuccess('Question updated.');

      // Refresh picker/pool lists if open so admins see changes immediately.
      if (pool.open && pool.kind && pool.id) {
        await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: pool.offset });
      }
      if (picker.open) {
        await loadPicker({ q: picker.q, offset: picker.offset, keepSelected: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const seedClassicCategoryPool = async (categoryId) => {
    const cid = String(categoryId || '').trim();
    if (!cid) return;
    const count = clampInt(classicCategorySeedCounts[cid] ?? 25, 1, 100);

    setBusy(true);
    clearMessages();
    try {
      const res = await api.adminSeedClassicCategoryPool(cid, { random_count: count });
      setSuccess(STRINGS.ADMIN.toasts.autoFilledCategory(res.added_count || 0));
      await loadClassicCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const modes = useMemo(
    () => [
      { key: 'classic', ...STRINGS.ADMIN.modeCards.classic },
      { key: 'blitz', ...STRINGS.ADMIN.modeCards.blitz },
      { key: 'millionaire', ...STRINGS.ADMIN.modeCards.millionaire },
    ],
    []
  );

  const loadPool = async ({ kind, id, title, offset = 0 }) => {
    const lim = pool.limit || 50;
    setBusy(true);
    clearMessages();
    try {
      let res;
      if (kind === 'mode') {
        res = await api.adminListModePoolQuestions(id, { limit: lim, offset });
      } else if (kind === 'level') {
        res = await api.adminListStoryLevelPoolQuestions(id, { limit: lim, offset });
      } else if (kind === 'classic_category') {
        res = await api.adminListClassicCategoryPoolQuestions(id, { limit: lim, offset });
      } else {
        res = { questions: [] };
      }

      setPool((v) => ({
        ...v,
        open: true,
        kind,
        id,
        title,
        questions: Array.isArray(res?.questions) ? res.questions : [],
        offset,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeFromPool = async (questionId) => {
    const qid = String(questionId || '').trim();
    if (!qid) return;
    if (!pool.kind || !pool.id) return;

    setBusy(true);
    clearMessages();
    try {
      if (pool.kind === 'mode') {
        await api.adminRemoveModePool(pool.id, { question_ids: [qid] });
      } else if (pool.kind === 'level') {
        await api.adminRemoveStoryLevelPool(pool.id, { question_ids: [qid] });
      } else if (pool.kind === 'classic_category') {
        await api.adminRemoveClassicCategoryPool(pool.id, { question_ids: [qid] });
      } else {
        return;
      }
      await loadPool({
        kind: pool.kind,
        id: pool.id,
        title: pool.title,
        offset: pool.offset,
      });
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const clearPool = async () => {
    if (!pool.kind || !pool.id) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.confirm.clearPoolGeneric);
    if (!ok) return;

    setBusy(true);
    clearMessages();
    try {
      if (pool.kind === 'mode') {
        await api.adminReplaceModePool(pool.id, { question_ids: [] });
      } else if (pool.kind === 'level') {
        await api.adminReplaceStoryLevelPool(pool.id, { question_ids: [] });
      } else if (pool.kind === 'classic_category') {
        await api.adminReplaceClassicCategoryPool(pool.id, { question_ids: [] });
      } else {
        return;
      }
      setSuccess(STRINGS.ADMIN.toasts.poolCleared);
      await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: 0 });
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadPicker = async ({ q, offset, keepSelected, excludeIds } = {}) => {
    setBusy(true);
    clearMessages();
    try {
      const query = String(q ?? picker.q ?? '').trim();
      const off = Math.max(0, Number(offset) || 0);
      const lim = picker.limit || 30;
      const res = await api.adminListGlobalQuestions({ q: query, limit: lim, offset: off });

      const excludeSet = new Set(((excludeIds ?? picker.exclude_ids) || []).filter(Boolean));
      const filteredResults = Array.isArray(res?.results)
        ? res.results.filter((r) => !excludeSet.has(r.id))
        : [];
      setPicker((v) => ({
        ...v,
        q: query,
        results: filteredResults,
        offset: off,
        selected: keepSelected ? (v.selected || []).filter((id) => !excludeSet.has(id)) : [],
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const listAllPoolQuestionIds = async ({ kind, id }) => {
    const k = String(kind || '').trim();
    const targetId = String(id || '').trim();
    if (!k || !targetId) return [];

    const res =
      k === 'mode'
        ? await api.adminModePoolIds(targetId)
        : k === 'level'
          ? await api.adminStoryLevelPoolIds(targetId)
          : k === 'classic_category'
            ? await api.adminClassicCategoryPoolIds(targetId)
            : null;

    const ids = Array.isArray(res?.ids) ? res.ids : [];
    return Array.from(new Set(ids.filter(Boolean)));
  };

  const openPicker = async ({ kind, id, title }) => {
    setPicker((v) => ({
      ...v,
      open: true,
      target: { kind, id, title },
      q: '',
      results: [],
      selected: [],
      exclude_ids: [],
      offset: 0,
    }));

    let exclude_ids = [];
    try {
      const targetPoolIds = await listAllPoolQuestionIds({ kind, id });
      exclude_ids = Array.isArray(targetPoolIds) ? targetPoolIds : [];
    } catch {
      // ignore
    }

    try {
      const storyAssigned = await api.adminStoryAssignedQuestionIds();
      const storyIds = Array.isArray(storyAssigned?.ids) ? storyAssigned.ids : [];
      exclude_ids = Array.from(new Set([...(exclude_ids || []), ...storyIds].filter(Boolean)));
    } catch {
      // ignore
    }

    setPicker((v) => ({ ...v, exclude_ids }));

    await loadPicker({ q: '', offset: 0, keepSelected: false, excludeIds: exclude_ids });
  };

  const addPickerSelection = async ({ replace = false } = {}) => {
    if (!picker.target) return;
    const ids = Array.from(new Set((picker.selected || []).filter(Boolean)));
    if (ids.length === 0) return;

    setBusy(true);
    clearMessages();
    try {
      if (picker.target.kind === 'mode') {
        if (replace) await api.adminReplaceModePool(picker.target.id, { question_ids: ids });
        else await api.adminAddModePool(picker.target.id, { question_ids: ids });
      } else if (picker.target.kind === 'level') {
        if (replace)
          await api.adminReplaceStoryLevelPool(picker.target.id, { question_ids: ids });
        else await api.adminAddStoryLevelPool(picker.target.id, { question_ids: ids });
      } else if (picker.target.kind === 'classic_category') {
        if (replace)
          await api.adminReplaceClassicCategoryPool(picker.target.id, { question_ids: ids });
        else await api.adminAddClassicCategoryPool(picker.target.id, { question_ids: ids });
      } else {
        return;
      }

      setSuccess(replace ? STRINGS.ADMIN.toasts.poolReplaced : STRINGS.ADMIN.toasts.questionsAdded);
      setPicker((v) => ({ ...v, open: false, selected: [] }));
      await loadDashboard();
      if (pool.open && pool.kind === picker.target.kind && pool.id === picker.target.id) {
        await loadPool({
          kind: pool.kind,
          id: pool.id,
          title: pool.title,
          offset: pool.offset,
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const seedModePool = async (mode) => {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) return;
    const count = clampInt(modeSeedCount[m] ?? 25, 1, 100);

    setBusy(true);
    clearMessages();
    try {
      const res = await api.adminSeedModePool(m, { random_count: count });
      setSuccess(STRINGS.ADMIN.toasts.autoFilledMode(m, res.added_count || 0));
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const seedStoryLevelPool = async (levelId) => {
    const lid = String(levelId || '').trim();
    if (!lid) return;
    const level = levels.find((l) => l.id === lid);
    const poolCount = Number(level?.pool_count);
    const missing = Number.isFinite(poolCount) ? Math.max(0, 10 - poolCount) : 10;
    const count = Math.max(1, Math.min(50, missing || 10));

    setBusy(true);
    clearMessages();
    try {
      const res = await api.adminSeedStoryLevelPool(lid, { random_count: count });
      setSuccess(STRINGS.ADMIN.toasts.autoFilledLevel(res.added_count || 0));
      await loadDashboard();
      if (pool.open && pool.kind === 'level' && pool.id === lid) {
        await loadPool({ kind: 'level', id: lid, title: pool.title, offset: pool.offset });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={AdminStyle.page}>
      <div style={AdminStyle.container}>
        <div style={AdminStyle.hero}>
          <div style={AdminStyle.badge}>
            <span style={AdminStyle.badgeIcon}>{ICONS.common.wrench}</span>
            <span style={AdminStyle.badgeText}>{STRINGS.ADMIN.dashboard.badge}</span>
            <span style={AdminStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={AdminStyle.title}>{STRINGS.ADMIN.dashboard.title}</h1>
          <p style={AdminStyle.subtitle}>{STRINGS.ADMIN.dashboard.subtitle}</p>
        </div>

        <div className="tv-card" style={AdminStyle.card}>
          <div style={AdminDashboardStyle.cardTopRowBetween}>
            <div style={AdminStyle.row}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={loadDashboard}
                disabled={busy}
              >
                {STRINGS.COMMON.buttons.refresh}
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={onNavigateHome}
                disabled={busy}
              >
                {STRINGS.COMMON.buttons.home}
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btnPrimaryFull}
                onClick={onNavigateCreateQuiz}
                disabled={busy}
              >
                {STRINGS.ADMIN.actions.customQuizBuilder}
              </button>
            </div>

            <div style={AdminStyle.row}>
              <span style={AdminStyle.pill}>
                {STRINGS.ADMIN.pills.classic} {modeCounts.classic ?? '-'}
              </span>
              <span style={AdminStyle.pill}>
                {STRINGS.ADMIN.pills.blitz} {modeCounts.blitz ?? '-'}
              </span>
              <span style={AdminStyle.pill}>
                {STRINGS.ADMIN.pills.millionaire} {modeCounts.millionaire ?? '-'}
              </span>
            </div>
          </div>

          <div style={AdminDashboardStyle.gridMt14}>
            {[
              {
                key: 'questions',
                icon: ICONS.common.plus,
                ...STRINGS.ADMIN.flows.questions,
              },
              {
                key: 'modes',
                icon: ICONS.common.gamepad,
                ...STRINGS.ADMIN.flows.modes,
              },
              {
                key: 'story',
                icon: ICONS.common.openBook,
                ...STRINGS.ADMIN.flows.story,
              },
              {
                key: 'reports',
                icon: ICONS.common.finishFlag,
                ...STRINGS.ADMIN.flows.reports,
              },
            ].map((a) => (
              <button
                key={a.key}
                type="button"
                className="tv-card tv-card--hover"
                onClick={() => setWorkspace(a.key)}
                disabled={busy}
                style={AdminDashboardStyle.flowCard(workspace === a.key)}
              >
                <div style={AdminDashboardStyle.flowCardHeader}>
                  <div style={AdminDashboardStyle.flowCardIcon}>{a.icon}</div>
                  <div>
                    <div style={AdminDashboardStyle.flowCardTitle}>{a.title}</div>
                    <div style={AdminDashboardStyle.flowCardDesc}>{a.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!!error && <div style={AdminStyle.error}>{error}</div>}
          {!!success && <div style={AdminStyle.success}>{success}</div>}

          {workspace === 'questions' && (
            <AdminQuestionBankTab
              busy={busy}
              questionForm={questionForm}
              setQuestionForm={setQuestionForm}
              onCreateQuestion={createQuestion}
            />
          )}

          {workspace === 'modes' && (
            <div style={AdminStyle.grid}>
              {modes.map((m) => (
                <div key={m.key} style={AdminStyle.section}>
                  <div style={AdminDashboardStyle.modeHeader}>
                    <div>
                      <h3 style={AdminStyle.sectionTitle}>{m.title}</h3>
                      <div style={AdminStyle.sectionSub}>{m.desc}</div>
                    </div>
                    <span style={AdminStyle.pill}>{modeCounts[m.key] ?? '-'}</span>
                  </div>

                  <div style={AdminDashboardStyle.rowMt12}>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btn}
                      onClick={() =>
                        loadPool({
                          kind: 'mode',
                          id: m.key,
                          title: STRINGS.ADMIN.format.modePoolTitle(m.title),
                          offset: 0,
                        })
                      }
                      disabled={busy}
                    >
                      {STRINGS.ADMIN.actions.viewPool}
                    </button>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btnPrimaryFull}
                      onClick={() =>
                        openPicker({
                          kind: 'mode',
                          id: m.key,
                          title: STRINGS.ADMIN.format.modePoolTitle(m.title),
                        })
                      }
                      disabled={busy}
                    >
                      {STRINGS.ADMIN.actions.addQuestions}
                    </button>
                    {m.key === 'classic' && (
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={AdminStyle.btn}
                        onClick={openClassicCategories}
                        disabled={busy}
                      >
                        {STRINGS.ADMIN.actions.categories}
                      </button>
                    )}
                  </div>

                  <div style={AdminDashboardStyle.rowMt10}>
                    <input
                      style={AdminDashboardStyle.inputW110}
                      type="number"
                      min={1}
                      max={100}
                      value={modeSeedCount[m.key] ?? 25}
                      onChange={(e) =>
                        setModeSeedCount((v) => ({
                          ...v,
                          [m.key]: clampInt(e.target.value, 1, 100),
                        }))
                      }
                      disabled={busy}
                    />
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btn}
                      onClick={() => seedModePool(m.key)}
                      disabled={busy}
                      title={STRINGS.ADMIN.hints.seedModePoolTitle}
                    >
                      {STRINGS.ADMIN.actions.autoFillRandom}
                    </button>
                    <span style={AdminStyle.pill}>{STRINGS.ADMIN.pills.addsOnly}</span>
                  </div>

                  <details style={AdminDashboardStyle.detailsMt12}>
                    <summary style={AdminDashboardStyle.detailsSummary}>
                      {STRINGS.ADMIN.sections.dangerZone}
                    </summary>
                    <div style={AdminDashboardStyle.detailsRowMt10}>
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={AdminStyle.btn}
                        disabled={busy}
                        onClick={async () => {
                          // eslint-disable-next-line no-alert
                          const ok = window.confirm(STRINGS.ADMIN.confirm.clearModePool(m.title));
                          if (!ok) return;
                          setBusy(true);
                          clearMessages();
                          try {
                            await api.adminReplaceModePool(m.key, { question_ids: [] });
                            setSuccess(STRINGS.ADMIN.toasts.modePoolCleared(m.title));
                            await loadDashboard();
                          } catch (err) {
                            setError(getApiErrorMessage(err));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {STRINGS.ADMIN.actions.clearPool}
                      </button>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          {workspace === 'story' && (
            <div style={AdminStyle.grid}>
              <div style={AdminStyle.section}>
                <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.createStoryLevel}</h3>
                <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.sections.onlyTitleRequired}</div>

                <div style={AdminStyle.field}>
                  <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.title}</span>
                  <input
                    style={AdminStyle.input}
                    value={levelForm.title}
                    onChange={(e) => setLevelForm((v) => ({ ...v, title: e.target.value }))}
                    placeholder={STRINGS.ADMIN.text.levelTitlePlaceholder}
                    disabled={busy}
                  />
                </div>

                <label style={AdminDashboardStyle.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={!!levelForm.showAdvanced}
                    onChange={(e) =>
                      setLevelForm((v) => ({ ...v, showAdvanced: e.target.checked }))
                    }
                    disabled={busy}
                    style={AdminDashboardStyle.checkboxMr8}
                  />
                  {STRINGS.ADMIN.text.showAdvancedSettings}
                </label>

                {levelForm.showAdvanced && (
                  <>
                    <div style={AdminDashboardStyle.rowMt10}>
                      <label style={AdminDashboardStyle.fieldFlex1NoMt}>
                        <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.difficultyMin}</span>
                        <input
                          style={AdminStyle.input}
                          type="number"
                          min={1}
                          max={10}
                          value={levelForm.difficulty_min}
                          onChange={(e) =>
                            setLevelForm((v) => ({ ...v, difficulty_min: e.target.value }))
                          }
                          disabled={busy}
                        />
                      </label>
                      <label style={AdminDashboardStyle.fieldFlex1NoMt}>
                        <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.difficultyMax}</span>
                        <input
                          style={AdminStyle.input}
                          type="number"
                          min={1}
                          max={10}
                          value={levelForm.difficulty_max}
                          onChange={(e) =>
                            setLevelForm((v) => ({ ...v, difficulty_max: e.target.value }))
                          }
                          disabled={busy}
                        />
                      </label>
                    </div>

                    <div style={AdminDashboardStyle.rowMt10}>
                      <label style={AdminDashboardStyle.fieldFlex1NoMt}>
                        <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.passScoreMin}</span>
                        <input
                          style={AdminStyle.input}
                          type="number"
                          min={0}
                          value={levelForm.pass_score_min}
                          onChange={(e) =>
                            setLevelForm((v) => ({ ...v, pass_score_min: e.target.value }))
                          }
                          disabled={busy}
                        />
                      </label>
                      <label style={AdminDashboardStyle.fieldFlex1NoMt}>
                        <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.xpReward}</span>
                        <input
                          style={AdminStyle.input}
                          type="number"
                          min={0}
                          value={levelForm.xp_reward}
                          onChange={(e) =>
                            setLevelForm((v) => ({ ...v, xp_reward: e.target.value }))
                          }
                          disabled={busy}
                        />
                      </label>
                    </div>
                  </>
                )}

                <div style={AdminDashboardStyle.rowMt14}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btnPrimaryFull}
                    onClick={createLevel}
                    disabled={busy || !String(levelForm.title || '').trim()}
                  >
                    {STRINGS.ADMIN.text.createLevel}
                  </button>
                </div>
              </div>

              <div style={AdminStyle.section}>
                <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.levelsOverview}</h3>
                <div style={AdminStyle.sectionSub}>
                  {STRINGS.ADMIN.text.levelsOverviewHint}
                </div>

                <div style={AdminStyle.list}>
                  {levels.length === 0 ? (
                    <div style={AdminDashboardStyle.emptyText}>
                      {STRINGS.ADMIN.sections.noLevelsFound}
                    </div>
                  ) : (
                    levels.map((lvl) => {
                      const count = Number(lvl.pool_count);
                      const hasCount = Number.isFinite(count);
                      const filled = hasCount ? Math.max(0, Math.min(10, count)) : 0;
                      return (
                        <div key={lvl.id} style={AdminStyle.listItem}>
                          <div style={AdminDashboardStyle.levelRow}>
                              <div style={AdminDashboardStyle.levelLeft}>
                                <div style={AdminStyle.listItemTitle}>
                                 {STRINGS.ADMIN.format.levelListTitle(lvl.level_number, lvl.title)}
                                </div>
                              <div style={AdminDashboardStyle.mt8}>
                                <ProgressBar value={filled} max={10} />
                              </div>
                              <div style={AdminDashboardStyle.listItemMetaMt8}>
                                <span style={AdminStyle.pill}>
                                  {hasCount
                                    ? STRINGS.ADMIN.format.questionsCount(filled, 10)
                                    : STRINGS.ADMIN.text.poolEmpty}
                                </span>
                                <span style={AdminStyle.pill}>
                                  {STRINGS.ADMIN.pills.diff} {lvl.difficulty_min}-{lvl.difficulty_max}
                                </span>
                                <span style={AdminStyle.pill}>
                                  {STRINGS.ADMIN.pills.xp} {lvl.xp_reward}
                                </span>
                              </div>
                            </div>

                            <div style={AdminDashboardStyle.actionCol}>
                              <button
                                type="button"
                                className="tv-card tv-card--hover"
                                style={AdminStyle.btn}
                                onClick={() =>
                                  loadPool({
                                    kind: 'level',
                                    id: lvl.id,
                                    title: STRINGS.ADMIN.format.levelPoolTitle(lvl.level_number),
                                    offset: 0,
                                  })
                                }
                                disabled={busy}
                              >
                                {STRINGS.ADMIN.actions.edit}
                              </button>
                              <button
                                type="button"
                                className="tv-card tv-card--hover"
                                style={AdminStyle.btn}
                                onClick={() => seedStoryLevelPool(lvl.id)}
                                disabled={busy}
                                title={STRINGS.ADMIN.hints.seedLevelPoolTitle}
                              >
                                {STRINGS.ADMIN.actions.autoFill}
                              </button>
                              <button
                                type="button"
                                className="tv-card tv-card--hover"
                                style={AdminStyle.btnDanger}
                                onClick={() => deleteLevel(lvl)}
                                disabled={busy}
                              >
                                {STRINGS.ADMIN.actions.deleteLevel}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {workspace === 'reports' && (
            <div style={AdminStyle.grid}>
              <div style={AdminStyle.section}>
                <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.reports.title}</h3>
                <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.reports.subtitle}</div>

                <div style={AdminDashboardStyle.rowMt12}>
                  <label style={AdminDashboardStyle.fieldFlex1NoMt}>
                    <span style={AdminStyle.label}>{STRINGS.ADMIN.reports.labels.status}</span>
                    <select
                      style={AdminStyle.select}
                      value={reportsStatus}
                      onChange={async (e) => {
                        const next = String(e.target.value || 'open').trim();
                        await loadReports({ status: next, offset: 0 });
                      }}
                      disabled={busy}
                    >
                      <option value="open">{STRINGS.ADMIN.reports.status.open}</option>
                      <option value="resolved">{STRINGS.ADMIN.reports.status.resolved}</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() => loadReports({ status: reportsStatus, offset: 0 })}
                    disabled={busy}
                    title={STRINGS.ADMIN.actions.refreshList}
                  >
                    {STRINGS.ADMIN.actions.refreshList}
                  </button>

                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.offset} {reportsOffset}
                  </span>
                </div>

                <div style={AdminDashboardStyle.listMt12}>
                  {reports.length === 0 ? (
                    <div style={AdminDashboardStyle.emptyText}>{STRINGS.ADMIN.reports.empty}</div>
                  ) : (
                    reports.map((r) => {
                      const quizId = r?.quiz?.id || r?.quiz_id || '';
                      const quizTitle = r?.quiz?.title || STRINGS.ADMIN.reports.fallbackQuizTitle;
                      const ownerId = r?.owner?.id || r?.quiz?.owner_user_id || '';
                      const reporterName =
                        r?.reporter?.username ||
                        r?.reporter?.email ||
                        STRINGS.COMMON.separators.emDash;
                      const ownerName =
                        r?.owner?.username || r?.owner?.email || STRINGS.COMMON.separators.emDash;
                      const createdAt = r?.created_at ? new Date(r.created_at).toLocaleString() : '';

                      return (
                        <div key={r.id} style={AdminStyle.listItem}>
                          <div style={AdminStyle.listItemTitle}>
                            {quizTitle} ({quizId})
                          </div>

                          <div style={AdminStyle.listItemMeta}>
                            <span style={AdminStyle.pill}>
                              {STRINGS.ADMIN.reports.meta.reason}: {r.reason || 'other'}
                            </span>
                            <span style={AdminStyle.pill}>
                              {STRINGS.ADMIN.reports.meta.reporter}: {reporterName}
                            </span>
                            <span style={AdminStyle.pill}>
                              {STRINGS.ADMIN.reports.meta.owner}: {ownerName}
                            </span>
                            {createdAt ? (
                              <span style={AdminStyle.pill}>
                                {STRINGS.ADMIN.reports.meta.createdAt}: {createdAt}
                              </span>
                            ) : null}
                          </div>

                          {r?.message ? (
                            <div style={AdminStyle.smallHelp}>{r.message}</div>
                          ) : null}

                          <div style={AdminDashboardStyle.rowMt12}>
                            <button
                              type="button"
                              className="tv-card tv-card--hover"
                              style={AdminStyle.btnPrimaryFull}
                              disabled={busy || r?.status === 'resolved'}
                              onClick={async () => {
                                setBusy(true);
                                clearMessages();
                                try {
                                  await api.adminResolveQuizReport(r.id);
                                  setSuccess(STRINGS.ADMIN.reports.toasts.resolved);
                                  await loadReports({ status: reportsStatus, offset: 0 });
                                } catch (err) {
                                  setError(getApiErrorMessage(err));
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              {STRINGS.ADMIN.reports.actions.resolve}
                            </button>

                            <button
                              type="button"
                              className="tv-card tv-card--hover"
                              style={AdminStyle.btnDanger}
                              disabled={busy || !quizId}
                              onClick={async () => {
                                // eslint-disable-next-line no-alert
                                const ok = window.confirm(
                                  STRINGS.ADMIN.reports.confirm.deleteQuiz(quizTitle)
                                );
                                if (!ok) return;

                                setBusy(true);
                                clearMessages();
                                try {
                                  await api.adminDeleteCustomQuiz(quizId);
                                  setSuccess(STRINGS.ADMIN.reports.toasts.deletedQuiz);
                                  await loadReports({ status: reportsStatus, offset: 0 });
                                } catch (err) {
                                  setError(getApiErrorMessage(err));
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              {STRINGS.ADMIN.reports.actions.deleteQuiz}
                            </button>

                            <button
                              type="button"
                              className="tv-card tv-card--hover"
                              style={AdminStyle.btn}
                              disabled={busy || !ownerId}
                              onClick={async () => {
                                // eslint-disable-next-line no-alert
                                const ok = window.confirm(
                                  STRINGS.ADMIN.reports.confirm.banUser(ownerName)
                                );
                                if (!ok) return;

                                // eslint-disable-next-line no-alert
                                const reason = window.prompt(
                                  STRINGS.ADMIN.reports.prompts.banReason,
                                  `${STRINGS.ADMIN.reports.prompts.banReasonDefaultPrefix} ${r.reason || 'other'}`
                                );
                                if (reason === null) return;

                                setBusy(true);
                                clearMessages();
                                try {
                                  const body = String(reason || '').trim()
                                    ? { reason: String(reason).trim() }
                                    : {};
                                  await api.adminBanUser(ownerId, body);
                                  setSuccess(STRINGS.ADMIN.reports.toasts.bannedUser);
                                  await loadReports({ status: reportsStatus, offset: 0 });
                                } catch (err) {
                                  setError(getApiErrorMessage(err));
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              {STRINGS.ADMIN.reports.actions.banUser}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={AdminDashboardStyle.rowMt14}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() =>
                      loadReports({
                        status: reportsStatus,
                        offset: Math.max(0, reportsOffset - reportsLimit),
                      })
                    }
                    disabled={busy || reportsOffset <= 0}
                  >
                    {STRINGS.ADMIN.actions.prev}
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() =>
                      loadReports({
                        status: reportsStatus,
                        offset: reportsOffset + reportsLimit,
                      })
                    }
                    disabled={busy || reports.length < reportsLimit}
                  >
                    {STRINGS.ADMIN.actions.next}
                  </button>
                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.showingBare} {reports.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminModal
        open={pool.open}
        title={pool.title}
        onClose={() => setPool((v) => ({ ...v, open: false }))}
      >
        {pool.kind === 'level' && selectedLevel ? (
          <div style={AdminDashboardStyle.rowMb12}>
            <span style={AdminStyle.pill}>
              {STRINGS.ADMIN.format.levelBadgeTitle(
                selectedLevel.level_number,
                selectedLevel.title
              )}
            </span>
            <span style={AdminStyle.pill}>
              {STRINGS.ADMIN.pills.diff} {selectedLevel.difficulty_min}-{selectedLevel.difficulty_max}
            </span>
            <span style={AdminStyle.pill}>
              {STRINGS.ADMIN.pills.xp} {selectedLevel.xp_reward}
            </span>
          </div>
        ) : null}

        <div style={AdminStyle.row}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={() => openPicker({ kind: pool.kind, id: pool.id, title: pool.title })}
            disabled={busy || !pool.id}
          >
            {STRINGS.ADMIN.actions.addQuestions}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              loadPool({
                kind: pool.kind,
                id: pool.id,
                title: pool.title,
                offset: Math.max(0, pool.offset - pool.limit),
              })
            }
            disabled={busy || pool.offset <= 0}
          >
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              loadPool({
                kind: pool.kind,
                id: pool.id,
                title: pool.title,
                offset: pool.offset + pool.limit,
              })
            }
            disabled={busy || pool.questions.length < pool.limit}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.showing} {pool.questions.length}
          </span>
        </div>

        <div style={AdminDashboardStyle.listMt12}>
          {pool.questions.map((q) => (
            <div key={q.id} style={AdminStyle.listItem}>
              <div style={AdminStyle.listItemTitle}>{q.question_text}</div>
              <div style={AdminDashboardStyle.listItemMetaBetween}>
                <div style={AdminDashboardStyle.listItemMetaLeft}>
                  {q.difficulty_rating != null ? (
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.pills.difficultyPrefix}
                      {q.difficulty_rating}
                    </span>
                  ) : null}
                  <span style={AdminStyle.pill}>{q.id}</span>
                </div>
                <div style={AdminStyle.row}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() => openEditGlobalQuestion(q.id)}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.edit}
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() => removeFromPool(q.id)}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.remove}
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btnDanger}
                    onClick={async () => {
                      // eslint-disable-next-line no-alert
                      const ok = window.confirm(STRINGS.ADMIN.confirm.deleteGlobalQuestion);
                      if (!ok) return;

                      const prevPoolQuestions = pool.questions;
                      setPool((v) => ({
                        ...v,
                        questions: (v.questions || []).filter((x) => x?.id !== q.id),
                      }));

                      setBusy(true);
                      clearMessages();
                      try {
                        await api.adminDeleteGlobalQuestion(q.id);
                        setSuccess(STRINGS.ADMIN.toasts.questionDeleted);
                      } catch (err) {
                        setPool((v) => ({ ...v, questions: prevPoolQuestions }));
                        setError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.deleteQuestion}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pool.questions.length === 0 && (
            <div style={AdminDashboardStyle.emptyText}>
              {STRINGS.ADMIN.sections.noQuestionsYet}
            </div>
          )}
        </div>

        <details style={AdminDashboardStyle.detailsMt12}>
          <summary style={AdminDashboardStyle.detailsSummary}>
            {STRINGS.ADMIN.sections.dangerZone}
          </summary>
          <div style={AdminDashboardStyle.detailsRowMt10}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={clearPool}
              disabled={busy}
            >
              {STRINGS.ADMIN.actions.clearPool}
            </button>
          </div>
        </details>
      </AdminModal>

      <AdminModal
        open={picker.open}
        title={
          picker.target
            ? STRINGS.ADMIN.modals.addGlobalQuestionsTitle(picker.target.title)
            : STRINGS.ADMIN.modals.addQuestionsTitle
        }
        onClose={() => setPicker((v) => ({ ...v, open: false }))}
      >
        <div style={AdminStyle.row}>
          <input
            style={AdminDashboardStyle.inputFlex1}
            value={picker.q}
            onChange={(e) => setPicker((v) => ({ ...v, q: e.target.value }))}
            placeholder={STRINGS.ADMIN.text.pickerSearchOptionalPlaceholder}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadPicker({ q: picker.q, offset: 0, keepSelected: true });
            }}
          />
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => loadPicker({ q: picker.q, offset: 0, keepSelected: true })}
            disabled={busy}
          >
            {STRINGS.ADMIN.actions.search}
          </button>
        </div>

        <div style={AdminDashboardStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              setPicker((v) => ({
                ...v,
                selected: v.results.slice(0, v.maxSelect).map((r) => r.id),
              }))
            }
            disabled={busy || picker.results.length === 0}
          >
            {STRINGS.ADMIN.actions.selectPage}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => setPicker((v) => ({ ...v, selected: [] }))}
            disabled={busy || picker.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.clear}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              loadPicker({
                q: picker.q,
                offset: Math.max(0, picker.offset - picker.limit),
                keepSelected: true,
              })
            }
            disabled={busy || picker.offset <= 0}
          >
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              loadPicker({
                q: picker.q,
                offset: picker.offset + picker.limit,
                keepSelected: true,
              })
            }
            disabled={busy || picker.results.length < picker.limit}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.selected} {picker.selected.length}/{picker.maxSelect}
          </span>
        </div>

        <div style={AdminDashboardStyle.listMt12}>
          {picker.results.map((r) => (
            <div key={r.id} style={AdminStyle.listItem}>
              <div style={AdminDashboardStyle.listItemMetaBetween}>
                <label style={AdminDashboardStyle.pickerLabel}>
                  <input
                    type="checkbox"
                    checked={picker.selected.includes(r.id)}
                    onChange={() =>
                      setPicker((v) => ({
                        ...v,
                        selected: toggleIdLimited(v.selected, r.id, v.maxSelect),
                      }))
                    }
                    disabled={busy}
                    style={AdminDashboardStyle.checkboxMt3}
                  />
                  <div>
                    <div style={AdminStyle.listItemTitle}>{r.question_text}</div>
                    <div style={AdminStyle.listItemMeta}>
                      {r.difficulty_rating != null ? (
                        <span style={AdminStyle.pill}>
                          {STRINGS.ADMIN.pills.difficultyPrefix}
                          {r.difficulty_rating}
                        </span>
                      ) : null}
                      <span style={AdminStyle.pill}>{r.id}</span>
                    </div>
                  </div>
                </label>

                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  disabled={busy}
                  onClick={() => openEditGlobalQuestion(r.id)}
                >
                  {STRINGS.ADMIN.actions.edit}
                </button>

                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btnDanger}
                  disabled={busy}
                  onClick={async () => {
                    // eslint-disable-next-line no-alert
                    const ok = window.confirm(STRINGS.ADMIN.confirm.deleteGlobalQuestion);
                    if (!ok) return;

                    const prevResults = picker.results;
                    setPicker((v) => ({
                      ...v,
                      results: (v.results || []).filter((x) => x?.id !== r.id),
                      selected: (v.selected || []).filter((id) => id !== r.id),
                    }));

                    setBusy(true);
                    clearMessages();
                    try {
                      await api.adminDeleteGlobalQuestion(r.id);
                      setSuccess(STRINGS.ADMIN.toasts.questionDeleted);
                    } catch (err) {
                      setPicker((v) => ({ ...v, results: prevResults }));
                      setError(getApiErrorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {STRINGS.ADMIN.actions.deleteQuestion}
                </button>
              </div>
            </div>
          ))}
          {picker.results.length === 0 && (
            <div style={AdminDashboardStyle.emptyText}>
              {STRINGS.ADMIN.sections.noResults}
            </div>
          )}
        </div>

        <div style={AdminDashboardStyle.rowMt12}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={() => addPickerSelection({ replace: false })}
            disabled={busy || picker.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.addSelected}
          </button>
        </div>

        <details style={AdminDashboardStyle.detailsMt12}>
          <summary style={AdminDashboardStyle.detailsSummary}>
            {STRINGS.ADMIN.sections.dangerZone}
          </summary>
          <div style={AdminDashboardStyle.detailsRowMt10}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() => addPickerSelection({ replace: true })}
              disabled={busy || picker.selected.length === 0}
              title={STRINGS.ADMIN.hints.replacePoolTitle}
            >
              {STRINGS.ADMIN.actions.replacePoolWithSelected}
            </button>
          </div>
        </details>
      </AdminModal>

      <AdminModal
        open={editQuestion.open}
        title={STRINGS.ADMIN.modals.editGlobalQuestionTitle}
        onClose={() => setEditQuestion((v) => ({ ...v, open: false }))}
        maxWidth={980}
      >
        <div style={AdminStyle.field}>
          <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.question}</span>
          <textarea
            style={AdminStyle.textarea}
            value={editQuestion.question_text}
            onChange={(e) => setEditQuestion((v) => ({ ...v, question_text: e.target.value }))}
            disabled={busy}
          />
        </div>

        <div style={AdminStyle.field}>
          <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.explanation}</span>
          <textarea
            style={AdminStyle.textarea}
            value={editQuestion.explanation}
            onChange={(e) => setEditQuestion((v) => ({ ...v, explanation: e.target.value }))}
            placeholder={STRINGS.ADMIN.text.explanationPlaceholder}
            disabled={busy}
          />
        </div>

        <div style={AdminStyle.rowMt14}>
          <span style={AdminStyle.pill}>{STRINGS.ADMIN.labels.difficultyRating}</span>
          <input
            style={{ ...AdminStyle.input, width: 120 }}
            type="number"
            min={1}
            max={10}
            value={Number(editQuestion.difficulty_rating) || 5}
            onChange={(e) =>
              setEditQuestion((v) => ({ ...v, difficulty_rating: Number(e.target.value) }))
            }
            disabled={busy}
          />

          <span style={AdminStyle.pill}>{STRINGS.ADMIN.labels.timeLimitSec}</span>
          <input
            style={{ ...AdminStyle.input, width: 140 }}
            type="number"
            min={3}
            max={600}
            value={Number(editQuestion.time_limit_sec) || 30}
            onChange={(e) =>
              setEditQuestion((v) => ({ ...v, time_limit_sec: Number(e.target.value) }))
            }
            disabled={busy}
          />

          <span style={AdminStyle.pill}>{STRINGS.ADMIN.labels.points}</span>
          <input
            style={{ ...AdminStyle.input, width: 140 }}
            type="number"
            min={0}
            max={100000}
            value={Number(editQuestion.points) || 100}
            onChange={(e) => setEditQuestion((v) => ({ ...v, points: Number(e.target.value) }))}
            disabled={busy}
          />
        </div>

        <div style={AdminStyle.field}>
          <span style={AdminStyle.label}>Options</span>
          <div style={AdminStyle.row}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              disabled={busy || (editQuestion.options || []).length >= 6}
              onClick={() =>
                setEditQuestion((v) => ({
                  ...v,
                  options: [...(v.options || []), STRINGS.ADMIN.placeholders.newOption],
                }))
              }
            >
              {STRINGS.ADMIN.actions.addOption}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(editQuestion.options || []).map((opt, idx) => (
            <div key={idx} style={AdminStyle.row}>
              <input
                type="radio"
                name="edit-correct"
                checked={Number(editQuestion.correctIndex) === idx}
                onChange={() => setEditQuestion((v) => ({ ...v, correctIndex: idx }))}
                disabled={busy}
              />
              <input
                style={{ ...AdminStyle.input, flex: '1 1 auto', minWidth: 240 }}
                value={opt}
                onChange={(e) =>
                  setEditQuestion((v) => {
                    const next = (v.options || []).slice();
                    next[idx] = e.target.value;
                    return { ...v, options: next };
                  })
                }
                disabled={busy}
              />
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                disabled={busy || (editQuestion.options || []).length <= 2}
                onClick={() =>
                  setEditQuestion((v) => {
                    const next = (v.options || []).filter((_, i) => i !== idx);
                    const currentCorrect = Number(v.correctIndex) || 0;
                    const nextCorrect =
                      idx === currentCorrect ? 0 : idx < currentCorrect ? currentCorrect - 1 : currentCorrect;
                    return { ...v, options: next, correctIndex: Math.max(0, nextCorrect) };
                  })
                }
              >
                {STRINGS.ADMIN.actions.remove}
              </button>
            </div>
          ))}
        </div>

        <div style={AdminStyle.rowMt14}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={saveEditedGlobalQuestion}
            disabled={
              busy ||
              !String(editQuestion.question_text || '').trim() ||
              !String(editQuestion.explanation || '').trim()
            }
          >
            {STRINGS.ADMIN.actions.saveChanges}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => setEditQuestion((v) => ({ ...v, open: false }))}
            disabled={busy}
          >
            {STRINGS.COMMON.buttons.close}
          </button>
        </div>
      </AdminModal>

      <AdminModal
        open={classicCategoriesOpen}
        title={STRINGS.ADMIN.modals.classicCategoriesTitle}
        onClose={() => setClassicCategoriesOpen(false)}
        maxWidth={980}
      >
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.sections.classicCategoriesSubtitle}
        </div>

        <div style={AdminDashboardStyle.rowMt12}>
          <input
            style={AdminDashboardStyle.inputFlex1}
            value={classicCategoryForm.name}
            onChange={(e) => setClassicCategoryForm((v) => ({ ...v, name: e.target.value }))}
            placeholder={STRINGS.ADMIN.text.classicCategoryNamePlaceholder}
            disabled={busy}
          />
          <input
            style={AdminDashboardStyle.inputW160}
            value={classicCategoryForm.icon}
            onChange={(e) => setClassicCategoryForm((v) => ({ ...v, icon: e.target.value }))}
            placeholder={STRINGS.ADMIN.text.classicCategoryIconPlaceholder}
            disabled={busy}
          />
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={createClassicCategory}
            disabled={busy || !String(classicCategoryForm.name || '').trim()}
          >
            {STRINGS.ADMIN.actions.create}
          </button>
        </div>

        <div style={AdminDashboardStyle.rowMt12}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={loadClassicCategories}
            disabled={busy}
          >
            {STRINGS.ADMIN.actions.refreshList}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.categories} {classicCategories.length}
          </span>
        </div>

        <div style={AdminDashboardStyle.listMt12}>
          {classicCategories.map((c) => (
            <div key={c.id} style={AdminStyle.listItem}>
              <div style={AdminDashboardStyle.modeHeader}>
                <div style={AdminDashboardStyle.levelLeft}>
                  <div style={AdminStyle.listItemTitle}>
                    {c.icon ? `${c.icon} ` : ''}{c.name}
                  </div>
                  <div style={AdminStyle.listItemMeta}>
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.pills.pool}{' '}
                      {c.pool_count == null ? STRINGS.COMMON.separators.emDash : c.pool_count}
                    </span>
                    <span style={AdminStyle.pill}>{c.id}</span>
                  </div>
                </div>

                <div style={AdminDashboardStyle.actionCol}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() => {
                      setClassicCategoriesOpen(false);
                      loadPool({
                        kind: 'classic_category',
                        id: c.id,
                        title: STRINGS.ADMIN.format.classicCategoryPoolTitle(c.name),
                        offset: 0,
                      });
                    }}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.viewPool}
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btnPrimaryFull}
                    onClick={() => {
                      setClassicCategoriesOpen(false);
                      openPicker({
                        kind: 'classic_category',
                        id: c.id,
                        title: STRINGS.ADMIN.format.classicCategoryPoolTitle(c.name),
                      });
                    }}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.addQuestions}
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminDashboardStyle.dangerBtn}
                    onClick={() => deleteClassicCategory(c.id, c.name)}
                    disabled={busy}
                    title={STRINGS.ADMIN.hints.deleteCategoryTitle}
                  >
                    {STRINGS.ADMIN.actions.deleteCategory}
                  </button>
                </div>
              </div>

              <div style={AdminDashboardStyle.rowMt10}>
                <input
                  style={AdminDashboardStyle.inputW120}
                  type="number"
                  min={1}
                  max={100}
                  value={classicCategorySeedCounts[c.id] ?? 25}
                  onChange={(e) =>
                    setClassicCategorySeedCounts((m) => ({
                      ...m,
                      [c.id]: clampInt(e.target.value, 1, 100),
                    }))
                  }
                  disabled={busy}
                />
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => seedClassicCategoryPool(c.id)}
                  disabled={busy}
                  title={STRINGS.ADMIN.hints.seedClassicCategoryTitle}
                >
                  {STRINGS.ADMIN.actions.autoFill}
                </button>
              </div>
            </div>
          ))}

          {classicCategories.length === 0 && (
            <div style={AdminDashboardStyle.emptyText}>
              {STRINGS.ADMIN.sections.noCategoriesFound}
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
