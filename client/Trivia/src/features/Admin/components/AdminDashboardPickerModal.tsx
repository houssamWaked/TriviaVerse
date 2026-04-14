import React from 'react';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '@/Styles/ComponentStyles/AdminDashboardStyle';
import { AdminModal } from './AdminUi';
import { STRINGS } from '@/constants/strings';

function toggleIdLimited(list, id, max = 0) {
  const exists = list.includes(id);
  if (exists) return list.filter((item) => item !== id);
  if (max && list.length >= max) return list;
  return [...list, id];
}

export default function AdminDashboardPickerModal({
  open,
  picker,
  busy,
  onClose,
  setPicker,
  onLoadPicker,
  onOpenEditGlobalQuestion,
  onDeleteGlobalQuestion,
  onAddPickerSelection,
}) {
  return (
    <AdminModal
      open={open}
      title={
        picker.target
          ? STRINGS.ADMIN.modals.addGlobalQuestionsTitle(picker.target.title)
          : STRINGS.ADMIN.modals.addQuestionsTitle
      }
      onClose={onClose}
    >
      <div style={AdminStyle.row}>
        <input
          style={AdminDashboardStyle.inputFlex1}
          value={picker.q}
          onChange={(e) => setPicker((v) => ({ ...v, q: e.target.value }))}
          placeholder={STRINGS.ADMIN.text.pickerSearchOptionalPlaceholder}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onLoadPicker({ q: picker.q, offset: 0, keepSelected: true });
          }}
        />
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() => onLoadPicker({ q: picker.q, offset: 0, keepSelected: true })}
          disabled={busy}
        >
          {STRINGS.ADMIN.actions.search}
        </button>
      </div>

      <div style={AdminDashboardStyle.rowMt10}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() =>
            setPicker((v) => ({
              ...v,
              selected: v.results.slice(0, v.maxSelect).map((result) => result.id),
            }))
          }
          disabled={busy || picker.results.length === 0}
        >
          {STRINGS.ADMIN.actions.selectPage}
        </button>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() => setPicker((v) => ({ ...v, selected: [] }))}
          disabled={busy || picker.selected.length === 0}
        >
          {STRINGS.ADMIN.actions.clear}
        </button>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() =>
            onLoadPicker({
              q: picker.q,
              offset: Math.max(0, picker.offset - picker.limit),
              keepSelected: true,
            })
          }
          disabled={busy || picker.offset <= 0}
        >
          {STRINGS.ADMIN.actions.prev}
        </button>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() =>
            onLoadPicker({
              q: picker.q,
              offset: picker.offset + picker.limit,
              keepSelected: true,
            })
          }
          disabled={busy || picker.can_next === false}
        >
          {STRINGS.ADMIN.actions.next}
        </button>
        <span style={AdminStyle.pill}>
          {STRINGS.ADMIN.pills.selected} {picker.selected.length}/{picker.maxSelect}
        </span>
      </div>

      <div style={AdminDashboardStyle.listMt12}>
        {picker.results.map((result) => (
          <div key={result.id} style={AdminStyle.listItem}>
            <div style={AdminDashboardStyle.listItemMetaBetween}>
              <label style={AdminDashboardStyle.pickerLabel}>
                <input
                  type="checkbox"
                  checked={picker.selected.includes(result.id)}
                  onChange={() =>
                    setPicker((v) => ({
                      ...v,
                      selected: toggleIdLimited(v.selected, result.id, v.maxSelect),
                    }))
                  }
                  disabled={busy}
                  style={AdminDashboardStyle.checkboxMt3}
                />
                <div>
                  <div style={AdminStyle.listItemTitle}>{result.question_text}</div>
                  <div style={AdminStyle.listItemMeta}>
                    {result.difficulty_rating != null ? (
                      <span style={AdminStyle.pill}>
                        {STRINGS.ADMIN.pills.difficultyPrefix}
                        {result.difficulty_rating}
                      </span>
                    ) : null}
                    <span style={AdminStyle.pill}>{result.id}</span>
                  </div>
                </div>
              </label>

              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                disabled={busy}
                onClick={() => onOpenEditGlobalQuestion(result.id)}
              >
                {STRINGS.ADMIN.actions.edit}
              </button>

              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btnDanger}
                disabled={busy}
                onClick={() => onDeleteGlobalQuestion(result.id, { source: 'picker' })}
              >
                {STRINGS.ADMIN.actions.deleteQuestion}
              </button>
            </div>
          </div>
        ))}
        {picker.results.length === 0 && (
          <div style={AdminDashboardStyle.emptyText}>
            {STRINGS.ADMIN.sections.noResults}
            <div style={{ marginTop: 6, opacity: 0.9 }}>
              Only <b>unassigned global</b> questions are shown here. If this list is empty, create
              more global questions or remove some questions from other pools (Story / Mode / Classic)
              so they become eligible.
            </div>
          </div>
        )}
      </div>

      <div style={AdminDashboardStyle.rowMt12}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btnPrimaryFull}
          onClick={() => onAddPickerSelection({ replace: false })}
          disabled={busy || picker.selected.length === 0}
        >
          {STRINGS.ADMIN.actions.addSelected}
        </button>
      </div>

      <details style={AdminDashboardStyle.detailsMt12}>
        <summary style={AdminDashboardStyle.detailsSummary}>
          {STRINGS.ADMIN.sections.dangerZone}
        </summary>
        <div style={AdminDashboardStyle.detailsRowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onAddPickerSelection({ replace: true })}
            disabled={busy || picker.selected.length === 0}
            title={STRINGS.ADMIN.hints.replacePoolTitle}
          >
            {STRINGS.ADMIN.actions.replacePoolWithSelected}
          </button>
        </div>
      </details>
    </AdminModal>
  );
}


