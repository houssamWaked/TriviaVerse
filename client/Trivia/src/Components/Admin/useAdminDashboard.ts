import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api';
import { getApiErrorMessage } from '@/utils/apiError';
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

export default function useAdminDashboard({ user }) {
  const [workspace, setWorkspace] = useState('story');
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

  const [classicLevelsOpen, setClassicLevelsOpen] = useState(false);
  const [classicLevelsCategory, setClassicLevelsCategory] = useState(null);
  const [classicLevels, setClassicLevels] = useState([]);
  const [classicLevelForm, setClassicLevelForm] = useState({
    title: '',
    level_number: '',
    difficulty_min: 1,
    difficulty_max: 10,
    xp_reward: 0,
  });
  const [classicLevelSeedCounts, setClassicLevelSeedCounts] = useState({});

  const [reportsStatus, setReportsStatus] = useState('open');
  const [reports, setReports] = useState([]);
  const [reportsLimit] = useState(50);
  const [reportsOffset, setReportsOffset] = useState(0);

  const [pool, setPool] = useState({
    open: false,
    kind: null,
    id: '',
    title: '',
    questions: [],
    limit: 50,
    offset: 0,
  });

  const [picker, setPicker] = useState({
    open: false,
    target: null,
    q: '',
    results: [],
    selected: [],
    exclude_ids: [],
    can_next: true,
    maxSelect: 50,
    limit: 30,
    offset: 0,
  });

  const [globalBank, setGlobalBank] = useState({
    q: '',
    filter: 'all',
    results: [],
    limit: 50,
    offset: 0,
    can_next: false,
    loaded: false,
  });

  const globalBankLoadedRef = useRef(false);

  const selectedLevel = useMemo(() => {
    if (pool.kind !== 'level') return null;
    return levels.find((level) => level.id === pool.id) || null;
  }, [levels, pool.id, pool.kind]);

  const modes = useMemo(
    () => [
      { key: 'classic', ...STRINGS.ADMIN.modeCards.classic },
      { key: 'blitz', ...STRINGS.ADMIN.modeCards.blitz },
      { key: 'millionaire', ...STRINGS.ADMIN.modeCards.millionaire },
    ],
    []
  );

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadReports = async ({ status = reportsStatus, offset = 0 }: any = {}) => {
    const s = String(status || 'open').trim();
    const off = Math.max(0, Number(offset) || 0);

    setBusy(true);
    clearMessages();
    try {
      const res = (await api.adminListQuizReports({
        status: s,
        limit: reportsLimit,
        offset: off,
      })) as { entries?: any[] };
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
        classic: (classicRes as any)?.count ?? 0,
        blitz: (blitzRes as any)?.count ?? 0,
        millionaire: (milRes as any)?.count ?? 0,
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

  const loadClassicLevels = async (categoryId) => {
    const cid = String(categoryId || '').trim();
    if (!cid) return;

    setBusy(true);
    clearMessages();
    try {
      const res = (await api.adminClassicCategoryLevels(cid)) as {
        levels?: any[];
      };
      setClassicLevels(Array.isArray(res?.levels) ? res.levels : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openClassicLevels = async (category) => {
    const c = category && typeof category === 'object' ? category : null;
    if (!c?.id) return;
    setClassicCategoriesOpen(false);
    setClassicLevelsCategory({ id: c.id, name: c.name });
    setClassicLevelsOpen(true);
    setClassicLevelForm((v) => ({ ...v, title: '' }));
    await loadClassicLevels(c.id);
  };

  const createClassicLevel = async () => {
    const cid = classicLevelsCategory?.id;
    const title = String(classicLevelForm.title || '').trim();
    if (!cid || !title) return;

    setBusy(true);
    clearMessages();
    try {
      const level_number_raw = String(classicLevelForm.level_number || '').trim();
      const payload = {
        title,
        difficulty_min: clampInt(classicLevelForm.difficulty_min, 1, 10),
        difficulty_max: clampInt(classicLevelForm.difficulty_max, 1, 10),
        xp_reward: clampInt(classicLevelForm.xp_reward, 0, 1000000),
        ...(level_number_raw ? { level_number: clampInt(level_number_raw, 1, 1000) } : {}),
      };
      const created = await api.adminCreateClassicCategoryLevel(cid, payload);
      setSuccess(`Created level ${created.level_number}`);
      setClassicLevelForm((v) => ({ ...v, title: '', level_number: '' }));
      await loadClassicLevels(cid);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteClassicLevel = async (levelId, label) => {
    const lid = String(levelId || '').trim();
    if (!lid) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Delete ${label || 'this level'}? This will remove its pool + progress.`);
    if (!ok) return;

    setBusy(true);
    clearMessages();
    try {
      await api.adminDeleteClassicCategoryLevel(lid);
      setSuccess('Level deleted');
      if (classicLevelsCategory?.id) await loadClassicLevels(classicLevelsCategory.id);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const seedClassicLevelPool = async (levelId) => {
    const lid = String(levelId || '').trim();
    if (!lid) return;
    const count = clampInt(classicLevelSeedCounts[lid] ?? 10, 1, 50);

    setBusy(true);
    clearMessages();
    try {
      const res = await api.adminSeedClassicLevelPool(lid, { random_count: count });
      setSuccess(`Auto-filled ${res.added_count || 0}`);
      if (classicLevelsCategory?.id) await loadClassicLevels(classicLevelsCategory.id);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
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
      const payload: any = { title };
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

  const loadGlobalBank = async ({ q, offset, filter }: any = {}) => {
    const query = String(q ?? globalBank.q ?? '').trim();
    let off = Math.max(0, Number(offset ?? globalBank.offset ?? 0) || 0);
    const lim = Math.min(50, Math.max(1, Number(globalBank.limit) || 50));
    const f = String(filter ?? globalBank.filter ?? 'all').trim() || 'all';

    setBusy(true);
    clearMessages();
    try {
      let results = [];
      let canNext = false;

      if (f === 'all') {
        const res = (await api.adminListGlobalQuestions({
          q: query,
          limit: lim,
          offset: off,
          assigned: 'all',
        })) as { results?: any[] };
        const rawResults = Array.isArray(res?.results) ? res.results : [];
        canNext = rawResults.length >= lim;
        results = rawResults;
      } else {
        const assigned = (await api.adminAllAssignedQuestionIds().catch(() => null)) as
          | { ids?: any[] }
          | null;
        const ids = Array.isArray(assigned?.ids) ? assigned.ids : [];
        const assignedSet = new Set((ids || []).filter(Boolean));

        for (let i = 0; i < 6; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          const res = (await api.adminListGlobalQuestions({
            q: query,
            limit: lim,
            offset: off,
            assigned: 'all',
          })) as { results?: any[] };

          const rawResults = Array.isArray(res?.results) ? res.results : [];
          canNext = rawResults.length >= lim;

          const annotated = rawResults.map((r) => ({
            ...r,
            is_assigned: r?.id ? assignedSet.has(r.id) : false,
          }));

          results =
            f === 'assigned'
              ? annotated.filter((r) => r?.is_assigned === true)
              : annotated.filter((r) => r?.id && r?.is_assigned !== true);

          if (results.length > 0) break;
          if (rawResults.length < lim) break;
          off += lim;
        }
      }

      setGlobalBank((v) => ({
        ...v,
        q: query,
        filter: f,
        results,
        offset: off,
        can_next: canNext,
        loaded: true,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (workspace !== 'questions') return;
    if (globalBankLoadedRef.current) return;
    globalBankLoadedRef.current = true;
    loadGlobalBank({ q: '', offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const createQuestion = async () => {
    const question_text = String(questionForm.question_text || '').trim();
    if (!question_text) return;

    const explanation = String(questionForm.explanation || '').trim();
    if (!explanation) {
      setError('Explanation is required.');
      return;
    }

    const options = (questionForm.options || []).map((t) => String(t || '').trim()).filter(Boolean);
    if (options.length < 2) return;

    const correctIndex = Math.max(0, Math.min(options.length - 1, Number(questionForm.correctIndex) || 0));
    const payloadOptions = options.map((t, idx) => ({
      option_text: t,
      is_correct: idx === correctIndex,
    }));
    const selectedModes = Object.entries(questionForm.modes || {})
      .filter(([, v]) => !!v)
      .map(([k]) => k);

    setBusy(true);
    clearMessages();
    try {
      const payload: any = {
        question_text,
        difficulty_rating: clampInt(questionForm.difficulty_rating, 1, 10),
        explanation,
        options: payloadOptions,
        modes: questionForm.showAdvanced ? selectedModes : [],
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
      await loadGlobalBank({ q: globalBank.q, filter: globalBank.filter, offset: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteLevel = async (level) => {
    if (!level?.id) return;
    const levelId = String(level.id || '').trim();
    if (!levelId) return;

    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.confirm.deleteStoryLevel(level.level_number, level.title));
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
    const name = String(categoryName || '').trim() || STRINGS.ADMIN.text.thisCategoryFallback;

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
      const opts = Array.isArray(q?.options)
        ? q.options.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        : [];
      const optionTexts = opts.map((o) => String(o?.option_text || '').trim());
      const correctIndex = Math.max(0, Math.min(optionTexts.length - 1, opts.findIndex((o) => !!o.is_correct)));

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

  const loadPool = async ({ kind, id, title, offset = 0 }) => {
    const lim = pool.limit || 50;
    setBusy(true);
    clearMessages();
    try {
      let res;
      if (kind === 'mode') res = await api.adminListModePoolQuestions(id, { limit: lim, offset });
      else if (kind === 'level') res = await api.adminListStoryLevelPoolQuestions(id, { limit: lim, offset });
      else if (kind === 'classic_category') res = await api.adminListClassicCategoryPoolQuestions(id, { limit: lim, offset });
      else if (kind === 'classic_level') res = await api.adminListClassicLevelPoolQuestions(id, { limit: lim, offset });
      else res = { questions: [] };

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

  const deleteGlobalQuestion = async (questionId: any, { source }: any = {}) => {
    const qid = String(questionId || '').trim();
    if (!qid) return;

    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.confirm.deleteGlobalQuestion);
    if (!ok) return;

    const prevGlobalBankResults = globalBank.results;
    const prevPoolQuestions = pool.questions;
    const prevPickerResults = picker.results;
    const prevPickerSelected = picker.selected;

    if (source === 'pool') {
      setPool((v) => ({ ...v, questions: (v.questions || []).filter((item) => item?.id !== qid) }));
    } else if (source === 'picker') {
      setPicker((v) => ({
        ...v,
        results: (v.results || []).filter((item) => item?.id !== qid),
        selected: (v.selected || []).filter((id) => id !== qid),
      }));
    } else {
      setGlobalBank((v) => ({ ...v, results: (v.results || []).filter((item) => item?.id !== qid) }));
    }

    setBusy(true);
    clearMessages();
    try {
      await api.adminDeleteGlobalQuestion(qid);
      setSuccess(STRINGS.ADMIN.toasts.questionDeleted);
      await loadDashboard();

      if (source === 'pool' && pool.open && pool.kind && pool.id) {
        await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: pool.offset });
      } else if (source === 'picker' && picker.open) {
        await loadPicker({ q: picker.q, offset: picker.offset, keepSelected: true });
      } else {
        await loadGlobalBank({ q: globalBank.q, filter: globalBank.filter, offset: globalBank.offset });
      }
    } catch (err) {
      setGlobalBank((v) => ({ ...v, results: prevGlobalBankResults }));
      setPool((v) => ({ ...v, questions: prevPoolQuestions }));
      setPicker((v) => ({ ...v, results: prevPickerResults, selected: prevPickerSelected }));
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

  const removeFromPool = async (questionId) => {
    const qid = String(questionId || '').trim();
    if (!qid || !pool.kind || !pool.id) return;

    setBusy(true);
    clearMessages();
    try {
      if (pool.kind === 'mode') await api.adminRemoveModePool(pool.id, { question_ids: [qid] });
      else if (pool.kind === 'level') await api.adminRemoveStoryLevelPool(pool.id, { question_ids: [qid] });
      else if (pool.kind === 'classic_category') await api.adminRemoveClassicCategoryPool(pool.id, { question_ids: [qid] });
      else if (pool.kind === 'classic_level') await api.adminRemoveClassicLevelPool(pool.id, { question_ids: [qid] });
      else return;

      await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: pool.offset });
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
      if (pool.kind === 'mode') await api.adminReplaceModePool(pool.id, { question_ids: [] });
      else if (pool.kind === 'level') await api.adminReplaceStoryLevelPool(pool.id, { question_ids: [] });
      else if (pool.kind === 'classic_category') await api.adminReplaceClassicCategoryPool(pool.id, { question_ids: [] });
      else if (pool.kind === 'classic_level') await api.adminReplaceClassicLevelPool(pool.id, { question_ids: [] });
      else return;

      setSuccess(STRINGS.ADMIN.toasts.poolCleared);
      await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: 0 });
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadPicker = async ({ q, offset, keepSelected, excludeIds }: any = {}) => {
    setBusy(true);
    clearMessages();
    try {
      const query = String(q ?? picker.q ?? '').trim();
      let off = Math.max(0, Number(offset) || 0);
      const lim = picker.limit || 30;
      const excludeSet = new Set(((excludeIds ?? picker.exclude_ids) || []).filter(Boolean));

      let assignedSet = null;
      const ensureAssignedSet = async () => {
        if (assignedSet) return assignedSet;
        const assigned = (await api.adminAllAssignedQuestionIds().catch(() => null)) as
          | { ids?: any[] }
          | null;
        assignedSet = new Set((Array.isArray(assigned?.ids) ? assigned.ids : []).filter(Boolean));
        return assignedSet;
      };

      let rawResults = [];
      let filteredResults = [];
      let canNext = false;
      const asg = await ensureAssignedSet();

      for (let i = 0; i < 6; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = (await api.adminListGlobalQuestions({
          q: query,
          limit: lim,
          offset: off,
          assigned: 'all',
        })) as { results?: any[] };
        rawResults = Array.isArray(res?.results) ? res.results : [];

        filteredResults = rawResults
          .map((r) => ({ ...r, is_assigned: r?.id ? asg.has(r.id) : false }))
          .filter((r) => !excludeSet.has(r.id) && r?.is_assigned !== true);
        canNext = rawResults.length >= lim;

        if (filteredResults.length > 0) break;
        if (rawResults.length < lim) break;
        off += lim;
      }

      setPicker((v) => ({
        ...v,
        q: query,
        results: filteredResults,
        offset: off,
        can_next: canNext,
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
            : k === 'classic_level'
              ? await api.adminClassicLevelPoolIds(targetId)
              : null;

    return Array.from(
      new Set((Array.isArray((res as any)?.ids) ? (res as any).ids : []).filter(Boolean))
    );
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
      can_next: true,
      offset: 0,
    }));

    let exclude_ids = [];
    try {
      const targetPoolIds = await listAllPoolQuestionIds({ kind, id });
      exclude_ids = Array.isArray(targetPoolIds) ? targetPoolIds : [];
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
        if (replace) await api.adminReplaceStoryLevelPool(picker.target.id, { question_ids: ids });
        else await api.adminAddStoryLevelPool(picker.target.id, { question_ids: ids });
      } else if (picker.target.kind === 'classic_category') {
        if (replace) await api.adminReplaceClassicCategoryPool(picker.target.id, { question_ids: ids });
        else await api.adminAddClassicCategoryPool(picker.target.id, { question_ids: ids });
      } else if (picker.target.kind === 'classic_level') {
        if (replace) await api.adminReplaceClassicLevelPool(picker.target.id, { question_ids: ids });
        else await api.adminAddClassicLevelPool(picker.target.id, { question_ids: ids });
      } else {
        return;
      }

      setSuccess(replace ? STRINGS.ADMIN.toasts.poolReplaced : STRINGS.ADMIN.toasts.questionsAdded);
      setPicker((v) => ({ ...v, open: false, selected: [] }));
      await loadDashboard();
      if (pool.open && pool.kind === picker.target.kind && pool.id === picker.target.id) {
        await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: pool.offset });
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

  const clearModePool = async (mode, title) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.confirm.clearModePool(title));
    if (!ok) return;

    setBusy(true);
    clearMessages();
    try {
      await api.adminReplaceModePool(mode, { question_ids: [] });
      setSuccess(STRINGS.ADMIN.toasts.modePoolCleared(title));
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

  const resolveReport = async (reportId) => {
    setBusy(true);
    clearMessages();
    try {
      await api.adminResolveQuizReport(reportId);
      setSuccess(STRINGS.ADMIN.reports.toasts.resolved);
      await loadReports({ status: reportsStatus, offset: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteReportedQuiz = async (quizId, quizTitle) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.reports.confirm.deleteQuiz(quizTitle));
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
  };

  const banReportedOwner = async ({ ownerId, ownerName, reason }) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(STRINGS.ADMIN.reports.confirm.banUser(ownerName));
    if (!ok) return;

    // eslint-disable-next-line no-alert
    const promptValue = window.prompt(
      STRINGS.ADMIN.reports.prompts.banReason,
      `${STRINGS.ADMIN.reports.prompts.banReasonDefaultPrefix} ${reason || 'other'}`
    );
    if (promptValue === null) return;

    setBusy(true);
    clearMessages();
    try {
      const body = String(promptValue || '').trim() ? { reason: String(promptValue).trim() } : {};
      await api.adminBanUser(ownerId, body);
      setSuccess(STRINGS.ADMIN.reports.toasts.bannedUser);
      await loadReports({ status: reportsStatus, offset: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return {
    workspace,
    setWorkspace,
    busy,
    error,
    success,
    levels,
    modeCounts,
    levelForm,
    setLevelForm,
    questionForm,
    setQuestionForm,
    editQuestion,
    setEditQuestion,
    modeSeedCount,
    setModeSeedCount,
    classicCategoriesOpen,
    setClassicCategoriesOpen,
    classicCategories,
    classicCategoryForm,
    setClassicCategoryForm,
    classicCategorySeedCounts,
    setClassicCategorySeedCounts,
    classicLevelsOpen,
    setClassicLevelsOpen,
    classicLevelsCategory,
    classicLevels,
    classicLevelForm,
    setClassicLevelForm,
    classicLevelSeedCounts,
    setClassicLevelSeedCounts,
    reportsStatus,
    reports,
    reportsLimit,
    reportsOffset,
    pool,
    setPool,
    picker,
    setPicker,
    globalBank,
    setGlobalBank,
    selectedLevel,
    modes,
    loadDashboard,
    loadReports,
    createLevel,
    deleteLevel,
    loadGlobalBank,
    createQuestion,
    openEditGlobalQuestion,
    saveEditedGlobalQuestion,
    deleteGlobalQuestion,
    loadPool,
    removeFromPool,
    clearPool,
    loadPicker,
    openPicker,
    addPickerSelection,
    seedModePool,
    clearModePool,
    seedStoryLevelPool,
    resolveReport,
    deleteReportedQuiz,
    banReportedOwner,
    openClassicCategories,
    loadClassicCategories,
    createClassicCategory,
    deleteClassicCategory,
    openClassicLevels,
    loadClassicLevels,
    createClassicLevel,
    deleteClassicLevel,
    seedClassicCategoryPool,
    seedClassicLevelPool,
  };
}

