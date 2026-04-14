import React from 'react';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import AdminGlobalQuestionsTabStyle from '@/Styles/ComponentStyles/AdminGlobalQuestionsTabStyle';
import { STRINGS } from '@/constants/strings';

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
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.globalQuestionBank}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.sections.globalBankSubtitle}
        </div>

        <div style={AdminGlobalQuestionsTabStyle.rowMt10}>
          <select
            style={AdminGlobalQuestionsTabStyle.selectFlex1}
            value={bank.levelId}
            onChange={(e) => setBank((v) => ({ ...v, levelId: e.target.value }))}
            disabled={busy}
          >
            <option value="">{STRINGS.ADMIN.sections.selectStoryLevel}</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                #{lvl.level_number} - {lvl.title}
              </option>
            ))}
          </select>
        </div>

        <div style={AdminGlobalQuestionsTabStyle.rowMt10}>
          <input
            style={AdminGlobalQuestionsTabStyle.inputFlex1}
            value={bank.q}
            onChange={(e) => setBank((v) => ({ ...v, q: e.target.value }))}
            placeholder={STRINGS.ADMIN.sections.searchOptional}
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
            {STRINGS.ADMIN.actions.search}
          </button>
        </div>

        <div style={AdminGlobalQuestionsTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onSelectAll}
            disabled={busy || bank.results.length === 0}
          >
            {STRINGS.ADMIN.actions.selectAllPage}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearSelected}
            disabled={busy || bank.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.clear}
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
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.((bank.offset || 0) + (bank.limit || 30))}
            disabled={busy || bank.results.length < (bank.limit || 30)}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.selected} {bank.selected.length}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.max} {selectedLimit}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.offset} {bank.offset || 0}
          </span>
        </div>

        <div style={AdminGlobalQuestionsTabStyle.rowMt12}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={onAddSelectedToLevel}
            disabled={busy || !bank.levelId || bank.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.addSelectedToLevel}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onReplaceLevelPool}
            disabled={busy || !bank.levelId || bank.selected.length === 0}
            title={STRINGS.ADMIN.hints.replaceLevelPoolTitle}
          >
            {STRINGS.ADMIN.actions.replaceLevelPool}
          </button>
        </div>

        <div style={AdminGlobalQuestionsTabStyle.listMt12}>
          {bank.results.map((r) => (
            <div key={r.id} style={AdminStyle.listItem}>
              <label style={AdminGlobalQuestionsTabStyle.resultLabel}>
                <input
                  type="checkbox"
                  checked={bank.selected.includes(r.id)}
                  onChange={() => onToggleSelected?.(r.id)}
                  disabled={busy}
                  style={AdminGlobalQuestionsTabStyle.checkbox}
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
            <div style={AdminGlobalQuestionsTabStyle.emptyText}>
              {STRINGS.ADMIN.hints.globalBankEmpty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

