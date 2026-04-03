import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import { AdminModal } from './AdminUi';
import { STRINGS } from '@/constants/strings';

export default function AdminDashboardPoolModal({
  open,
  title,
  onClose,
  pool,
  busy,
  selectedLevel,
  onOpenPicker,
  onLoadPool,
  onOpenEditGlobalQuestion,
  onRemoveFromPool,
  onDeleteGlobalQuestion,
  onClearPool,
}) {
  return (
    <AdminModal open={open} title={title} onClose={onClose}>
      {pool.kind === 'level' && selectedLevel ? (
        <div style={AdminDashboardStyle.rowMb12}>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.format.levelBadgeTitle(
              selectedLevel.level_number,
              selectedLevel.title
            )}
          </span>
          <span style={AdminStyle.pill}>
            {STRINGS.ADMIN.pills.diff} {selectedLevel.difficulty_min}-{selectedLevel.difficulty_max}
          </span>
          <span style={AdminStyle.pill}>{STRINGS.ADMIN.pills.xp} {selectedLevel.xp_reward}</span>
        </div>
      ) : null}

      <div style={AdminStyle.row}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btnPrimaryFull}
          onClick={() => onOpenPicker({ kind: pool.kind, id: pool.id, title: pool.title })}
          disabled={busy || !pool.id}
        >
          {STRINGS.ADMIN.actions.addQuestions}
        </button>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() =>
            onLoadPool({
              kind: pool.kind,
              id: pool.id,
              title: pool.title,
              offset: Math.max(0, pool.offset - pool.limit),
            })
          }
          disabled={busy || pool.offset <= 0}
        >
          {STRINGS.ADMIN.actions.prev}
        </button>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={() =>
            onLoadPool({
              kind: pool.kind,
              id: pool.id,
              title: pool.title,
              offset: pool.offset + pool.limit,
            })
          }
          disabled={busy || pool.questions.length < pool.limit}
        >
          {STRINGS.ADMIN.actions.next}
        </button>
        <span style={AdminStyle.pill}>
          {STRINGS.ADMIN.pills.showing} {pool.questions.length}
        </span>
      </div>

      <div style={AdminDashboardStyle.listMt12}>
        {pool.questions.map((question) => (
          <div key={question.id} style={AdminStyle.listItem}>
            <div style={AdminStyle.listItemTitle}>{question.question_text}</div>
            <div style={AdminDashboardStyle.listItemMetaBetween}>
              <div style={AdminDashboardStyle.listItemMetaLeft}>
                {question.difficulty_rating != null ? (
                  <span style={AdminStyle.pill}>
                    {STRINGS.ADMIN.pills.difficultyPrefix}
                    {question.difficulty_rating}
                  </span>
                ) : null}
                <span style={AdminStyle.pill}>{question.id}</span>
              </div>
              <div style={AdminStyle.row}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => onOpenEditGlobalQuestion(question.id)}
                  disabled={busy}
                >
                  {STRINGS.ADMIN.actions.edit}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btn}
                  onClick={() => onRemoveFromPool(question.id)}
                  disabled={busy}
                >
                  {STRINGS.ADMIN.actions.remove}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={AdminStyle.btnDanger}
                  onClick={() => onDeleteGlobalQuestion(question.id, { source: 'pool' })}
                  disabled={busy}
                >
                  {STRINGS.ADMIN.actions.deleteQuestion}
                </button>
              </div>
            </div>
          </div>
        ))}
        {pool.questions.length === 0 && (
          <div style={AdminDashboardStyle.emptyText}>{STRINGS.ADMIN.sections.noQuestionsYet}</div>
        )}
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
            onClick={onClearPool}
            disabled={busy}
          >
            {STRINGS.ADMIN.actions.clearPool}
          </button>
        </div>
      </details>
    </AdminModal>
  );
}

