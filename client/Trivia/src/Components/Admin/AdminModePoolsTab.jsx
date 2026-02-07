import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminModePoolsTabStyle from '../../Styles/ComponentStyles/AdminModePoolsTabStyle';
import { SearchResults } from './AdminUi';
import { STRINGS } from '@/constants/strings';

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
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.addExistingToMode}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.text.modePoolsSubtitle}
        </div>

        <div style={AdminModePoolsTabStyle.rowMt10}>
          <select
            style={AdminModePoolsTabStyle.selectFlex1}
            value={poolPick.mode}
            onChange={(e) => onChangeMode?.(e.target.value)}
            disabled={busy}
          >
            <option value={STRINGS.ADMIN.modeOptions.classic}>{STRINGS.ADMIN.modeOptions.classic}</option>
            <option value={STRINGS.ADMIN.modeOptions.blitz}>{STRINGS.ADMIN.modeOptions.blitz}</option>
            <option value={STRINGS.ADMIN.modeOptions.millionaire}>
              {STRINGS.ADMIN.modeOptions.millionaire}
            </option>
          </select>
        </div>

        <div style={AdminModePoolsTabStyle.rowMt10}>
          <input
            style={AdminModePoolsTabStyle.inputFlex1}
            value={poolPick.q}
            onChange={(e) => setPoolPick((v) => ({ ...v, q: e.target.value }))}
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
            {STRINGS.ADMIN.actions.search}
          </button>
        </div>

        <div style={AdminModePoolsTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onSelectAll}
            disabled={busy || poolPick.results.length === 0}
          >
            {STRINGS.ADMIN.actions.selectAll}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearSelected}
            disabled={busy || poolPick.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.clear}
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
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onSearch?.((poolPick.offset || 0) + (poolPick.limit || 20))}
            disabled={busy || poolPick.results.length < (poolPick.limit || 20)}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.selected} {poolPick.selected.length}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.max} {poolPick.maxSelect || 6}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.offset} {poolPick.offset || 0}
          </span>
        </div>

        <SearchResults
          results={poolPick.results}
          selected={poolPick.selected}
          onToggle={onToggleSelected}
          busy={busy}
        />

        <div style={AdminModePoolsTabStyle.rowMt12}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={onAddSelected}
            disabled={busy || poolPick.selected.length === 0}
          >
            {STRINGS.ADMIN.actions.addSelectedToMode}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onReplaceSelected}
            disabled={busy || poolPick.selected.length === 0}
            title={STRINGS.ADMIN.hints.replacePoolTitle}
          >
            {STRINGS.ADMIN.actions.replacePool}
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.poolSizes}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.text.poolSizesHint}
        </div>

        <div style={AdminModePoolsTabStyle.listMt12}>
          <div style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>{STRINGS.ADMIN.poolSizeLabels.classic}</div>
            <div style={AdminStyle.listItemMeta}>
              <span style={AdminStyle.pill}>{modeCounts.classic ?? '-'}</span>
            </div>
          </div>
          <div style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>{STRINGS.ADMIN.poolSizeLabels.blitz}</div>
            <div style={AdminStyle.listItemMeta}>
              <span style={AdminStyle.pill}>{modeCounts.blitz ?? '-'}</span>
            </div>
          </div>
          <div style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>{STRINGS.ADMIN.poolSizeLabels.millionaire}</div>
            <div style={AdminStyle.listItemMeta}>
              <span style={AdminStyle.pill}>{modeCounts.millionaire ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.currentPool}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.text.currentModePoolSubtitle}
        </div>

        <div style={AdminModePoolsTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onLoadPool}
            disabled={busy}
          >
            {STRINGS.ADMIN.actions.refreshPool}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onClearPool}
            disabled={busy}
            title={STRINGS.ADMIN.hints.clearModePoolTitle}
          >
            {STRINGS.ADMIN.actions.clearPool}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.showingBare} {poolPick.poolQuestions?.length || 0}
          </span>
        </div>

        <div style={AdminModePoolsTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onPrevPoolPage}
            disabled={busy || (poolPick.poolOffset ?? 0) <= 0}
          >
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={onNextPoolPage}
            disabled={busy || (poolPick.poolQuestions?.length || 0) < (poolPick.poolLimit || 50)}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.offset} {poolPick.poolOffset ?? 0}
          </span>
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
                  {STRINGS.ADMIN.actions.remove}
                </button>
              </div>
            </div>
          ))}
          {(poolPick.poolQuestions || []).length === 0 && (
            <div style={AdminModePoolsTabStyle.emptyText}>
              {STRINGS.ADMIN.text.refreshPoolToLoad}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
