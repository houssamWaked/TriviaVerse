import React from 'react';
import colors from '../../constants/colors';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';

export default function AdminGlobalQuestionsTab({
  busy,
  levels,
  bank,
  setBank,
  onSearch,
  onAddSelectedToLevel,
  onReplaceLevelPool,
  onToggleSelected,
  onSelectAll,
  onClearSelected,
}) {
  const selectedLimit = Number(bank.maxSelect || 50) || 50;
  return (
    <div style={AdminStyle.grid}>
      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Global Question Bank</h3>
        <div style={AdminStyle.sectionSub}>
          Browse all global questions, then assign them to a story level.
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <select
            style={{ ...AdminStyle.select, flex: 1 }}
            value={bank.levelId}
            onChange={(e) => setBank((v) => ({ ...v, levelId: e.target.value }))}
            disabled={busy}
          >
            <option value="">Select story level...</option>
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
            value={bank.q}
            onChange={(e) => setBank((v) => ({ ...v, q: e.target.value }))}
            placeholder="Search (optional)..."
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch?.(0);
            }}
          />
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.(0)}
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
            disabled={busy || bank.results.length === 0}
          >
            Select all (page)
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearSelected}
            disabled={busy || bank.selected.length === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              onSearch?.(Math.max(0, (bank.offset || 0) - (bank.limit || 30)))
            }
            disabled={busy || (bank.offset || 0) <= 0}
          >
            Prev
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.((bank.offset || 0) + (bank.limit || 30))}
            disabled={busy || bank.results.length < (bank.limit || 30)}
          >
            Next
          </button>
          <span style={AdminStyle.pill}>Selected: {bank.selected.length}</span>
          <span style={AdminStyle.pill}>Max: {selectedLimit}</span>
          <span style={AdminStyle.pill}>Offset: {bank.offset || 0}</span>
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 12 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={onAddSelectedToLevel}
            disabled={busy || !bank.levelId || bank.selected.length === 0}
          >
            Add selected to level
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onReplaceLevelPool}
            disabled={busy || !bank.levelId || bank.selected.length === 0}
            title="Replace the entire level pool with your selection"
          >
            Replace level pool
          </button>
        </div>

        <div style={{ ...AdminStyle.list, marginTop: 12 }}>
          {bank.results.map((r) => (
            <div key={r.id} style={AdminStyle.listItem}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={bank.selected.includes(r.id)}
                  onChange={() => onToggleSelected?.(r.id)}
                  disabled={busy}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={AdminStyle.listItemTitle}>{r.question_text}</div>
                  <div style={AdminStyle.listItemMeta}>
                    <span style={AdminStyle.pill}>{r.id}</span>
                  </div>
                </div>
              </label>
            </div>
          ))}

          {bank.results.length === 0 && (
            <div style={{ fontWeight: 850, color: colors.neutral[700] }}>
              Click “Search” to load global questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

