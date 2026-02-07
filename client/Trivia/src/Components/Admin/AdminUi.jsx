import React from 'react';
import colors from '../../constants/colors';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';

export function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      style={{ ...AdminStyle.tabBtn, ...(active ? AdminStyle.tabBtnActive : {}) }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function AdminModal({ open, title, onClose, children, maxWidth = 980 }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 8, 20, 0.55)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="tv-card"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: 'calc(100vh - 36px)',
          overflow: 'auto',
          borderRadius: 22,
          background: colors.neutral.white,
          boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 950, color: colors.neutral[900] }}>{title}</div>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{
              ...AdminStyle.btn,
              height: 40,
              borderRadius: 14,
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export function SearchResults({
  results,
  selected,
  onToggle,
  busy,
  emptyText = 'Search to see results here.',
}) {
  return (
    <div style={AdminStyle.list}>
      {results.map((r) => (
        <div key={r.id} style={AdminStyle.listItem}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              onChange={() => onToggle(r.id)}
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
      {results.length === 0 && (
        <div style={{ fontWeight: 850, color: colors.neutral[700] }}>{emptyText}</div>
      )}
    </div>
  );
}
