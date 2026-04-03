import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import { AdminModal } from './AdminUi';
import { STRINGS } from '@/constants/strings';

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export default function AdminClassicLevelsModal({
  open,
  busy,
  classicLevelsCategory,
  classicLevelForm,
  setClassicLevelForm,
  classicLevels,
  classicLevelSeedCounts,
  setClassicLevelSeedCounts,
  onClose,
  onCreateClassicLevel,
  onLoadClassicLevels,
  onOpenPool,
  onOpenPicker,
  onDeleteClassicLevel,
  onSeedClassicLevelPool,
}) {
  return (
    <AdminModal
      open={open}
      title={`Classic Levels${classicLevelsCategory?.name ? ` - ${classicLevelsCategory.name}` : ''}`}
      onClose={onClose}
      maxWidth={980}
    >
      <div style={AdminStyle.sectionSub}>
        Create levels for this category, then assign questions per level.
      </div>

      <div style={AdminDashboardStyle.rowMt12}>
        <input
          style={AdminDashboardStyle.inputFlex1}
          value={classicLevelForm.title}
          onChange={(e) => setClassicLevelForm((v) => ({ ...v, title: e.target.value }))}
          placeholder="Level title (e.g. Basics)"
          disabled={busy}
        />
        <input
          style={AdminDashboardStyle.inputW110}
          value={classicLevelForm.level_number}
          onChange={(e) => setClassicLevelForm((v) => ({ ...v, level_number: e.target.value }))}
          placeholder="# (auto)"
          disabled={busy}
        />
        <input
          style={AdminDashboardStyle.inputW110}
          type="number"
          min={1}
          max={10}
          value={classicLevelForm.difficulty_min}
          onChange={(e) =>
            setClassicLevelForm((v) => ({
              ...v,
              difficulty_min: clampInt(e.target.value, 1, 10),
            }))
          }
          disabled={busy}
        />
        <input
          style={AdminDashboardStyle.inputW110}
          type="number"
          min={1}
          max={10}
          value={classicLevelForm.difficulty_max}
          onChange={(e) =>
            setClassicLevelForm((v) => ({
              ...v,
              difficulty_max: clampInt(e.target.value, 1, 10),
            }))
          }
          disabled={busy}
        />
        <input
          style={AdminDashboardStyle.inputW110}
          type="number"
          min={0}
          max={1000000}
          value={classicLevelForm.xp_reward}
          onChange={(e) =>
            setClassicLevelForm((v) => ({
              ...v,
              xp_reward: clampInt(e.target.value, 0, 1000000),
            }))
          }
          disabled={busy}
        />
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btnPrimaryFull}
          onClick={onCreateClassicLevel}
          disabled={busy || !String(classicLevelForm.title || '').trim()}
        >
          {STRINGS.ADMIN.actions.create}
        </button>
      </div>

      <div style={AdminDashboardStyle.rowMt12}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() => onLoadClassicLevels(classicLevelsCategory?.id)}
          disabled={busy || !classicLevelsCategory?.id}
        >
          {STRINGS.ADMIN.actions.refreshList}
        </button>
        <span style={AdminStyle.pill}>
          {STRINGS.ADMIN.sections.levels} {classicLevels.length}
        </span>
      </div>

      <div style={AdminDashboardStyle.listMt12}>
        {classicLevels.map((level) => {
          const title = `Classic - ${classicLevelsCategory?.name || ''} - Level ${level.level_number}`;

          return (
            <div key={level.id} style={AdminStyle.listItem}>
              <div style={AdminDashboardStyle.modeHeader}>
                <div style={AdminDashboardStyle.levelLeft}>
                  <div style={AdminStyle.listItemTitle}>
                    Level {level.level_number}: {level.title || 'Untitled'}
                  </div>
                  <div style={AdminStyle.listItemMeta}>
                    <span style={AdminStyle.pill}>
                      D{level.difficulty_min}-{level.difficulty_max}
                    </span>
                    <span style={AdminStyle.pill}>XP {level.xp_reward ?? 0}</span>
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.pills.pool}{' '}
                      {level.pool_count == null ? STRINGS.COMMON.separators.emDash : level.pool_count}
                    </span>
                    <span style={AdminStyle.pill}>{level.id}</span>
                  </div>
                </div>

                <div style={AdminDashboardStyle.actionCol}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btn}
                    onClick={() =>
                      onOpenPool({
                        kind: 'classic_level',
                        id: level.id,
                        title,
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
                      onOpenPicker({
                        kind: 'classic_level',
                        id: level.id,
                        title,
                      })
                    }
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.addQuestions}
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminDashboardStyle.dangerBtn}
                    onClick={() => onDeleteClassicLevel(level.id, title)}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.deleteLevel}
                  </button>
                </div>
              </div>

              <div style={AdminDashboardStyle.rowMt10}>
                <input
                  style={AdminDashboardStyle.inputW120}
                  type="number"
                  min={1}
                  max={50}
                  value={classicLevelSeedCounts[level.id] ?? 10}
                  onChange={(e) =>
                    setClassicLevelSeedCounts((v) => ({
                      ...v,
                      [level.id]: clampInt(e.target.value, 1, 50),
                    }))
                  }
                  disabled={busy}
                />
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => onSeedClassicLevelPool(level.id)}
                  disabled={busy}
                  title="Adds random eligible questions (does not remove existing)."
                >
                  {STRINGS.ADMIN.actions.autoFill}
                </button>
              </div>
            </div>
          );
        })}

        {classicLevels.length === 0 && (
          <div style={AdminDashboardStyle.emptyText}>No levels yet. Create Level 1 first.</div>
        )}
      </div>
    </AdminModal>
  );
}

