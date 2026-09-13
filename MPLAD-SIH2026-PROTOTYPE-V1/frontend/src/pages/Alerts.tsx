import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/formatting';
import { Alert, AlertStatus } from '../types/alert';
import {
  Bell,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw,
  Check,
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const {
    alerts,
    works,
    updateAlertStatus,
    resolveAlert,
    openCreateAlertModal,
    showToast,
  } = useApp();

  // Active filters
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Counts
  const counts = useMemo(() => {
    return {
      total: alerts.length,
      open: alerts.filter((a) => a.status === 'Open').length,
      inReview: alerts.filter((a) => a.status === 'In Review').length,
      resolved: alerts.filter((a) => a.status === 'Resolved').length,
    };
  }, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, priorityFilter]);

  // Helper to get 1-line reason from alert
  const getOneLineReason = (alert: Alert) => {
    if (alert.reviewNote) return alert.reviewNote;
    const work = works.find((w) => w.workId.toLowerCase() === alert.workId.toLowerCase());
    if (work) {
      const gap = Math.max(0, work.financialProgress - work.physicalProgress);
      if (gap > 15) {
        return `Expenditure of ${work.financialProgress}% is ${gap}% ahead of verified site progress (${work.physicalProgress}%).`;
      }
      if (work.delayDays > 60) {
        return `Execution delayed by ${work.delayDays} days beyond scheduled milestone date.`;
      }
      return `Flagged for review due to risk score ${work.riskScore}/100 and regional cost variance.`;
    }
    return 'Automated signal triggered by monitoring rules requiring verification.';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title="Review Alerts"
        subtitle="Active risk alerts requiring verification or corrective follow-up."
      />

      <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* TOP METRIC CARDS & CREATE BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quick status tabs */}
          <div className="grid grid-cols-3 gap-2.5 flex-1 max-w-md">
            {/* Open */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Open' ? 'ALL' : 'Open')}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                statusFilter === 'Open'
                  ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                <span className="font-semibold uppercase text-rose-800">Open</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">{counts.open}</div>
            </button>

            {/* In Review */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'In Review' ? 'ALL' : 'In Review')}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                statusFilter === 'In Review'
                  ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                <span className="font-semibold uppercase text-amber-800">In Review</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">{counts.inReview}</div>
            </button>

            {/* Resolved */}
            <button
              onClick={() => setStatusFilter(statusFilter === 'Resolved' ? 'ALL' : 'Resolved')}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                statusFilter === 'Resolved'
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                <span className="font-semibold uppercase text-emerald-800">Resolved</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">{counts.resolved}</div>
            </button>
          </div>

          <button
            onClick={() => openCreateAlertModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition shrink-0 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>Create Review Alert</span>
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Priority:</span>
            </div>
            <div className="flex items-center gap-1">
              {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                    priorityFilter === p
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* CLEAN ALERT CARDS (REQUIREMENT 11: Title, Work ID linked, Severity badge, 1-line reason, "View Work" button) */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No review alerts found matching current filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const reason = getOneLineReason(alert);
              const isResolved = alert.status === 'Resolved';

              return (
                <div
                  key={alert.alertId}
                  className={`bg-white rounded-lg border p-4 shadow-xs transition hover:shadow-sm ${
                    isResolved ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Top Row: Title, Severity badge, Status */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {alert.alertType}
                        </h3>

                        <Badge
                          variant={
                            alert.priority === 'Critical'
                              ? 'critical'
                              : alert.priority === 'High'
                              ? 'high'
                              : alert.priority === 'Medium'
                              ? 'medium'
                              : 'low'
                          }
                          size="sm"
                        >
                          {alert.priority}
                        </Badge>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.2 rounded font-semibold border ${
                            alert.status === 'Open'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : alert.status === 'In Review'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {alert.status}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          • {formatDate(alert.created)}
                        </span>
                      </div>

                      {/* Work ID (linked) */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Work Record:</span>
                        <button
                          onClick={() => navigate(`/work/${alert.workId}`)}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                        >
                          <span>{alert.workId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 text-[11px]">
                          Assigned to: <strong>{alert.assignedTo}</strong>
                        </span>
                      </div>

                      {/* 1-Line Reason */}
                      <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                        <strong className="text-slate-900">Reason:</strong> {reason}
                      </p>
                    </div>

                    {/* Action Button: "View Work" */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isResolved && (
                        <button
                          onClick={() => {
                            resolveAlert(alert.alertId, 'Verified and resolved via alerts dashboard.');
                            showToast(`Alert ${alert.alertId} marked resolved.`, 'success');
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/work/${alert.workId}`)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Work</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
