import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';

export default function AdminQuestionBankTab({
  busy,
  questionForm,
  setQuestionForm,
  onCreateQuestion,
}) {
  return (
    <div style={AdminStyle.grid}>
      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Create global question</h3>
        <div style={AdminStyle.sectionSub}>
          Pick the correct option (radio), choose modes, then create.
        </div>

        <div style={AdminStyle.field}>
          <span style={AdminStyle.label}>Question</span>
          <textarea
            style={AdminStyle.textarea}
            value={questionForm.question_text}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, question_text: e.target.value }))
            }
            placeholder="What is the capital of France?"
            disabled={busy}
          />
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <span style={{ ...AdminStyle.label, marginRight: 6 }}>Difficulty (1-10)</span>
          <input
            type="range"
            min={1}
            max={10}
            value={Number(questionForm.difficulty_rating) || 5}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, difficulty_rating: Number(e.target.value) }))
            }
            disabled={busy}
            style={{ flex: 1, minWidth: 180 }}
            aria-label="Difficulty rating"
          />
          <input
            style={{ ...AdminStyle.input, width: 90 }}
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

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                style={{ ...AdminStyle.input, flex: 1 }}
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
                title="Remove option"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div style={{ ...AdminStyle.row, marginTop: 10 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              setQuestionForm((v) => ({ ...v, options: [...v.options, 'New option'] }))
            }
            disabled={busy || (questionForm.options || []).length >= 6}
          >
            + Add option
          </button>
        </div>

        <label style={{ ...AdminStyle.smallHelp, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!questionForm.showAdvanced}
            onChange={(e) =>
              setQuestionForm((v) => ({ ...v, showAdvanced: e.target.checked }))
            }
            disabled={busy}
            style={{ marginRight: 8 }}
          />
          Show advanced settings (explanation, time, points)
        </label>

        {questionForm.showAdvanced && (
          <>
            <div style={{ ...AdminStyle.row, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 950, color: '#222' }}>
                Assign to modes (optional)
              </div>
            </div>
            <div style={{ ...AdminStyle.row, marginTop: 8 }}>
              {['classic', 'blitz', 'millionaire'].map((m) => (
                <label key={m} style={{ ...AdminStyle.pill, cursor: 'pointer' }}>
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
                    style={{ marginRight: 8 }}
                  />
                  {m}
                </label>
              ))}
            </div>

            <div style={AdminStyle.field}>
              <span style={AdminStyle.label}>Explanation</span>
              <textarea
                style={{ ...AdminStyle.textarea, minHeight: 70 }}
                value={questionForm.explanation}
                onChange={(e) =>
                  setQuestionForm((v) => ({ ...v, explanation: e.target.value }))
                }
                placeholder="Optional..."
                disabled={busy}
              />
            </div>

            <div style={{ ...AdminStyle.row, marginTop: 10 }}>
              <label style={{ ...AdminStyle.field, flex: 1, marginTop: 0 }}>
                <span style={AdminStyle.label}>Time limit (sec)</span>
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
              <label style={{ ...AdminStyle.field, flex: 1, marginTop: 0 }}>
                <span style={AdminStyle.label}>Points</span>
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

        <div style={{ ...AdminStyle.row, marginTop: 14 }}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...AdminStyle.btn, ...AdminStyle.btnPrimary }}
            onClick={onCreateQuestion}
            disabled={busy || !String(questionForm.question_text || '').trim()}
          >
            Create question
          </button>
        </div>
      </div>

      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>Quick flow</h3>
        <div style={AdminStyle.sectionSub}>
          <ol style={{ marginTop: 10, marginBottom: 0, paddingLeft: 18 }}>
            <li>Create questions here.</li>
            <li>Assign them to mode pools in "Mode Pools".</li>
            <li>Assign them to story levels in "Story".</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
