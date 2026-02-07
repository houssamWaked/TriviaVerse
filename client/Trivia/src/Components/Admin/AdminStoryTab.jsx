import React from 'react';
import colors from '../../constants/colors';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import { SearchResults } from './AdminUi';

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
        <h3 style={AdminStyle.sectionTitle}>Create story level</h3>
        <div style={AdminStyle.sectionSub}>
          Only title is required. Advanced settings are optional.
        </div>

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
            onChange={(e) => setLevelForm((v) => ({ ...v, showAdvanced: e.target.checked }))}
            disabled={busy}
            style={{ marginRight: 8 }}
          />
          Show advanced settings
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
                  onChange={(e) => setLevelForm((v) => ({ ...v, xp_reward: e.target.value }))}
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
            onClick={onCreateLevel}
            disabled={busy || !String(levelForm.title || '').trim()}
          >
            Create level
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Levels</h3>
        <div style={AdminStyle.sectionSub}>Seed a level with random global questions.</div>

        <div style={AdminStyle.list}>
          {levels.length === 0 ? (
            <div style={{ fontWeight: 850, color: colors.neutral[700] }}>No levels found.</div>
          ) : (
            levels.map((lvl) => (
              <div key={lvl.id} style={AdminStyle.listItem}>
                <div style={AdminStyle.listItemTitle}>
                  #{lvl.level_number} - {lvl.title}
                </div>
                <div style={AdminStyle.listItemMeta}>
                  <span style={AdminStyle.pill}>Pool: {lvl.pool_count ?? '-'}</span>
                  <span style={AdminStyle.pill}>
                    Diff {lvl.difficulty_min}-{lvl.difficulty_max}
                  </span>
                  <span style={AdminStyle.pill}>XP {lvl.xp_reward}</span>
                </div>

                <div style={{ ...AdminStyle.row, marginTop: 10 }}>
                  <input
                    style={{ ...AdminStyle.input, width: 120 }}
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
                    style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
                    onClick={() => onSeedLevel(lvl.id)}
                    disabled={busy}
                  >
                    Seed random
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Add existing questions to a level</h3>
        <div style={AdminStyle.sectionSub}>
          Search global questions, select, then add to a story level.
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <select
            style={{ ...AdminStyle.select, flex: 1 }}
            value={storyPick.levelId}
            onChange={(e) => onChangeLevel?.(e.target.value)}
            disabled={busy}
          >
            <option value="">Select level...</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                #{lvl.level_number} - {lvl.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <input
            style={{ ...AdminStyle.input, flex: 1 }}
            value={storyPick.q}
            onChange={(e) => setStoryPick((v) => ({ ...v, q: e.target.value }))}
            placeholder="Search questions (blank = browse all)..."
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

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onSelectAll}
            disabled={busy || storyPick.results.length === 0}
          >
            Select all
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearSelected}
            disabled={busy || storyPick.selected.length === 0}
          >
            Clear
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
            Prev
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.((storyPick.offset || 0) + (storyPick.limit || 20))}
            disabled={busy || storyPick.results.length < (storyPick.limit || 20)}
          >
            Next
          </button>
          <span style={AdminStyle.pill}>Selected: {storyPick.selected.length}</span>
          <span style={AdminStyle.pill}>Max: {storyPick.maxSelect || 6}</span>
          <span style={AdminStyle.pill}>Offset: {storyPick.offset || 0}</span>
        </div>

        <SearchResults
          results={storyPick.results}
          selected={storyPick.selected}
          onToggle={onToggleSelected}
          busy={busy}
        />

        <div style={{ ...AdminStyle.row, marginTop: 12 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={onAddSelected}
            disabled={
              busy ||
              !String(storyPick.levelId || '').trim() ||
              storyPick.selected.length === 0
            }
          >
            Add selected to level
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
            title="Replace the entire level pool with your selected questions"
          >
            Replace pool
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Current level pool</h3>
        <div style={AdminStyle.sectionSub}>
          View / remove questions currently assigned to the selected level.
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onLoadPool}
            disabled={busy || !String(storyPick.levelId || '').trim()}
          >
            Refresh pool
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearPool}
            disabled={busy || !String(storyPick.levelId || '').trim()}
            title="Remove all questions from this level pool"
          >
            Clear pool
          </button>
          <span style={AdminStyle.pill}>
            Showing {storyPick.poolQuestions?.length || 0}
          </span>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onPrevPoolPage}
            disabled={busy || (storyPick.poolOffset ?? 0) <= 0}
          >
            Prev
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
            Next
          </button>
          <span style={AdminStyle.pill}>Offset: {storyPick.poolOffset ?? 0}</span>
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
                  Remove
                </button>
              </div>
            </div>
          ))}
          {(storyPick.poolQuestions || []).length === 0 && (
            <div style={{ fontWeight: 850, color: colors.neutral[700] }}>
              Select a level, then click “Refresh pool”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
