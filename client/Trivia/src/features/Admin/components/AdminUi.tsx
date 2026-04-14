import React from 'react';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import AdminUiStyle from '@/Styles/ComponentStyles/AdminUiStyle';
import { STRINGS } from '@/constants/strings';

/**
 * Admin UI tab button.
 * @param active Whether the tab is active.
 * @param label Visible tab label.
 * @param onClick Click handler.
 * @returns Button element.
 */
export function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      style={AdminUiStyle.tabBtn(active)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/**
 * Reusable modal shell for admin screens.
 * @param open Whether the modal is visible.
 * @param title Modal title text.
 * @param onClose Callback invoked when the modal should close.
 * @param children Modal body content.
 * @param maxWidth Max card width in px.
 * @returns Modal markup or `null` when closed.
 */
export function AdminModal({ open, title, onClose, children, maxWidth = 980 }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={AdminUiStyle.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="tv-card"
        style={AdminUiStyle.modalCard(maxWidth)}
      >
        <div style={AdminUiStyle.modalHeader}>
          <div style={AdminUiStyle.modalTitle}>{title}</div>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminUiStyle.modalCloseBtn}
            onClick={onClose}
          >
            {STRINGS.COMMON.buttons.close}
          </button>
        </div>
        <div style={AdminUiStyle.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Checkbox list renderer for admin question search results.
 * @param results Array of result rows.
 * @param selected List of selected ids.
 * @param onToggle Toggle callback for a given id.
 * @param busy Whether interactions are disabled.
 * @param emptyText Text shown when results are empty.
 * @returns Results list markup.
 */
export function SearchResults({
  results,
  selected,
  onToggle,
  busy,
  emptyText = STRINGS.ADMIN.hints.searchToSeeResultsEmpty,
}) {
  return (
    <div style={AdminStyle.list}>
      {results.map((r) => (
        <div key={r.id} style={AdminStyle.listItem}>
          <label style={AdminUiStyle.resultLabel}>
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              onChange={() => onToggle(r.id)}
              disabled={busy}
              style={AdminUiStyle.checkbox}
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
        <div style={AdminUiStyle.emptyText}>{emptyText}</div>
      )}
    </div>
  );
}

