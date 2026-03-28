import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import AdminDashboardQuestionsWorkspace from './AdminDashboardQuestionsWorkspace';
import AdminDashboardPoolModal from './AdminDashboardPoolModal';
import AdminDashboardPickerModal from './AdminDashboardPickerModal';
import AdminDashboardEditQuestionModal from './AdminDashboardEditQuestionModal';
import AdminClassicCategoriesModal from './AdminClassicCategoriesModal';
import AdminClassicLevelsModal from './AdminClassicLevelsModal';
import AdminDashboardModesWorkspace from './AdminDashboardModesWorkspace';
import AdminDashboardStoryWorkspace from './AdminDashboardStoryWorkspace';
import AdminDashboardReportsWorkspace from './AdminDashboardReportsWorkspace';
import useAdminDashboard from './useAdminDashboard';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

export default function AdminDashboard({
  user,
  onNavigateHome,
  onNavigateCreateQuiz,
}) {
  const {
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
  } = useAdminDashboard({ user });

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
              { key: 'questions', icon: ICONS.common.plus, ...STRINGS.ADMIN.flows.questions },
              { key: 'modes', icon: ICONS.common.gamepad, ...STRINGS.ADMIN.flows.modes },
              { key: 'story', icon: ICONS.common.openBook, ...STRINGS.ADMIN.flows.story },
              { key: 'reports', icon: ICONS.common.finishFlag, ...STRINGS.ADMIN.flows.reports },
            ].map((action) => (
              <button
                key={action.key}
                type="button"
                className="tv-card tv-card--hover"
                onClick={() => setWorkspace(action.key)}
                disabled={busy}
                style={AdminDashboardStyle.flowCard(workspace === action.key)}
              >
                <div style={AdminDashboardStyle.flowCardHeader}>
                  <div style={AdminDashboardStyle.flowCardIcon}>{action.icon}</div>
                  <div>
                    <div style={AdminDashboardStyle.flowCardTitle}>{action.title}</div>
                    <div style={AdminDashboardStyle.flowCardDesc}>{action.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!!error && <div style={AdminStyle.error}>{error}</div>}
          {!!success && <div style={AdminStyle.success}>{success}</div>}

          {workspace === 'questions' && (
            <AdminDashboardQuestionsWorkspace
              busy={busy}
              questionForm={questionForm}
              setQuestionForm={setQuestionForm}
              onCreateQuestion={createQuestion}
              globalBank={globalBank}
              setGlobalBank={setGlobalBank}
              onLoadGlobalBank={loadGlobalBank}
              onOpenEditGlobalQuestion={openEditGlobalQuestion}
              onDeleteGlobalQuestion={deleteGlobalQuestion}
            />
          )}

          {workspace === 'modes' && (
            <AdminDashboardModesWorkspace
              busy={busy}
              modes={modes}
              modeCounts={modeCounts}
              modeSeedCount={modeSeedCount}
              setModeSeedCount={setModeSeedCount}
              onLoadPool={loadPool}
              onOpenPicker={openPicker}
              onOpenClassicCategories={openClassicCategories}
              onSeedModePool={seedModePool}
              onClearModePool={clearModePool}
            />
          )}

          {workspace === 'story' && (
            <AdminDashboardStoryWorkspace
              busy={busy}
              levelForm={levelForm}
              setLevelForm={setLevelForm}
              onCreateLevel={createLevel}
              levels={levels}
              onLoadPool={loadPool}
              onSeedStoryLevelPool={seedStoryLevelPool}
              onDeleteLevel={deleteLevel}
            />
          )}

          {workspace === 'reports' && (
            <AdminDashboardReportsWorkspace
              busy={busy}
              reportsStatus={reportsStatus}
              reports={reports}
              reportsOffset={reportsOffset}
              reportsLimit={reportsLimit}
              onLoadReports={loadReports}
              onResolveReport={resolveReport}
              onDeleteReportedQuiz={deleteReportedQuiz}
              onBanReportedOwner={banReportedOwner}
            />
          )}
        </div>
      </div>

      <AdminDashboardPoolModal
        open={pool.open}
        title={pool.title}
        onClose={() => setPool((v) => ({ ...v, open: false }))}
        pool={pool}
        busy={busy}
        selectedLevel={selectedLevel}
        onOpenPicker={openPicker}
        onLoadPool={loadPool}
        onOpenEditGlobalQuestion={openEditGlobalQuestion}
        onRemoveFromPool={removeFromPool}
        onDeleteGlobalQuestion={deleteGlobalQuestion}
        onClearPool={clearPool}
      />

      <AdminDashboardPickerModal
        open={picker.open}
        picker={picker}
        busy={busy}
        onClose={() => setPicker((v) => ({ ...v, open: false }))}
        setPicker={setPicker}
        onLoadPicker={loadPicker}
        onOpenEditGlobalQuestion={openEditGlobalQuestion}
        onDeleteGlobalQuestion={deleteGlobalQuestion}
        onAddPickerSelection={addPickerSelection}
      />

      <AdminDashboardEditQuestionModal
        open={editQuestion.open}
        busy={busy}
        editQuestion={editQuestion}
        setEditQuestion={setEditQuestion}
        onClose={() => setEditQuestion((v) => ({ ...v, open: false }))}
        onSave={saveEditedGlobalQuestion}
      />

      <AdminClassicCategoriesModal
        open={classicCategoriesOpen}
        busy={busy}
        classicCategoryForm={classicCategoryForm}
        setClassicCategoryForm={setClassicCategoryForm}
        classicCategories={classicCategories}
        classicCategorySeedCounts={classicCategorySeedCounts}
        setClassicCategorySeedCounts={setClassicCategorySeedCounts}
        onClose={() => setClassicCategoriesOpen(false)}
        onCreateClassicCategory={createClassicCategory}
        onLoadClassicCategories={loadClassicCategories}
        onOpenPool={(config) => {
          setClassicCategoriesOpen(false);
          loadPool(config);
        }}
        onOpenPicker={(config) => {
          setClassicCategoriesOpen(false);
          openPicker(config);
        }}
        onOpenClassicLevels={(category) => {
          setClassicCategoriesOpen(false);
          openClassicLevels(category);
        }}
        onDeleteClassicCategory={deleteClassicCategory}
        onSeedClassicCategoryPool={seedClassicCategoryPool}
      />

      <AdminClassicLevelsModal
        open={classicLevelsOpen}
        busy={busy}
        classicLevelsCategory={classicLevelsCategory}
        classicLevelForm={classicLevelForm}
        setClassicLevelForm={setClassicLevelForm}
        classicLevels={classicLevels}
        classicLevelSeedCounts={classicLevelSeedCounts}
        setClassicLevelSeedCounts={setClassicLevelSeedCounts}
        onClose={() => setClassicLevelsOpen(false)}
        onCreateClassicLevel={createClassicLevel}
        onLoadClassicLevels={loadClassicLevels}
        onOpenPool={(config) => {
          setClassicLevelsOpen(false);
          loadPool(config);
        }}
        onOpenPicker={(config) => {
          setClassicLevelsOpen(false);
          openPicker(config);
        }}
        onDeleteClassicLevel={deleteClassicLevel}
        onSeedClassicLevelPool={seedClassicLevelPool}
      />
    </div>
  );
}
