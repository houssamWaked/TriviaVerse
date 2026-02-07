import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import { SearchResults } from './AdminUi';

export default function AdminModePoolsTab({
  busy,
  modeCounts,
  poolPick,
  setPoolPick,
  onChangeMode,
  onLoadPool,
  onPrevPoolPage,
  onNextPoolPage,
  onRemoveFromPool,
  onClearPool,
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
        <h3 style={AdminStyle.sectionTitle}>Add existing questions to a mode</h3>
        <div style={AdminStyle.sectionSub}>
          Search global questions, select, then add to Classic / Blitz / Millionaire.
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <select
            style={{ ...AdminStyle.select, flex: 1 }}
            value={poolPick.mode}
            onChange={(e) => onChangeMode?.(e.target.value)}
            disabled={busy}
          >
            <option value="classic">classic</option>
            <option value="blitz">blitz</option>
            <option value="millionaire">millionaire</option>
          </select>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <input
            style={{ ...AdminStyle.input, flex: 1 }}
            value={poolPick.q}
            onChange={(e) => setPoolPick((v) => ({ ...v, q: e.target.value }))}
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
            disabled={busy || poolPick.results.length === 0}
          >
            Select all
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearSelected}
            disabled={busy || poolPick.selected.length === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              onSearch?.(
                Math.max(0, (poolPick.offset || 0) - (poolPick.limit || 20))
              )
            }
            disabled={busy || (poolPick.offset || 0) <= 0}
          >
            Prev
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.((poolPick.offset || 0) + (poolPick.limit || 20))}
            disabled={busy || poolPick.results.length < (poolPick.limit || 20)}
          >
            Next
          </button>
          <span style={AdminStyle.pill}>Selected: {poolPick.selected.length}</span>
          <span style={AdminStyle.pill}>Max: {poolPick.maxSelect || 6}</span>
          <span style={AdminStyle.pill}>Offset: {poolPick.offset || 0}</span>
        </div>

        <SearchResults
          results={poolPick.results}
          selected={poolPick.selected}
          onToggle={onToggleSelected}
          busy={busy}
        />

        <div style={{ ...AdminStyle.row, marginTop: 12 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={onAddSelected}
            disabled={busy || poolPick.selected.length === 0}
          >
            Add selected to mode
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onReplaceSelected}
            disabled={busy || poolPick.selected.length === 0}
            title="Replace the entire pool with your selected questions"
          >
            Replace pool
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Pool sizes</h3>
        <div style={AdminStyle.sectionSub}>
          These counts are used when starting sessions.
        </div>

        <div style={{ ...AdminStyle.list, marginTop: 12 }}>
          <div style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>Classic</div>
            <div style={AdminStyle.listItemMeta}>
              <span style={AdminStyle.pill}>{modeCounts.classic ?? '-'}</span>
            </div>
          </div>
          <div style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>Blitz</div>
            <div style={AdminStyle.listItemMeta}>
              <span style={AdminStyle.pill}>{modeCounts.blitz ?? '-'}</span>
            </div>
          </div>
          <div style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>Millionaire</div>
            <div style={AdminStyle.listItemMeta}>
              <span style={AdminStyle.pill}>{modeCounts.millionaire ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Current pool</h3>
        <div style={AdminStyle.sectionSub}>
          View / remove questions currently assigned to this mode.
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onLoadPool}
            disabled={busy}
          >
            Refresh pool
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearPool}
            disabled={busy}
            title="Remove all questions from this mode pool"
          >
            Clear pool
          </button>
          <span style={AdminStyle.pill}>
            Showing {poolPick.poolQuestions?.length || 0}
          </span>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onPrevPoolPage}
            disabled={busy || (poolPick.poolOffset ?? 0) <= 0}
          >
            Prev
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onNextPoolPage}
            disabled={busy || (poolPick.poolQuestions?.length || 0) < (poolPick.poolLimit || 50)}
          >
            Next
          </button>
          <span style={AdminStyle.pill}>Offset: {poolPick.poolOffset ?? 0}</span>
        </div>

        <div style={AdminStyle.list}>
          {(poolPick.poolQuestions || []).map((q) => (
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
          {(poolPick.poolQuestions || []).length === 0 && (
            <div style={{ fontWeight: 850, color: '#444' }}>
              Click “Refresh pool” to load questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
