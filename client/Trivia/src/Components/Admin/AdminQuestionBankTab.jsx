import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminQuestionBankTabStyle from '../../Styles/ComponentStyles/AdminQuestionBankTabStyle';
import { STRINGS } from '@/constants/strings';

export default function AdminQuestionBankTab({
  busy,
  questionForm,
  setQuestionForm,
  onCreateQuestion,
}) {
  return (
    <div style={AdminStyle.grid}>
      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.createGlobalQuestion}</h3>
        <div style={AdminStyle.sectionSub}>
          {STRINGS.ADMIN.text.createGlobalQuestionSubtitle}
        </div>

        <div style={AdminStyle.field}>
          <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.question}</span>
          <textarea
            style={AdminStyle.textarea}
            value={questionForm.question_text}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, question_text: e.target.value }))
            }
            placeholder={STRINGS.ADMIN.text.questionPlaceholder}
            disabled={busy}
          />
        </div>

        <div style={AdminQuestionBankTabStyle.rowMt10}>
          <span style={AdminQuestionBankTabStyle.labelMr6}>
            {STRINGS.ADMIN.labels.difficultyRating}
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={Number(questionForm.difficulty_rating) || 5}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, difficulty_rating: Number(e.target.value) }))
            }
            disabled={busy}
            style={AdminQuestionBankTabStyle.range}
            aria-label={STRINGS.ADMIN.aria.difficultyRating}
          />
          <input
            style={AdminQuestionBankTabStyle.inputW90}
            type="number"
            min={1}
            max={10}
            value={Number(questionForm.difficulty_rating) || 5}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, difficulty_rating: Number(e.target.value) }))
            }
            disabled={busy}
          />
        </div>

        <div style={AdminQuestionBankTabStyle.optionsWrap}>
          {(questionForm.options || []).map((opt, idx) => (
            <div key={idx} style={AdminStyle.row}>
              <input
                type="radio"
                name="correct"
                checked={Number(questionForm.correctIndex) === idx}
                onChange={() => setQuestionForm((v) => ({ ...v, correctIndex: idx }))}
                disabled={busy}
              />
              <input
                style={AdminQuestionBankTabStyle.inputFlex1}
                value={opt}
                onChange={(e) =>
                  setQuestionForm((v) => {
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
                onClick={() =>
                  setQuestionForm((v) => ({
                    ...v,
                    options: (v.options || []).filter((_, i) => i !== idx),
                    correctIndex:
                      Number(v.correctIndex) === idx ? 0 : Number(v.correctIndex),
                  }))
                }
                disabled={busy || (questionForm.options || []).length <= 2}
                title={STRINGS.ADMIN.hints.removeOptionTitle}
              >
                {STRINGS.ADMIN.actions.remove}
              </button>
            </div>
          ))}
        </div>

        <div style={AdminQuestionBankTabStyle.rowMt10}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              setQuestionForm((v) => ({
                ...v,
                options: [...v.options, STRINGS.ADMIN.placeholders.newOption],
              }))
            }
            disabled={busy || (questionForm.options || []).length >= 6}
          >
            {STRINGS.ADMIN.actions.addOption}
          </button>
        </div>

        <label style={AdminQuestionBankTabStyle.toggleLabel}>
          <input
            type="checkbox"
            checked={!!questionForm.showAdvanced}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, showAdvanced: e.target.checked }))
            }
            disabled={busy}
            style={AdminQuestionBankTabStyle.checkboxMr8}
          />
          Show advanced settings (explanation, time, points)
        </label>

        {questionForm.showAdvanced && (
          <>
            <div style={AdminQuestionBankTabStyle.rowMt12}>
              <div style={AdminQuestionBankTabStyle.advancedTitle}>
                Assign to modes (optional)
              </div>
            </div>
            <div style={AdminQuestionBankTabStyle.rowMt8}>
              {['classic', 'blitz', 'millionaire'].map((m) => (
                <label key={m} style={AdminQuestionBankTabStyle.modePillLabel}>
                  <input
                    type="checkbox"
                    checked={!!questionForm.modes?.[m]}
                    onChange={(e) =>
                      setQuestionForm((v) => ({
                        ...v,
                        modes: { ...(v.modes || {}), [m]: e.target.checked },
                      }))
                    }
                    disabled={busy}
                    style={AdminQuestionBankTabStyle.checkboxMr8}
                  />
                  {m}
                </label>
              ))}
            </div>

            <div style={AdminStyle.field}>
              <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.explanation}</span>
              <textarea
                style={AdminQuestionBankTabStyle.textareaMin70}
                value={questionForm.explanation}
                onChange={(e) =>
                  setQuestionForm((v) => ({ ...v, explanation: e.target.value }))
                }
                placeholder={STRINGS.ADMIN.text.explanationPlaceholder}
                disabled={busy}
              />
            </div>

            <div style={AdminQuestionBankTabStyle.rowMt10}>
              <label style={AdminQuestionBankTabStyle.fieldFlex1NoMt}>
                <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.timeLimitSec}</span>
                <input
                  style={AdminStyle.input}
                  type="number"
                  min={3}
                  max={600}
                  value={questionForm.time_limit_sec}
                  onChange={(e) =>
                    setQuestionForm((v) => ({
                      ...v,
                      time_limit_sec: e.target.value,
                    }))
                  }
                  disabled={busy}
                />
              </label>
              <label style={AdminQuestionBankTabStyle.fieldFlex1NoMt}>
                <span style={AdminStyle.label}>{STRINGS.ADMIN.labels.points}</span>
                <input
                  style={AdminStyle.input}
                  type="number"
                  min={0}
                  value={questionForm.points}
                  onChange={(e) =>
                    setQuestionForm((v) => ({ ...v, points: e.target.value }))
                  }
                  disabled={busy}
                />
              </label>
            </div>
          </>
        )}

        <div style={AdminQuestionBankTabStyle.rowMt14}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btnPrimaryFull}
            onClick={onCreateQuestion}
            disabled={busy || !String(questionForm.question_text || '').trim()}
          >
            {STRINGS.ADMIN.text.createQuestionButton}
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.sections.quickFlow}</h3>
        <div style={AdminStyle.sectionSub}>
          <ol style={AdminQuestionBankTabStyle.quickFlowList}>
            <li>{STRINGS.ADMIN.quickFlowSteps.create}</li>
            <li>{STRINGS.ADMIN.quickFlowSteps.modes}</li>
            <li>{STRINGS.ADMIN.quickFlowSteps.story}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
