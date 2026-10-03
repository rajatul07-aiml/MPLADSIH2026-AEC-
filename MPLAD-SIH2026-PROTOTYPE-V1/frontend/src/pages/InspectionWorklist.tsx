import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { formatLakhs } from '../utils/formatting';
import { ActionStatus } from '../types/workflow';
import {
  ClipboardCheck,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Search,
  User,
} from 'lucide-react';

const OFFICERS_LIST = [
  'All Officers',
  'Inspector A. Sharma',
  'Inspector B. Singh',
  'Inspector C. Verma',
  'Inspector D. Patel',
];

export const InspectionWorklist: React.FC = () => {
  const navigate = useNavigate();
  const { allWorks, role, selectedOfficer, setSelectedOfficer } = useApp();

  const isInspectorRole = role === 'INSPECTION OFFICER';

  const [officerFilter, setOfficerFilter] = useState<string>(() => {
    if (isInspectorRole) return selectedOfficer || 'Inspector A. Sharma';
    return 'All Officers';
  });

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep officerFilter in sync if role or selectedOfficer changes
  useEffect(() => {
    if (isInspectorRole) {
      setOfficerFilter(selectedOfficer || 'Inspector A. Sharma');
    }
  }, [isInspectorRole, selectedOfficer]);

  // Base works relevant to inspection
  // If in INSPECTION OFFICER role: STRICTLY show works assigned to this officer!
  const baseWorks = useMemo(() => {
    if (isInspectorRole) {
      const activeOfficer = selectedOfficer || 'Inspector A. Sharma';
      return allWorks.filter((w) => {
        const assigned = w.inspectionReport?.inspectionOfficer || (w as any).inspectionOfficer;
        // Strictly matched to the logged-in inspector
        return assigned === activeOfficer;
      });
    }

    // For District Authority / Ministry: show works across the pipeline
    return allWorks.filter((w) => {
      const hasStatus = w.actionStatus && w.actionStatus !== 'NO_ACTION';
      const hasReport = !!w.inspectionReport;
      return hasStatus || hasReport;
    });
  }, [allWorks, isInspectorRole, selectedOfficer]);

  // Summary counts scoped to the current view
  const counts = useMemo(() => {
    return {
      total: baseWorks.length,
      assigned: baseWorks.filter((w) => w.actionStatus === 'OFFICER_ASSIGNED').length,
      inProgress: baseWorks.filter((w) => w.actionStatus === 'INSPECTION_IN_PROGRESS').length,
      submitted: baseWorks.filter((w) => w.actionStatus === 'REPORT_SUBMITTED' || w.actionStatus === 'AUTHORITY_REVIEW').length,
      resolved: baseWorks.filter((w) => w.actionStatus === 'RESOLVED' || w.actionStatus === 'ESCALATED').length,
      requested: baseWorks.filter((w) => w.actionStatus === 'INSPECTION_REQUESTED').length,
    };
  }, [baseWorks]);

  // Apply search and status filters
  const filteredWorks = useMemo(() => {
    return baseWorks.filter((w) => {
      // If not in inspector role and specific officer selected in dropdown
      if (!isInspectorRole && officerFilter !== 'All Officers') {
        const assigned = w.inspectionReport?.inspectionOfficer || (w as any).inspectionOfficer;
        if (assigned !== officerFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OFFICER_ASSIGNED' && w.actionStatus !== 'OFFICER_ASSIGNED') return false;
        if (statusFilter === 'INSPECTION_IN_PROGRESS' && w.actionStatus !== 'INSPECTION_IN_PROGRESS') return false;
        if (statusFilter === 'REPORT_SUBMITTED' && w.actionStatus !== 'REPORT_SUBMITTED' && w.actionStatus !== 'AUTHORITY_REVIEW') return false;
        if (statusFilter === 'RESOLVED' && w.actionStatus !== 'RESOLVED' && w.actionStatus !== 'ESCALATED') return false;
        if (statusFilter === 'INSPECTION_REQUESTED' && w.actionStatus !== 'INSPECTION_REQUESTED') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = w.workId.toLowerCase().includes(q);
        const matchesDesc = (w.description || '').toLowerCase().includes(q);
        const matchesSector = (w.sector || '').toLowerCase().includes(q);
        const matchesDistrict = (w.district || '').toLowerCase().includes(q);
        if (!matchesId && !matchesDesc && !matchesSector && !matchesDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [baseWorks, isInspectorRole, officerFilter, statusFilter, searchQuery]);

  const getStatusBadge = (status?: ActionStatus) => {
    switch (status) {
      case 'INSPECTION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            Inspection Requested
          </span>
        );
      case 'OFFICER_ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-300">
            <UserCheck className="w-3 h-3 text-blue-700" />
            Officer Assigned
          </span>
        );
      case 'INSPECTION_IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">
            <ClipboardCheck className="w-3 h-3 text-purple-700" />
            In Progress
          </span>
        );
      case 'REPORT_SUBMITTED':
      case 'AUTHORITY_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <FileText className="w-3 h-3 text-emerald-700" />
            Report Submitted
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-600" />
            Resolved
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-700" />
            Escalated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Monitoring
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title={isInspectorRole ? `My Assigned Inspections` : `Field Inspection Pipeline`}
        subtitle={
          isInspectorRole
            ? `Works specifically assigned to ${selectedOfficer || 'Inspector A. Sharma'} for field verification.`
            : `Physical inspection tracking across executing agencies and designated officers.`
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* OFFICER CONTEXT BANNER IF IN INSPECTOR ROLE */}
        {isInspectorRole && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                AS
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedOfficer || 'Inspector A. Sharma'}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                    Inspection Officer
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Assigned {counts.total} total works for on-site verification and physical milestone audit.
                </div>
              </div>
            </div>
            <div className="text-xs text-indigo-900 font-medium bg-white px-3 py-1.5 rounded border border-indigo-200 self-start sm:self-auto">
              Active Assigned Works: <strong>{counts.assigned + counts.inProgress}</strong>
            </div>
          </div>
        )}

        {/* USEFUL SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* ASSIGNED */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'OFFICER_ASSIGNED' ? 'ALL' : 'OFFICER_ASSIGNED')}
            className={`bg-white p-3.5 rounded-lg border text-left transition shadow-xs ${
              statusFilter === 'OFFICER_ASSIGNED'
                ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-blue-800 uppercase tracking-wider text-[10px]">ASSIGNED</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {counts.assigned}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting site visit</div>
          </button>

          {/* INSPECTION IN PROGRESS */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'INSPECTION_IN_PROGRESS' ? 'ALL' : 'INSPECTION_IN_PROGRESS')}
            className={`bg-white p-3.5 rounded-lg border text-left transition shadow-xs ${
              statusFilter === 'INSPECTION_IN_PROGRESS'
                ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-purple-800 uppercase tracking-wider text-[10px]">IN PROGRESS</span>
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {counts.inProgress}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">On-site audit underway</div>
          </button>

          {/* REPORT SUBMITTED */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'REPORT_SUBMITTED' ? 'ALL' : 'REPORT_SUBMITTED')}
            className={`bg-white p-3.5 rounded-lg border text-left transition shadow-xs ${
              statusFilter === 'REPORT_SUBMITTED'
                ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">REPORT SUBMITTED</span>
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {counts.submitted}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting authority review</div>
          </button>

          {/* RESOLVED / ESCALATED */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
            className={`bg-white p-3.5 rounded-lg border text-left transition shadow-xs ${
              statusFilter === 'RESOLVED'
                ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">RESOLVED</span>
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {counts.resolved}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cases verified & closed</div>
          </button>
        </div>

        {/* CONTROLS & SEARCH */}
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* If NOT inspector role, allow selecting officer */}
            {!isInspectorRole ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Officer:</span>
                <select
                  value={officerFilter}
                  onChange={(e) => setOfficerFilter(e.target.value)}
                  className="h-8 px-2.5 border border-slate-300 rounded bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {OFFICERS_LIST.map((off) => (
                    <option key={off} value={off}>
                      {off}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Officer Scope: <strong>{selectedOfficer || 'Inspector A. Sharma'}</strong></span>
              </div>
            )}

            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="text-xs text-indigo-600 hover:underline font-medium ml-2"
              >
                Clear filter ({statusFilter.replace(/_/g, ' ')})
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by work ID, description..."
              className="w-full h-8 pl-8 pr-3 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* WORKLIST TABLE */}
        {filteredWorks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">
              {isInspectorRole
                ? `No Works Assigned to ${selectedOfficer || 'Inspector A. Sharma'}`
                : `No Inspection Records Found`}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isInspectorRole
                ? `There are currently no active field inspections assigned to this officer matching your filters. When the District Authority assigns inspections, they will appear here.`
                : `No works matching the selected criteria. Try adjusting the officer or status filters.`}
            </p>
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 transition"
              >
                Show All Works
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Work ID & Description</th>
                    <th className="py-3 px-4">Location & Sector</th>
                    <th className="py-3 px-4">Physical vs Fin</th>
                    <th className="py-3 px-4">Inspection Status</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorks.map((work) => {
                    const isActionable =
                      work.actionStatus === 'OFFICER_ASSIGNED' ||
                      work.actionStatus === 'INSPECTION_IN_PROGRESS';

                    return (
                      <tr key={work.workId} className="hover:bg-slate-50/80 transition">
                        {/* Work ID & Description */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <button
                            onClick={() => navigate(`/work/${work.workId}`)}
                            className="font-mono font-bold text-slate-900 hover:text-indigo-600 hover:underline block text-left"
                          >
                            {work.workId}
                          </button>
                          <div className="text-slate-600 font-medium line-clamp-1 mt-0.5">
                            {work.description}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Sanctioned: {formatLakhs(work.sanctionedAmount)}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{work.sector}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{work.block}, {work.district}</span>
                          </div>
                        </td>

                        {/* Physical vs Fin Progress */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <div>
                            <span>Phys: <strong className="text-slate-900">{work.physicalProgress}%</strong></span>
                            <span className="text-slate-300 mx-1.5">•</span>
                            <span>Fin: <strong className="text-slate-900">{work.financialProgress}%</strong></span>
                          </div>
                          {(work.financialProgress - work.physicalProgress) > 15 && (
                            <div className="text-[10px] font-sans font-semibold text-rose-600 mt-0.5">
                              +{work.financialProgress - work.physicalProgress}% Variance
                            </div>
                          )}
                        </td>

                        {/* Inspection Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(work.actionStatus)}
                        </td>

                        {/* Risk Level */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={
                              work.riskLevel === 'CRITICAL'
                                ? 'critical'
                                : work.riskLevel === 'HIGH'
                                ? 'high'
                                : work.riskLevel === 'MEDIUM'
                                ? 'medium'
                                : 'low'
                            }
                            size="sm"
                          >
                            {work.riskScore} • {work.riskLevel}
                          </Badge>
                        </td>

                        {/* Action Buttons: "Conduct Inspection" or "View Work" */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isActionable ? (
                            <button
                              onClick={() => navigate(`/work/${work.workId}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Conduct Inspection</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/work/${work.workId}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                            >
                              <span>View Work</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
