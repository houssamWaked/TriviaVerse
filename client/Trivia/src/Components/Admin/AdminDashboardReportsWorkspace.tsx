import React from 'react';
import AdminStyle from '../../Styles/ComponentStyles/AdminStyle';
import AdminDashboardStyle from '../../Styles/ComponentStyles/AdminDashboardStyle';
import { STRINGS } from '@/constants/strings';

/**
 * Admin "Reports" workspace: triage/resolve quiz reports and perform moderation actions.
 */
export default function AdminDashboardReportsWorkspace({
  busy,
  reportsStatus,
  reports,
  reportsOffset,
  reportsLimit,
  onLoadReports,
  onResolveReport,
  onDeleteReportedQuiz,
  onBanReportedOwner,
}) {
  return (
    <div style={AdminStyle.grid}>
      <div style={AdminStyle.section}>
        <h3 style={AdminStyle.sectionTitle}>{STRINGS.ADMIN.reports.title}</h3>
        <div style={AdminStyle.sectionSub}>{STRINGS.ADMIN.reports.subtitle}</div>

        <div style={AdminDashboardStyle.rowMt12}>
          <label style={AdminDashboardStyle.fieldFlex1NoMt}>
            <span style={AdminStyle.label}>{STRINGS.ADMIN.reports.labels.status}</span>
            <select
              style={AdminStyle.select}
              value={reportsStatus}
              onChange={async (e) => {
                const next = String(e.target.value || 'open').trim();
                await onLoadReports({ status: next, offset: 0 });
              }}
              disabled={busy}
            >
              <option value="open">{STRINGS.ADMIN.reports.status.open}</option>
              <option value="resolved">{STRINGS.ADMIN.reports.status.resolved}</option>
            </select>
          </label>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() => onLoadReports({ status: reportsStatus, offset: 0 })}
            disabled={busy}
            title={STRINGS.ADMIN.actions.refreshList}
          >
            {STRINGS.ADMIN.actions.refreshList}
          </button>

          <span style={AdminStyle.pill}>{STRINGS.ADMIN.pills.offset} {reportsOffset}</span>
        </div>

        <div style={AdminDashboardStyle.listMt12}>
          {reports.length === 0 ? (
            <div style={AdminDashboardStyle.emptyText}>{STRINGS.ADMIN.reports.empty}</div>
          ) : (
            reports.map((report) => {
              const quizId = report?.quiz?.id || report?.quiz_id || '';
              const quizTitle = report?.quiz?.title || STRINGS.ADMIN.reports.fallbackQuizTitle;
              const ownerId = report?.owner?.id || report?.quiz?.owner_user_id || '';
              const reporterName =
                report?.reporter?.username ||
                report?.reporter?.email ||
                STRINGS.COMMON.separators.emDash;
              const ownerName =
                report?.owner?.username || report?.owner?.email || STRINGS.COMMON.separators.emDash;
              const createdAt = report?.created_at
                ? new Date(report.created_at).toLocaleString()
                : '';

              return (
                <div key={report.id} style={AdminStyle.listItem}>
                  <div style={AdminStyle.listItemTitle}>
                    {quizTitle} ({quizId})
                  </div>

                  <div style={AdminStyle.listItemMeta}>
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.reports.meta.reason}: {report.reason || 'other'}
                    </span>
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.reports.meta.reporter}: {reporterName}
                    </span>
                    <span style={AdminStyle.pill}>
                      {STRINGS.ADMIN.reports.meta.owner}: {ownerName}
                    </span>
                    {createdAt ? (
                      <span style={AdminStyle.pill}>
                        {STRINGS.ADMIN.reports.meta.createdAt}: {createdAt}
                      </span>
                    ) : null}
                  </div>

                  {report?.message ? <div style={AdminStyle.smallHelp}>{report.message}</div> : null}

                  <div style={AdminDashboardStyle.rowMt12}>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btnPrimaryFull}
                      disabled={busy || report?.status === 'resolved'}
                      onClick={() => onResolveReport(report.id)}
                    >
                      {STRINGS.ADMIN.reports.actions.resolve}
                    </button>

                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btnDanger}
                      disabled={busy || !quizId}
                      onClick={() => onDeleteReportedQuiz(quizId, quizTitle)}
                    >
                      {STRINGS.ADMIN.reports.actions.deleteQuiz}
                    </button>

                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={AdminStyle.btn}
                      disabled={busy || !ownerId}
                      onClick={() => onBanReportedOwner({ ownerId, ownerName, reason: report.reason })}
                    >
                      {STRINGS.ADMIN.reports.actions.banUser}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={AdminDashboardStyle.rowMt14}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              onLoadReports({
                status: reportsStatus,
                offset: Math.max(0, reportsOffset - reportsLimit),
              })
            }
            disabled={busy || reportsOffset <= 0}
          >
            {STRINGS.ADMIN.actions.prev}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={AdminStyle.btn}
            onClick={() =>
              onLoadReports({
                status: reportsStatus,
                offset: reportsOffset + reportsLimit,
              })
            }
            disabled={busy || reports.length < reportsLimit}
          >
            {STRINGS.ADMIN.actions.next}
          </button>
          <span style={AdminStyle.pill}>{STRINGS.ADMIN.pills.showingBare} {reports.length}</span>
        </div>
      </div>
    </div>
  );
}

