import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import AdminQuestionBankTab from './AdminQuestionBankTab';
import { STRINGS } from '@/constants/strings';

export default function AdminDashboardQuestionsWorkspace({
  busy,
  questionForm,
  setQuestionForm,
  onCreateQuestion,
  globalBank,
  setGlobalBank,
  onLoadGlobalBank,
  onOpenEditGlobalQuestion,
  onDeleteGlobalQuestion,
}) {
  return (
    <>
      <AdminQuestionBankTab
        busy={busy}
        questionForm={questionForm}
        setQuestionForm={setQuestionForm}
        onCreateQuestion={onCreateQuestion}
      />

      <div style={AdminStyle.grid}>
        <div style={AdminStyle.section}>
          <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.globalQuestionBank}</h3>
          <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.sections.globalBankSubtitle}</div>

          <div style={AdminStyle.rowMt14}>
            <select
              style={{ ...AdminStyle.select, width: 170 }}
              value={globalBank.filter}
              onChange={(e) => {
                const nextFilter = String(e.target.value || 'all');
                setGlobalBank((v) => ({ ...v, filter: nextFilter, offset: 0 }));
                onLoadGlobalBank({ q: globalBank.q, filter: nextFilter, offset: 0 });
              }}
              disabled={busy}
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
            </select>
            <input
              style={AdminDashboardStyle.inputFlex1}
              value={globalBank.q}
              onChange={(e) => setGlobalBank((v) => ({ ...v, q: e.target.value }))}
              placeholder={STRINGS.ADMIN.text.searchQuestionsPlaceholder}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onLoadGlobalBank({
                    q: globalBank.q,
                    filter: globalBank.filter,
                    offset: 0,
                  });
                }
              }}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() =>
                onLoadGlobalBank({
                  q: globalBank.q,
                  filter: globalBank.filter,
                  offset: 0,
                })
              }
              disabled={busy}
            >
              {STRINGS.ADMIN.actions.search}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() =>
                onLoadGlobalBank({
                  q: globalBank.q,
                  filter: globalBank.filter,
                  offset: globalBank.offset,
                })
              }
              disabled={busy}
            >
              {STRINGS.ADMIN.actions.refreshList}
            </button>
          </div>

          <div style={AdminStyle.list}>
            {globalBank.results.map((question) => (
              <div key={question.id} style={AdminStyle.listItem}>
                <div style={AdminStyle.listItemTitle}>{question.question_text}</div>
                <div style={AdminStyle.listItemMeta}>
                  {question.difficulty_rating != null ? (
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.pills.difficultyPrefix}
                      {question.difficulty_rating}
                    </span>
                  ) : null}
                  {question?.is_assigned === true ? (
                    <span style={AdminStyle.pill}>Assigned</span>
                  ) : (
                    <span style={AdminStyle.pill}>Unassigned</span>
                  )}
                  <span style={AdminStyle.pill}>{question.id}</span>
                </div>
                <div style={AdminStyle.rowMt14}>
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
                    style={AdminStyle.btnDanger}
                    onClick={() => onDeleteGlobalQuestion(question.id)}
                    disabled={busy}
                  >
                    {STRINGS.ADMIN.actions.deleteQuestion}
                  </button>
                </div>
              </div>
            ))}

            {globalBank.results.length === 0 && (
              <div style={AdminDashboardStyle.emptyText}>
                {globalBank.loaded
                  ? STRINGS.ADMIN.sections.noResults
                  : STRINGS.ADMIN.hints.globalBankEmpty}
              </div>
            )}
          </div>

          <div style={AdminStyle.rowMt14}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() =>
                onLoadGlobalBank({
                  q: globalBank.q,
                  filter: globalBank.filter,
                  offset: Math.max(0, globalBank.offset - globalBank.limit),
                })
              }
              disabled={busy || globalBank.offset <= 0}
            >
              {STRINGS.ADMIN.actions.prev}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() =>
                onLoadGlobalBank({
                  q: globalBank.q,
                  filter: globalBank.filter,
                  offset: globalBank.offset + globalBank.limit,
                })
              }
              disabled={busy || globalBank.can_next === false}
            >
              {STRINGS.ADMIN.actions.next}
            </button>
            <span style={AdminStyle.pill}>
              {STRINGS.ADMIN.pills.showingBare} {globalBank.results.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
