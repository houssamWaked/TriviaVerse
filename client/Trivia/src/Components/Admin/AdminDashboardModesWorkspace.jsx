import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import { STRINGS } from '@/constants/strings';

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export default function AdminDashboardModesWorkspace({
  busy,
  modes,
  modeCounts,
  modeSeedCount,
  setModeSeedCount,
  onLoadPool,
  onOpenPicker,
  onOpenClassicCategories,
  onSeedModePool,
  onClearModePool,
}) {
  return (
    <div style={AdminStyle.grid}>
      {modes.map((mode) => (
        <div key={mode.key} style={AdminStyle.section}>
          <div style={AdminDashboardStyle.modeHeader}>
            <div>
              <h3 style={AdminStyle.sectionTitle}>{mode.title}</h3>
              <div style={AdminStyle.sectionSub}>{mode.desc}</div>
            </div>
            <span style={AdminStyle.pill}>{modeCounts[mode.key] ?? '-'}</span>
          </div>

          <div style={AdminDashboardStyle.rowMt12}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() =>
                onLoadPool({
                  kind: 'mode',
                  id: mode.key,
                  title: STRINGS.ADMIN.format.modePoolTitle(mode.title),
                  offset: 0,
                })
              }
              disabled={busy}
            >
              {STRINGS.ADMIN.actions.viewPool}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btnPrimaryFull}
              onClick={() =>
                onOpenPicker({
                  kind: 'mode',
                  id: mode.key,
                  title: STRINGS.ADMIN.format.modePoolTitle(mode.title),
                })
              }
              disabled={busy}
            >
              {STRINGS.ADMIN.actions.addQuestions}
            </button>
            {mode.key === 'classic' && (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={AdminStyle.btn}
                onClick={onOpenClassicCategories}
                disabled={busy}
              >
                {STRINGS.ADMIN.actions.categories}
              </button>
            )}
          </div>

          <div style={AdminDashboardStyle.rowMt10}>
            <input
              style={AdminDashboardStyle.inputW110}
              type="number"
              min={1}
              max={100}
              value={modeSeedCount[mode.key] ?? 25}
              onChange={(e) =>
                setModeSeedCount((v) => ({
                  ...v,
                  [mode.key]: clampInt(e.target.value, 1, 100),
                }))
              }
              disabled={busy}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={AdminStyle.btn}
              onClick={() => onSeedModePool(mode.key)}
              disabled={busy}
              title={STRINGS.ADMIN.hints.seedModePoolTitle}
            >
              {STRINGS.ADMIN.actions.autoFillRandom}
            </button>
            <span style={AdminStyle.pill}>{STRINGS.ADMIN.pills.addsOnly}</span>
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
                disabled={busy}
                onClick={() => onClearModePool(mode.key, mode.title)}
              >
                {STRINGS.ADMIN.actions.clearPool}
              </button>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
