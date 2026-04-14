import React from 'react';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '@/Styles/ComponentStyles/AdminDashboardStyle';
import { STRINGS } from '@/constants/strings';

/**
 * Simple progress bar used in story level overview.
 * @param value Current count.
 * @param max Max count.
 * @returns React element.
 */
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div style={AdminDashboardStyle.progressTrack}>
      <div style={AdminDashboardStyle.progressFill(pct)} />
    </div>
  );
}

/**
 * Admin "Story" workspace: create levels, view overview, and open/seed/edit story level pools.
 */
export default function AdminDashboardStoryWorkspace({
  busy,
  levelForm,
  setLevelForm,
  onCreateLevel,
  levels,
  onLoadPool,
  onSeedStoryLevelPool,
  onDeleteLevel,
}) {
  return (
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
            onChange={(e) => setLevelForm((v) => ({ ...v, showAdvanced: e.target.checked }))}
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
                  onChange={(e) => setLevelForm((v) => ({ ...v, xp_reward: e.target.value }))}
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
            onClick={onCreateLevel}
            disabled={busy || !String(levelForm.title || '').trim()}
          >
            {STRINGS.ADMIN.text.createLevel}
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.levelsOverview}</h3>
        <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.text.levelsOverviewHint}</div>

        <div style={AdminStyle.list}>
          {levels.length === 0 ? (
            <div style={AdminDashboardStyle.emptyText}>{STRINGS.ADMIN.sections.noLevelsFound}</div>
          ) : (
            levels.map((level) => {
              const count = Number(level.pool_count);
              const hasCount = Number.isFinite(count);
              const filled = hasCount ? Math.max(0, Math.min(10, count)) : 0;

              return (
                <div key={level.id} style={AdminStyle.listItem}>
                  <div style={AdminDashboardStyle.levelRow}>
                    <div style={AdminDashboardStyle.levelLeft}>
                      <div style={AdminStyle.listItemTitle}>
                        {STRINGS.ADMIN.format.levelListTitle(level.level_number, level.title)}
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
                          {STRINGS.ADMIN.pills.diff} {level.difficulty_min}-{level.difficulty_max}
                        </span>
                        <span style={AdminStyle.pill}>
                          {STRINGS.ADMIN.pills.xp} {level.xp_reward}
                        </span>
                      </div>
                    </div>

                    <div style={AdminDashboardStyle.actionCol}>
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={AdminStyle.btn}
                        onClick={() =>
                          onLoadPool({
                            kind: 'level',
                            id: level.id,
                            title: STRINGS.ADMIN.format.levelPoolTitle(level.level_number),
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
                        onClick={() => onSeedStoryLevelPool(level.id)}
                        disabled={busy}
                        title={STRINGS.ADMIN.hints.seedLevelPoolTitle}
                      >
                        {STRINGS.ADMIN.actions.autoFill}
                      </button>
                      <button
                        type="button"
                        className="tv-card tv-card--hover"
                        style={AdminStyle.btnDanger}
                        onClick={() => onDeleteLevel(level)}
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
  );
}

