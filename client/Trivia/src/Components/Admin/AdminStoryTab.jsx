import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminStoryTabStyle from '../../Styles/ComponentStyles/AdminStoryTabStyle';
import { SearchResults } from './AdminUi';
import { STRINGS } from '@/constants/strings';

export default function AdminStoryTab({
  busy,
  levels,
  levelForm,
  setLevelForm,
  seedCounts,
  setSeedCounts,
  storyPick,
  setStoryPick,
  onChangeLevel,
  onLoadPool,
  onPrevPoolPage,
  onNextPoolPage,
  onRemoveFromPool,
  onClearPool,
  onCreateLevel,
  onSeedLevel,
  onSearch,
  onAddSelected,
  onReplaceSelected,
  onToggleSelected,
  onSelectAll,
  onClearSelected,
}) {
  return (
    <div style={AdminStyle.grid}>
      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.createStoryLevel}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.text.onlyTitleAdvancedOptional}
        </div>

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

        <label style={AdminStoryTabStyle.toggleLabel}>
          <input
            type="checkbox"
            checked={!!levelForm.showAdvanced}
            onChange={(e) => setLevelForm((v) => ({ ...v, showAdvanced: e.target.checked }))}
            disabled={busy}
            style={AdminStoryTabStyle.checkboxMr8}
          />
          {STRINGS.ADMIN.text.showAdvancedSettings}
        </label>

        {levelForm.showAdvanced && (
          <>
            <div style={AdminStoryTabStyle.rowMt10}>
              <label style={AdminStoryTabStyle.fieldFlex1NoMt}>
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
              <label style={AdminStoryTabStyle.fieldFlex1NoMt}>
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

            <div style={AdminStoryTabStyle.rowMt10}>
              <label style={AdminStoryTabStyle.fieldFlex1NoMt}>
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
              <label style={AdminStoryTabStyle.fieldFlex1NoMt}>
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

        <div style={AdminStoryTabStyle.rowMt14}>
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
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.levels}</h3>
        <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.sections.seedLevelsHint}</div>

        <div style={AdminStyle.list}>
          {levels.length === 0 ? (
            <div style={AdminStoryTabStyle.emptyText}>
              {STRINGS.ADMIN.sections.noLevelsFound}
            </div>
          ) : (
            levels.map((lvl) => (
              <div key={lvl.id} style={AdminStyle.listItem}>
                <div style={AdminStyle.listItemTitle}>
                  #{lvl.level_number} - {lvl.title}
                </div>
                <div style={AdminStyle.listItemMeta}>
                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.pool} {lvl.pool_count ?? '-'}
                  </span>
                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.diff} {lvl.difficulty_min}-{lvl.difficulty_max}
                  </span>
                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.xp} {lvl.xp_reward}
                  </span>
                </div>

                <div style={AdminStoryTabStyle.rowMt10}>
                  <input
                    style={AdminStoryTabStyle.seedCountInput}
                    type="number"
                    min={1}
                    max={50}
                    value={seedCounts[lvl.id] ?? 10}
                    onChange={(e) =>
                      setSeedCounts((m) => ({ ...m, [lvl.id]: e.target.value }))
                    }
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={AdminStyle.btnPrimaryFull}
                    onClick={() => onSeedLevel(lvl.id)}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.text.seedRandom}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.addExistingToLevel}</h3>
        <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.text.addExistingQuestionsSubtitle}</div>

        <div style={AdminStoryTabStyle.rowMt10}>
          <select
            style={AdminStoryTabStyle.selectFlex1}
            value={storyPick.levelId}
            onChange={(e) => onChangeLevel?.(e.target.value)}
            disabled={busy}
          >
            <option value="">{STRINGS.ADMIN.sections.selectLevel}</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                #{lvl.level_number} - {lvl.title}
              </option>
            ))}
          </select>
        </div>

        <div style={AdminStoryTabStyle.rowMt10}>
          <input
            style={AdminStoryTabStyle.inputFlex1}
            value={storyPick.q}
            onChange={(e) => setStoryPick((v) => ({ ...v, q: e.target.value }))}
            placeholder={STRINGS.ADMIN.text.searchQuestionsPlaceholder}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
          />
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onSearch}
            disabled={busy}
          >
            Search
          </button>
        </div>

        <div style={AdminStoryTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onSelectAll}
            disabled={busy || storyPick.results.length === 0}
          >
            {STRINGS.ADMIN.actions.selectAll}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearSelected}
            disabled={busy || storyPick.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.clear}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              onSearch?.(
                Math.max(0, (storyPick.offset || 0) - (storyPick.limit || 20))
              )
            }
            disabled={busy || (storyPick.offset || 0) <= 0}
          >
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.((storyPick.offset || 0) + (storyPick.limit || 20))}
            disabled={busy || storyPick.results.length < (storyPick.limit || 20)}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.selected} {storyPick.selected.length}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.max} {storyPick.maxSelect || 6}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.offset} {storyPick.offset || 0}
          </span>
        </div>

        <SearchResults
          results={storyPick.results}
          selected={storyPick.selected}
          onToggle={onToggleSelected}
          busy={busy}
        />

        <div style={AdminStoryTabStyle.rowMt12}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={onAddSelected}
            disabled={
              busy ||
              !String(storyPick.levelId || '').trim() ||
              storyPick.selected.length === 0
            }
          >
            {STRINGS.ADMIN.actions.addSelectedToLevel}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onReplaceSelected}
            disabled={
              busy ||
              !String(storyPick.levelId || '').trim() ||
              storyPick.selected.length === 0
            }
            title={STRINGS.ADMIN.hints.replaceLevelPoolTitle}
          >
            {STRINGS.ADMIN.actions.replacePool}
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.currentLevelPool}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.text.currentLevelPoolSubtitle}
        </div>

        <div style={AdminStoryTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onLoadPool}
            disabled={busy || !String(storyPick.levelId || '').trim()}
          >
            {STRINGS.ADMIN.actions.refreshPool}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearPool}
            disabled={busy || !String(storyPick.levelId || '').trim()}
            title={STRINGS.ADMIN.hints.clearLevelPoolTitle}
          >
            {STRINGS.ADMIN.actions.clearPool}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.showingBare} {storyPick.poolQuestions?.length || 0}
          </span>
        </div>

        <div style={AdminStoryTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onPrevPoolPage}
            disabled={busy || (storyPick.poolOffset ?? 0) <= 0}
          >
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onNextPoolPage}
            disabled={
              busy ||
              (storyPick.poolQuestions?.length || 0) < (storyPick.poolLimit || 50)
            }
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.offset} {storyPick.poolOffset ?? 0}
          </span>
        </div>

        <div style={AdminStyle.list}>
          {(storyPick.poolQuestions || []).map((q) => (
            <div key={q.id} style={AdminStyle.listItem}>
              <div style={AdminStyle.listItemTitle}>{q.question_text}</div>
              <div style={AdminStyle.listItemMeta}>
                <span style={AdminStyle.pill}>{q.id}</span>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => onRemoveFromPool?.(q.id)}
                  disabled={busy}
                >
                  {STRINGS.ADMIN.actions.remove}
                </button>
              </div>
            </div>
          ))}
          {(storyPick.poolQuestions || []).length === 0 && (
            <div style={AdminStoryTabStyle.emptyText}>
              {STRINGS.ADMIN.text.selectLevelThenRefreshPool}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
