import React, { useEffect, useMemo, useState } from 'react';
import colors from '../../constants/colors';
import { api } from '../../api';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminQuestionBankTab from './AdminQuestionBankTab';
import { AdminModal } from './AdminUi';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

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
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: colors.neutral[100],
        border: `1px solid ${colors.neutral[200]}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: colors.gradients.main,
        }}
      />
    </div>
  );
}

export default function AdminDashboard({
  user,
  onNavigateHome,
  onNavigateCreateQuiz,
}) {
  const [workspace, setWorkspace] = useState('story'); // story | modes | questions
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
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    modes: { classic: true, blitz: true, millionaire: true },
    showAdvanced: false,
    explanation: '',
    time_limit_sec: 30,
    points: 100,
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
      setSuccess(`Created level #${created.level_number}: ${created.title}`);
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
        options: payloadOptions,
        modes: questionForm.showAdvanced ? modes : [],
      };
      if (questionForm.showAdvanced) {
        payload.explanation = String(questionForm.explanation || '').trim() || null;
        payload.time_limit_sec = clampInt(questionForm.time_limit_sec, 3, 600);
        payload.points = clampInt(questionForm.points, 0, 100000);
      }

      const res = await api.adminCreateGlobalQuestion(payload);
      setSuccess(`Created question ${res.question_id}`);
      setQuestionForm((v) => ({
        ...v,
        question_text: '',
        correctIndex: 0,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        explanation: '',
      }));
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
      setSuccess('Category created.');
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
    const name = String(categoryName || '').trim() || 'this category';

    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      `Delete "${name}"?\n\nThis also removes all Classic pool assignments for this category.`
    );
    if (!ok) return;

    setBusy(true);
    clearMessages();
    try {
      await api.adminDeleteClassicCategory(cid);
      setSuccess('Category deleted.');
      await loadClassicCategories();
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
      setSuccess(`Auto-filled category (+${res.added_count || 0}).`);
      await loadClassicCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const modes = useMemo(
    () => [
      { key: 'classic', title: 'Classic', desc: 'Balanced gameplay.' },
      { key: 'blitz', title: 'Blitz', desc: 'Fast 60s sprint.' },
      { key: 'millionaire', title: 'Millionaire', desc: '15-question ladder.' },
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
    const ok = window.confirm('Clear this pool? This cannot be undone.');
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
      setSuccess('Pool cleared.');
      await loadPool({ kind: pool.kind, id: pool.id, title: pool.title, offset: 0 });
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadPicker = async ({ q, offset, keepSelected }) => {
    setBusy(true);
    clearMessages();
    try {
      const query = String(q ?? picker.q ?? '').trim();
      const off = Math.max(0, Number(offset) || 0);
      const lim = picker.limit || 30;
      const res = await api.adminListGlobalQuestions({ q: query, limit: lim, offset: off });
      setPicker((v) => ({
        ...v,
        q: query,
        results: Array.isArray(res?.results) ? res.results : [],
        offset: off,
        selected: keepSelected ? v.selected : [],
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openPicker = async ({ kind, id, title }) => {
    setPicker((v) => ({
      ...v,
      open: true,
      target: { kind, id, title },
      q: '',
      results: [],
      selected: [],
      offset: 0,
    }));
    await loadPicker({ q: '', offset: 0, keepSelected: false });
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

      setSuccess(replace ? 'Pool replaced.' : 'Questions added.');
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
      setSuccess(`Auto-filled ${m} (+${res.added_count || 0}).`);
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
      setSuccess(`Auto-filled level (+${res.added_count || 0}).`);
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
            <span style={AdminStyle.badgeIcon}>🛠️</span>
            <span style={AdminStyle.badgeText}>Admin</span>
            <span style={AdminStyle.badgeDot}>✨</span>
          </div>
          <h1 style={AdminStyle.title}>Dashboard</h1>
          <p style={AdminStyle.subtitle}>Pick a flow. Finish one thing at a time.</p>
        </div>

        <div className="tv-card" style={AdminStyle.card}>
          <div style={{ ...AdminStyle.row, justifyContent: 'space-between' }}>
            <div style={AdminStyle.row}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={loadDashboard}
                disabled={busy}
              >
                Refresh
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={onNavigateHome}
                disabled={busy}
              >
                Home
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                onClick={onNavigateCreateQuiz}
                disabled={busy}
              >
                Custom Quiz Builder
              </button>
            </div>

            <div style={AdminStyle.row}>
              <span style={AdminStyle.pill}>Classic: {modeCounts.classic ?? '-'}</span>
              <span style={AdminStyle.pill}>Blitz: {modeCounts.blitz ?? '-'}</span>
              <span style={AdminStyle.pill}>
                Millionaire: {modeCounts.millionaire ?? '-'}
              </span>
            </div>
          </div>

          <div style={{ ...AdminStyle.grid, marginTop: 14 }}>
            {[
              {
                key: 'questions',
                icon: '➕',
                title: 'Create Questions',
                desc: 'Add global questions fast (optional advanced).',
              },
              {
                key: 'modes',
                icon: '🎮',
                title: 'Build Game Modes',
                desc: 'Assign questions to Classic / Blitz / Millionaire.',
              },
              {
                key: 'story',
                icon: '📖',
                title: 'Build Story Mode',
                desc: 'Create levels, fill pools, edit quickly.',
              },
            ].map((a) => (
              <button
                key={a.key}
                type="button"
                className="tv-card tv-card--hover"
                onClick={() => setWorkspace(a.key)}
                disabled={busy}
                style={{
                  ...AdminStyle.section,
                  cursor: 'pointer',
                  textAlign: 'left',
                  border:
                    workspace === a.key
                      ? `2px solid ${colors.primary[500]}`
                      : `1px solid ${colors.neutral[200]}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 22 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontWeight: 950, color: colors.neutral[900] }}>
                      {a.title}
                    </div>
                    <div
                      style={{ marginTop: 2, fontWeight: 850, color: colors.neutral[650] }}
                    >
                      {a.desc}
                    </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h3 style={AdminStyle.sectionTitle}>{m.title}</h3>
                      <div style={AdminStyle.sectionSub}>{m.desc}</div>
                    </div>
                    <span style={AdminStyle.pill}>{modeCounts[m.key] ?? '-'}</span>
                  </div>

                  <div style={{ ...AdminStyle.row, marginTop: 12 }}>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btn}
                      onClick={() =>
                        loadPool({
                          kind: 'mode',
                          id: m.key,
                          title: `${m.title} Pool`,
                          offset: 0,
                        })
                      }
                      disabled={busy}
                    >
                      View pool
                    </button>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                      onClick={() =>
                        openPicker({ kind: 'mode', id: m.key, title: `${m.title} Pool` })
                      }
                      disabled={busy}
                    >
                      Add questions
                    </button>
                    {m.key === 'classic' && (
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={AdminStyle.btn}
                        onClick={openClassicCategories}
                        disabled={busy}
                      >
                        Categories
                      </button>
                    )}
                  </div>

                  <div style={{ ...AdminStyle.row, marginTop: 10 }}>
                    <input
                      style={{ ...AdminStyle.input, width: 110 }}
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
                      title="Adds random global questions to this mode pool"
                    >
                      Auto-fill random
                    </button>
                    <span style={AdminStyle.pill}>Adds only (no replace)</span>
                  </div>

                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 950, color: '#333' }}>
                      Danger zone
                    </summary>
                    <div style={{ marginTop: 10, ...AdminStyle.row }}>
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={AdminStyle.btn}
                        disabled={busy}
                        onClick={async () => {
                          const ok = window.confirm(
                            `Clear the entire ${m.title} pool? This cannot be undone.`
                          );
                          if (!ok) return;
                          setBusy(true);
                          clearMessages();
                          try {
                            await api.adminReplaceModePool(m.key, { question_ids: [] });
                            setSuccess(`${m.title} pool cleared.`);
                            await loadDashboard();
                          } catch (err) {
                            setError(getApiErrorMessage(err));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Clear pool
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
                <h3 style={AdminStyle.sectionTitle}>Create story level</h3>
                <div style={AdminStyle.sectionSub}>Only title is required.</div>

                <div style={AdminStyle.field}>
                  <span style={AdminStyle.label}>Title</span>
                  <input
                    style={AdminStyle.input}
                    value={levelForm.title}
                    onChange={(e) => setLevelForm((v) => ({ ...v, title: e.target.value }))}
                    placeholder="The Ancient Library"
                    disabled={busy}
                  />
                </div>

                <label style={{ ...AdminStyle.smallHelp, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!levelForm.showAdvanced}
                    onChange={(e) =>
                      setLevelForm((v) => ({ ...v, showAdvanced: e.target.checked }))
                    }
                    disabled={busy}
                    style={{ marginRight: 8 }}
                  />
                  Advanced settings
                </label>

                {levelForm.showAdvanced && (
                  <>
                    <div style={{ ...AdminStyle.row, marginTop: 10 }}>
                      <label style={{ ...AdminStyle.field, flex: 1, marginTop: 0 }}>
                        <span style={AdminStyle.label}>Difficulty min</span>
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
                      <label style={{ ...AdminStyle.field, flex: 1, marginTop: 0 }}>
                        <span style={AdminStyle.label}>Difficulty max</span>
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

                    <div style={{ ...AdminStyle.row, marginTop: 10 }}>
                      <label style={{ ...AdminStyle.field, flex: 1, marginTop: 0 }}>
                        <span style={AdminStyle.label}>Pass score min</span>
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
                      <label style={{ ...AdminStyle.field, flex: 1, marginTop: 0 }}>
                        <span style={AdminStyle.label}>XP reward</span>
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

                <div style={{ ...AdminStyle.row, marginTop: 14 }}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                    onClick={createLevel}
                    disabled={busy || !String(levelForm.title || '').trim()}
                  >
                    Create level
                  </button>
                </div>
              </div>

              <div style={AdminStyle.section}>
                <h3 style={AdminStyle.sectionTitle}>Levels overview</h3>
                <div style={AdminStyle.sectionSub}>
                  Each level should have 10 questions. Click “Edit” to fill it.
                </div>

                <div style={AdminStyle.list}>
                  {levels.length === 0 ? (
                    <div style={{ fontWeight: 850, color: colors.neutral[700] }}>
                      No levels found.
                    </div>
                  ) : (
                    levels.map((lvl) => {
                      const count = Number(lvl.pool_count);
                      const hasCount = Number.isFinite(count);
                      const filled = hasCount ? Math.max(0, Math.min(10, count)) : 0;
                      return (
                        <div key={lvl.id} style={AdminStyle.listItem}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 12,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={AdminStyle.listItemTitle}>
                                #{lvl.level_number} — {lvl.title}
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <ProgressBar value={filled} max={10} />
                              </div>
                              <div style={{ ...AdminStyle.listItemMeta, marginTop: 8 }}>
                                <span style={AdminStyle.pill}>
                                  {hasCount ? `${filled}/10 questions` : 'Pool: -'}
                                </span>
                                <span style={AdminStyle.pill}>
                                  Diff {lvl.difficulty_min}-{lvl.difficulty_max}
                                </span>
                                <span style={AdminStyle.pill}>XP {lvl.xp_reward}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <button
                                type="button"
                                className="tv-card tv-card--hover"
                                style={AdminStyle.btn}
                                onClick={() =>
                                  loadPool({
                                    kind: 'level',
                                    id: lvl.id,
                                    title: `Level #${lvl.level_number} Pool`,
                                    offset: 0,
                                  })
                                }
                                disabled={busy}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="tv-card tv-card--hover"
                                style={AdminStyle.btn}
                                onClick={() => seedStoryLevelPool(lvl.id)}
                                disabled={busy}
                                title="Adds random global questions to this level"
                              >
                                Auto-fill
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
        </div>
      </div>

      <AdminModal
        open={pool.open}
        title={pool.title}
        onClose={() => setPool((v) => ({ ...v, open: false }))}
      >
        {pool.kind === 'level' && selectedLevel ? (
          <div style={{ ...AdminStyle.row, marginBottom: 12 }}>
            <span style={AdminStyle.pill}>
              Level #{selectedLevel.level_number}: {selectedLevel.title}
            </span>
            <span style={AdminStyle.pill}>
              Diff {selectedLevel.difficulty_min}-{selectedLevel.difficulty_max}
            </span>
            <span style={AdminStyle.pill}>XP {selectedLevel.xp_reward}</span>
          </div>
        ) : null}

        <div style={AdminStyle.row}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={() => openPicker({ kind: pool.kind, id: pool.id, title: pool.title })}
            disabled={busy || !pool.id}
          >
            Add questions
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
            Prev
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
            Next
          </button>
          <span style={AdminStyle.pill}>Showing: {pool.questions.length}</span>
        </div>

        <div style={{ ...AdminStyle.list, marginTop: 12 }}>
          {pool.questions.map((q) => (
            <div key={q.id} style={AdminStyle.listItem}>
              <div style={AdminStyle.listItemTitle}>{q.question_text}</div>
              <div style={{ ...AdminStyle.listItemMeta, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {q.difficulty_rating != null ? (
                    <span style={AdminStyle.pill}>D{q.difficulty_rating}</span>
                  ) : null}
                  <span style={AdminStyle.pill}>{q.id}</span>
                </div>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => removeFromPool(q.id)}
                  disabled={busy}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {pool.questions.length === 0 && (
            <div style={{ fontWeight: 850, color: colors.neutral[700] }}>
              No questions yet.
            </div>
          )}
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 950, color: '#333' }}>
            Danger zone
          </summary>
          <div style={{ marginTop: 10, ...AdminStyle.row }}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={clearPool}
              disabled={busy}
            >
              Clear pool
            </button>
          </div>
        </details>
      </AdminModal>

      <AdminModal
        open={picker.open}
        title={picker.target ? `Add global questions → ${picker.target.title}` : 'Add questions'}
        onClose={() => setPicker((v) => ({ ...v, open: false }))}
      >
        <div style={AdminStyle.row}>
          <input
            style={{ ...AdminStyle.input, flex: 1 }}
            value={picker.q}
            onChange={(e) => setPicker((v) => ({ ...v, q: e.target.value }))}
            placeholder="Search (optional)..."
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
            Search
          </button>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
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
            Select page
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => setPicker((v) => ({ ...v, selected: [] }))}
            disabled={busy || picker.selected.length === 0}
          >
            Clear
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
            Prev
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
            Next
          </button>
          <span style={AdminStyle.pill}>
            Selected: {picker.selected.length}/{picker.maxSelect}
          </span>
        </div>

        <div style={{ ...AdminStyle.list, marginTop: 12 }}>
          {picker.results.map((r) => (
            <div key={r.id} style={AdminStyle.listItem}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={AdminStyle.listItemTitle}>{r.question_text}</div>
                  <div style={AdminStyle.listItemMeta}>
                    {r.difficulty_rating != null ? (
                      <span style={AdminStyle.pill}>D{r.difficulty_rating}</span>
                    ) : null}
                    <span style={AdminStyle.pill}>{r.id}</span>
                  </div>
                </div>
              </label>
            </div>
          ))}
          {picker.results.length === 0 && (
            <div style={{ fontWeight: 850, color: colors.neutral[700] }}>No results.</div>
          )}
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 12 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={() => addPickerSelection({ replace: false })}
            disabled={busy || picker.selected.length === 0}
          >
            Add selected
          </button>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 950, color: '#333' }}>
            Danger zone
          </summary>
          <div style={{ marginTop: 10, ...AdminStyle.row }}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() => addPickerSelection({ replace: true })}
              disabled={busy || picker.selected.length === 0}
              title="Replace the entire pool with your selected questions"
            >
              Replace pool with selected
            </button>
          </div>
        </details>
      </AdminModal>

      <AdminModal
        open={classicCategoriesOpen}
        title="Classic categories"
        onClose={() => setClassicCategoriesOpen(false)}
        maxWidth={980}
      >
        <div style={AdminStyle.sectionSub}>
          Create categories for Classic mode, then assign global questions to each category.
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 12 }}>
          <input
            style={{ ...AdminStyle.input, flex: 1 }}
            value={classicCategoryForm.name}
            onChange={(e) => setClassicCategoryForm((v) => ({ ...v, name: e.target.value }))}
            placeholder="Category name (e.g. Geography)"
            disabled={busy}
          />
          <input
            style={{ ...AdminStyle.input, width: 160 }}
            value={classicCategoryForm.icon}
            onChange={(e) => setClassicCategoryForm((v) => ({ ...v, icon: e.target.value }))}
            placeholder="Icon (optional)"
            disabled={busy}
          />
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={createClassicCategory}
            disabled={busy || !String(classicCategoryForm.name || '').trim()}
          >
            Create
          </button>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 12 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={loadClassicCategories}
            disabled={busy}
          >
            Refresh list
          </button>
          <span style={AdminStyle.pill}>Categories: {classicCategories.length}</span>
        </div>

        <div style={{ ...AdminStyle.list, marginTop: 12 }}>
          {classicCategories.map((c) => (
            <div key={c.id} style={AdminStyle.listItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={AdminStyle.listItemTitle}>
                    {c.icon ? `${c.icon} ` : ''}{c.name}
                  </div>
                  <div style={AdminStyle.listItemMeta}>
                    <span style={AdminStyle.pill}>
                      Pool: {c.pool_count == null ? '—' : c.pool_count}
                    </span>
                    <span style={AdminStyle.pill}>{c.id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() => {
                      setClassicCategoriesOpen(false);
                      loadPool({
                        kind: 'classic_category',
                        id: c.id,
                        title: `Classic: ${c.name}`,
                        offset: 0,
                      });
                    }}
                    disabled={busy}
                  >
                    View pool
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                    onClick={() => {
                      setClassicCategoriesOpen(false);
                      openPicker({
                        kind: 'classic_category',
                        id: c.id,
                        title: `Classic: ${c.name}`,
                      });
                    }}
                    disabled={busy}
                  >
                    Add questions
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{
                      ...AdminStyle.btn,
                      background: colors.accent.red,
                      border: 'none',
                      color: colors.neutral.white,
                    }}
                    onClick={() => deleteClassicCategory(c.id, c.name)}
                    disabled={busy}
                    title="Delete this category"
                  >
                    Delete category
                  </button>
                </div>
              </div>

              <div style={{ ...AdminStyle.row, marginTop: 10 }}>
                <input
                  style={{ ...AdminStyle.input, width: 120 }}
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
                  title="Auto-fill from Classic pool if available, otherwise random global questions"
                >
                  Auto-fill
                </button>
              </div>
            </div>
          ))}

          {classicCategories.length === 0 && (
            <div style={{ fontWeight: 850, color: colors.neutral[700] }}>
              No categories found. Create one above.
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
