// Legacy dashboard kept for reference (tabs-based).
import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminStoryTab from './AdminStoryTab';
import AdminQuestionBankTab from './AdminQuestionBankTab';
import AdminModePoolsTab from './AdminModePoolsTab';
import AdminGlobalQuestionsTab from './AdminGlobalQuestionsTab';
import { TabButton } from './AdminUi';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function toggleIdLimited(list, id, max = 0) {
  const exists = list.includes(id);
  if (exists) return list.filter((x) => x !== id);
  if (max && list.length >= max) return list;
  return [...list, id];
}

export default function AdminDashboard({
  user,
  onNavigateHome,
  onNavigateCreateQuiz,
}) {
  const [activeTab, setActiveTab] = useState('story');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [levels, setLevels] = useState([]);
  const [modeCounts, setModeCounts] = useState({
    classic: null,
    blitz: null,
    millionaire: null,
  });

  const [levelForm, setLevelForm] = useState({
    title: '',
    showAdvanced: false,
    difficulty_min: 1,
    difficulty_max: 3,
    pass_score_min: 0,
    xp_reward: 100,
  });
  const [seedCounts, setSeedCounts] = useState({});
  const [storyPick, setStoryPick] = useState({
    levelId: '',
    q: '',
    results: [],
    selected: [],
    maxSelect: 6,
    limit: 20,
    offset: 0,
    poolQuestions: [],
    poolLimit: 50,
    poolOffset: 0,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    correctIndex: 0,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    modes: { classic: true, blitz: true, millionaire: true },
    showAdvanced: false,
    explanation: '',
    time_limit_sec: 30,
    points: 100,
  });

  const [poolPick, setPoolPick] = useState({
    mode: 'classic',
    q: '',
    results: [],
    selected: [],
    maxSelect: 6,
    limit: 20,
    offset: 0,
    poolQuestions: [],
    poolLimit: 50,
    poolOffset: 0,
  });

  const [globalBank, setGlobalBank] = useState({
    levelId: '',
    q: '',
    results: [],
    selected: [],
    maxSelect: 50,
    limit: 30,
    offset: 0,
  });

  const load = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
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

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  const createLevel = async () => {
    const title = String(levelForm.title || '').trim();
    if (!title) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = { title };
      if (levelForm.showAdvanced) {
        payload.difficulty_min = Number(levelForm.difficulty_min) || 1;
        payload.difficulty_max = Number(levelForm.difficulty_max) || 3;
        payload.pass_score_min = Number(levelForm.pass_score_min) || 0;
        payload.xp_reward = Number(levelForm.xp_reward) || 100;
      }
      const created = await api.adminCreateStoryLevel(payload);
      setSuccess(`Created level #${created.level_number}: ${created.title}`);
      setLevelForm((v) => ({ ...v, title: '' }));
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const seedLevel = async (levelId) => {
    const count = Number(seedCounts[levelId] || 10) || 10;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminSeedStoryLevelPool(levelId, {
        random_count: Math.min(50, Math.max(1, count)),
      });
      setSuccess(`Seeded pool (+${res.added_count || 0}).`);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const searchStory = async (nextOffset = 0) => {
    const q = String(storyPick.q || '').trim();
    const offset = Math.max(0, Number(nextOffset) || 0);
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminListGlobalQuestions({
        q,
        limit: storyPick.limit,
        offset,
      });
      setStoryPick((v) => ({
        ...v,
        results: Array.isArray(res?.results) ? res.results : [],
        selected: [],
        offset,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addSelectedToLevel = async () => {
    const levelId = String(storyPick.levelId || '').trim();
    if (!levelId) return;
    if (storyPick.selected.length === 0) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminAddStoryLevelPool(levelId, {
        question_ids: storyPick.selected,
      });
      setSuccess(`Added ${res.added_count || 0} question(s) to the level.`);
      setStoryPick((v) => ({ ...v, selected: [] }));
      await loadStoryLevelPoolQuestions(levelId, storyPick.poolOffset);
      const levelsRes = await api.adminListStoryLevels();
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
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
    setError('');
    setSuccess('');
    try {
      const payload = { question_text, options: payloadOptions, modes };
      if (questionForm.showAdvanced) {
        payload.explanation = String(questionForm.explanation || '').trim() || null;
        payload.time_limit_sec = Number(questionForm.time_limit_sec) || 30;
        payload.points = Number(questionForm.points) || 100;
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
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const searchModePool = async (nextOffset = 0) => {
    const q = String(poolPick.q || '').trim();
    const offset = Math.max(0, Number(nextOffset) || 0);
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminListGlobalQuestions({
        q,
        limit: poolPick.limit,
        offset,
      });
      setPoolPick((v) => ({
        ...v,
        results: Array.isArray(res?.results) ? res.results : [],
        selected: [],
        offset,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadModePoolQuestions = async (modeArg, offsetArg) => {
    const mode = String(modeArg || poolPick.mode || '')
      .trim()
      .toLowerCase();
    if (!mode) return;

    const limit = poolPick.poolLimit || 50;
    const offset = Math.max(0, Number(offsetArg ?? poolPick.poolOffset) || 0);

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminListModePoolQuestions(mode, { limit, offset });
      setPoolPick((v) => ({
        ...v,
        mode,
        poolQuestions: Array.isArray(res?.questions) ? res.questions : [],
        poolOffset: offset,
        poolLimit: limit,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changeMode = async (mode) => {
    const m = String(mode || '').trim().toLowerCase();
    setPoolPick((v) => ({
      ...v,
      mode: m,
      poolQuestions: [],
      poolOffset: 0,
    }));
    await loadModePoolQuestions(m, 0);
  };

  const removeFromModePool = async (questionId) => {
    const mode = String(poolPick.mode || '').trim().toLowerCase();
    const qid = String(questionId || '').trim();
    if (!mode || !qid) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminRemoveModePool(mode, { question_ids: [qid] });
      setSuccess(`Removed ${res.removed_count || 0} question(s) from ${mode}.`);
      await loadModePoolQuestions(mode, poolPick.poolOffset);
      const summary = await api.adminModePoolSummary(mode);
      setModeCounts((v) => ({ ...v, [mode]: summary?.count ?? v[mode] }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const clearModePool = async () => {
    const mode = String(poolPick.mode || '').trim().toLowerCase();
    if (!mode) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api.adminReplaceModePool(mode, { question_ids: [] });
      setSuccess(`Cleared ${mode} pool.`);
      await loadModePoolQuestions(mode, 0);
      setModeCounts((v) => ({ ...v, [mode]: 0 }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const replaceModePoolWithSelected = async () => {
    const mode = String(poolPick.mode || '').trim().toLowerCase();
    if (!mode) return;
    if (poolPick.selected.length === 0) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminReplaceModePool(mode, { question_ids: poolPick.selected });
      setSuccess(`Replaced ${mode} pool: ${res.count || 0} question(s).`);
      setPoolPick((v) => ({ ...v, selected: [] }));
      await loadModePoolQuestions(mode, 0);
      const summary = await api.adminModePoolSummary(mode);
      setModeCounts((v) => ({ ...v, [mode]: summary?.count ?? v[mode] }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadStoryLevelPoolQuestions = async (levelIdArg, offsetArg) => {
    const levelId = String(levelIdArg || storyPick.levelId || '').trim();
    if (!levelId) return;

    const limit = storyPick.poolLimit || 50;
    const offset = Math.max(0, Number(offsetArg ?? storyPick.poolOffset) || 0);

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminListStoryLevelPoolQuestions(levelId, { limit, offset });
      setStoryPick((v) => ({
        ...v,
        levelId,
        poolQuestions: Array.isArray(res?.questions) ? res.questions : [],
        poolOffset: offset,
        poolLimit: limit,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changeLevel = async (levelId) => {
    const lid = String(levelId || '').trim();
    setStoryPick((v) => ({
      ...v,
      levelId: lid,
      poolQuestions: [],
      poolOffset: 0,
    }));
    if (!lid) return;
    await loadStoryLevelPoolQuestions(lid, 0);
  };

  const removeFromStoryLevelPool = async (questionId) => {
    const levelId = String(storyPick.levelId || '').trim();
    const qid = String(questionId || '').trim();
    if (!levelId || !qid) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminRemoveStoryLevelPool(levelId, { question_ids: [qid] });
      setSuccess(`Removed ${res.removed_count || 0} question(s) from the level.`);
      await loadStoryLevelPoolQuestions(levelId, storyPick.poolOffset);
      const levelsRes = await api.adminListStoryLevels();
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const clearStoryLevelPool = async () => {
    const levelId = String(storyPick.levelId || '').trim();
    if (!levelId) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api.adminReplaceStoryLevelPool(levelId, { question_ids: [] });
      setSuccess('Cleared level pool.');
      await loadStoryLevelPoolQuestions(levelId, 0);
      const levelsRes = await api.adminListStoryLevels();
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const replaceStoryLevelPoolWithSelected = async () => {
    const levelId = String(storyPick.levelId || '').trim();
    if (!levelId) return;
    if (storyPick.selected.length === 0) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminReplaceStoryLevelPool(levelId, {
        question_ids: storyPick.selected,
      });
      setSuccess(`Replaced level pool: ${res.count || 0} question(s).`);
      setStoryPick((v) => ({ ...v, selected: [] }));
      await loadStoryLevelPoolQuestions(levelId, 0);
      const levelsRes = await api.adminListStoryLevels();
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadGlobalBank = async (nextOffset = 0) => {
    const q = String(globalBank.q || '').trim();
    const offset = Math.max(0, Number(nextOffset) || 0);

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminListGlobalQuestions({
        q,
        limit: globalBank.limit,
        offset,
      });
      setGlobalBank((v) => ({
        ...v,
        results: Array.isArray(res?.results) ? res.results : [],
        offset,
      }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addSelectedGlobalToLevel = async () => {
    const levelId = String(globalBank.levelId || '').trim();
    if (!levelId) return;
    if (globalBank.selected.length === 0) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminAddStoryLevelPool(levelId, {
        question_ids: globalBank.selected,
      });
      setSuccess(`Added ${res.added_count || 0} question(s) to the level.`);
      setGlobalBank((v) => ({ ...v, selected: [] }));
      const levelsRes = await api.adminListStoryLevels();
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const replaceLevelPoolFromGlobal = async () => {
    const levelId = String(globalBank.levelId || '').trim();
    if (!levelId) return;
    if (globalBank.selected.length === 0) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminReplaceStoryLevelPool(levelId, {
        question_ids: globalBank.selected,
      });
      setSuccess(`Replaced level pool: ${res.count || 0} question(s).`);
      setGlobalBank((v) => ({ ...v, selected: [] }));
      const levelsRes = await api.adminListStoryLevels();
      setLevels(Array.isArray(levelsRes) ? levelsRes : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addSelectedToMode = async () => {
    const mode = String(poolPick.mode || '').trim().toLowerCase();
    if (!mode) return;
    if (poolPick.selected.length === 0) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.adminAddModePool(mode, { question_ids: poolPick.selected });
      setSuccess(`Added ${res.added_count || 0} question(s) to ${mode}.`);
      setPoolPick((v) => ({ ...v, selected: [] }));
      await loadModePoolQuestions(mode, poolPick.poolOffset);
      const summary = await api.adminModePoolSummary(mode);
      setModeCounts((v) => ({ ...v, [mode]: summary?.count ?? v[mode] }));
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
          <p style={AdminStyle.subtitle}>
            Make content fast: story levels, mode pools, and global questions.
          </p>
        </div>

        <div className="tv-card" style={AdminStyle.card}>
          <div style={{ ...AdminStyle.row, justifyContent: 'space-between' }}>
            <div style={AdminStyle.row}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={load}
                disabled={busy}
              >
                Refresh
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={onNavigateHome}
              >
                Home
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                onClick={onNavigateCreateQuiz}
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

          <div style={AdminStyle.tabRow}>
            <TabButton
              active={activeTab === 'story'}
              label="📚 Story"
              onClick={() => setActiveTab('story')}
            />
            <TabButton
              active={activeTab === 'global'}
              label="🗂️ Global Questions"
              onClick={() => setActiveTab('global')}
            />
            <TabButton
              active={activeTab === 'bank'}
              label="🧩 Question Bank"
              onClick={() => setActiveTab('bank')}
            />
            <TabButton
              active={activeTab === 'pools'}
              label="🎯 Mode Pools"
              onClick={() => setActiveTab('pools')}
            />
          </div>

          {!!error && <div style={AdminStyle.error}>{error}</div>}
          {!!success && <div style={AdminStyle.success}>{success}</div>}

          {activeTab === 'story' && (
            <AdminStoryTab
              busy={busy}
              levels={levels}
              levelForm={levelForm}
              setLevelForm={setLevelForm}
              seedCounts={seedCounts}
              setSeedCounts={setSeedCounts}
              storyPick={storyPick}
              setStoryPick={setStoryPick}
              onChangeLevel={changeLevel}
              onLoadPool={() => loadStoryLevelPoolQuestions()}
              onPrevPoolPage={() =>
                loadStoryLevelPoolQuestions(
                  storyPick.levelId,
                  Math.max(0, (storyPick.poolOffset || 0) - (storyPick.poolLimit || 50))
                )
              }
              onNextPoolPage={() =>
                loadStoryLevelPoolQuestions(
                  storyPick.levelId,
                  (storyPick.poolOffset || 0) + (storyPick.poolLimit || 50)
                )
              }
              onRemoveFromPool={removeFromStoryLevelPool}
              onClearPool={clearStoryLevelPool}
              onCreateLevel={createLevel}
              onSeedLevel={seedLevel}
              onSearch={searchStory}
              onAddSelected={addSelectedToLevel}
              onReplaceSelected={replaceStoryLevelPoolWithSelected}
              onToggleSelected={(id) =>
                setStoryPick((v) => {
                  const exists = v.selected.includes(id);
                  if (!exists && v.selected.length >= (v.maxSelect || 6)) {
                    setError(`Select up to ${v.maxSelect || 6} questions.`);
                    return v;
                  }
                  return { ...v, selected: toggleIdLimited(v.selected, id, v.maxSelect || 6) };
                })
              }
              onSelectAll={() =>
                setStoryPick((v) => ({
                  ...v,
                  selected: v.results.slice(0, v.maxSelect || 6).map((r) => r.id),
                }))
              }
              onClearSelected={() => setStoryPick((v) => ({ ...v, selected: [] }))}
            />
          )}

          {activeTab === 'global' && (
            <AdminGlobalQuestionsTab
              busy={busy}
              levels={levels}
              bank={globalBank}
              setBank={setGlobalBank}
              onSearch={loadGlobalBank}
              onAddSelectedToLevel={addSelectedGlobalToLevel}
              onReplaceLevelPool={replaceLevelPoolFromGlobal}
              onToggleSelected={(id) =>
                setGlobalBank((v) => {
                  const exists = v.selected.includes(id);
                  if (!exists && v.selected.length >= (v.maxSelect || 50)) {
                    setError(`Select up to ${v.maxSelect || 50} questions.`);
                    return v;
                  }
                  return {
                    ...v,
                    selected: toggleIdLimited(v.selected, id, v.maxSelect || 50),
                  };
                })
              }
              onSelectAll={() =>
                setGlobalBank((v) => ({
                  ...v,
                  selected: v.results.slice(0, v.maxSelect || 50).map((r) => r.id),
                }))
              }
              onClearSelected={() => setGlobalBank((v) => ({ ...v, selected: [] }))}
            />
          )}

          {activeTab === 'bank' && (
            <AdminQuestionBankTab
              busy={busy}
              questionForm={questionForm}
              setQuestionForm={setQuestionForm}
              onCreateQuestion={createQuestion}
            />
          )}

          {activeTab === 'pools' && (
            <AdminModePoolsTab
              busy={busy}
              modeCounts={modeCounts}
              poolPick={poolPick}
              setPoolPick={setPoolPick}
              onChangeMode={changeMode}
              onLoadPool={() => loadModePoolQuestions()}
              onPrevPoolPage={() =>
                loadModePoolQuestions(
                  poolPick.mode,
                  Math.max(0, (poolPick.poolOffset || 0) - (poolPick.poolLimit || 50))
                )
              }
              onNextPoolPage={() =>
                loadModePoolQuestions(
                  poolPick.mode,
                  (poolPick.poolOffset || 0) + (poolPick.poolLimit || 50)
                )
              }
              onRemoveFromPool={removeFromModePool}
              onClearPool={clearModePool}
              onSearch={searchModePool}
              onAddSelected={addSelectedToMode}
              onReplaceSelected={replaceModePoolWithSelected}
              onToggleSelected={(id) =>
                setPoolPick((v) => {
                  const exists = v.selected.includes(id);
                  if (!exists && v.selected.length >= (v.maxSelect || 6)) {
                    setError(`Select up to ${v.maxSelect || 6} questions.`);
                    return v;
                  }
                  return { ...v, selected: toggleIdLimited(v.selected, id, v.maxSelect || 6) };
                })
              }
              onSelectAll={() =>
                setPoolPick((v) => ({
                  ...v,
                  selected: v.results.slice(0, v.maxSelect || 6).map((r) => r.id),
                }))
              }
              onClearSelected={() => setPoolPick((v) => ({ ...v, selected: [] }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
