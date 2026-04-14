import React from 'react';
import AdminStyle from '@/Styles/ComponentStyles/AdminStyle';
import { AdminModal } from './AdminUi';
import { STRINGS } from '@/constants/strings';

export default function AdminDashboardEditQuestionModal({
  open,
  busy,
  editQuestion,
  setEditQuestion,
  onClose,
  onSave,
}) {
  return (
    <AdminModal
      open={open}
      title={STRINGS.ADMIN.modals.editGlobalQuestionTitle}
      onClose={onClose}
      maxWidth={980}
    >
      <div style={AdminStyle.field}>
        <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.question}</span>
        <textarea
          style={AdminStyle.textarea}
          value={editQuestion.question_text}
          onChange={(e) => setEditQuestion((v) => ({ ...v, question_text: e.target.value }))}
          disabled={busy}
        />
      </div>

      <div style={AdminStyle.field}>
        <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.explanation}</span>
        <textarea
          style={AdminStyle.textarea}
          value={editQuestion.explanation}
          onChange={(e) => setEditQuestion((v) => ({ ...v, explanation: e.target.value }))}
          placeholder={STRINGS.ADMIN.text.explanationPlaceholder}
          disabled={busy}
        />
      </div>

      <div style={AdminStyle.rowMt14}>
        <span style={AdminStyle.pill}>{STRINGS.ADMIN.labels.difficultyRating}</span>
        <input
          style={{ ...AdminStyle.input, width: 120 }}
          type="number"
          min={1}
          max={10}
          value={Number(editQuestion.difficulty_rating) || 5}
          onChange={(e) =>
            setEditQuestion((v) => ({ ...v, difficulty_rating: Number(e.target.value) }))
          }
          disabled={busy}
        />

        <span style={AdminStyle.pill}>{STRINGS.ADMIN.labels.timeLimitSec}</span>
        <input
          style={{ ...AdminStyle.input, width: 140 }}
          type="number"
          min={3}
          max={600}
          value={Number(editQuestion.time_limit_sec) || 30}
          onChange={(e) =>
            setEditQuestion((v) => ({ ...v, time_limit_sec: Number(e.target.value) }))
          }
          disabled={busy}
        />

        <span style={AdminStyle.pill}>{STRINGS.ADMIN.labels.points}</span>
        <input
          style={{ ...AdminStyle.input, width: 140 }}
          type="number"
          min={0}
          max={100000}
          value={Number(editQuestion.points) || 100}
          onChange={(e) => setEditQuestion((v) => ({ ...v, points: Number(e.target.value) }))}
          disabled={busy}
        />
      </div>

      <div style={AdminStyle.field}>
        <span style={AdminStyle.label}>Options</span>
        <div style={AdminStyle.row}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            disabled={busy || (editQuestion.options || []).length >= 6}
            onClick={() =>
              setEditQuestion((v) => ({
                ...v,
                options: [...(v.options || []), STRINGS.ADMIN.placeholders.newOption],
              }))
            }
          >
            {STRINGS.ADMIN.actions.addOption}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(editQuestion.options || []).map((opt, idx) => (
          <div key={idx} style={AdminStyle.row}>
            <input
              type="radio"
              name="edit-correct"
              checked={Number(editQuestion.correctIndex) === idx}
              onChange={() => setEditQuestion((v) => ({ ...v, correctIndex: idx }))}
              disabled={busy}
            />
            <input
              style={{ ...AdminStyle.input, flex: '1 1 auto', minWidth: 240 }}
              value={opt}
              onChange={(e) =>
                setEditQuestion((v) => {
                  const next = (v.options || []).slice();
                  next[idx] = e.target.value;
                  return { ...v, options: next };
                })
              }
              disabled={busy}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              disabled={busy || (editQuestion.options || []).length <= 2}
              onClick={() =>
                setEditQuestion((v) => {
                  const next = (v.options || []).filter((_, i) => i !== idx);
                  const currentCorrect = Number(v.correctIndex) || 0;
                  const nextCorrect =
                    idx === currentCorrect ? 0 : idx < currentCorrect ? currentCorrect - 1 : currentCorrect;
                  return { ...v, options: next, correctIndex: Math.max(0, nextCorrect) };
                })
              }
            >
              {STRINGS.ADMIN.actions.remove}
            </button>
          </div>
        ))}
      </div>

      <div style={AdminStyle.rowMt14}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btnPrimaryFull}
          onClick={onSave}
          disabled={
            busy ||
            !String(editQuestion.question_text || '').trim() ||
            !String(editQuestion.explanation || '').trim()
          }
        >
          {STRINGS.ADMIN.actions.saveChanges}
        </button>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={AdminStyle.btn}
          onClick={onClose}
          disabled={busy}
        >
          {STRINGS.COMMON.buttons.close}
        </button>
      </div>
    </AdminModal>
  );
}


