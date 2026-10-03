import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { RiskBadge, Badge } from '../components/ui/Badge';
import { formatLakhs } from '../utils/formatting';
import { aggregateInspectionTrends } from '../utils/trendAggregation';
import { worksService } from '../services/worksService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RiskLevel } from '../types/work';
import {
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Filter,
  RotateCcw,
  Clock,
  Building2,
  Landmark,
  MapPin,
  Award,
  User,
  Check,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  Plus,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    works,
    isLoadingData,
    apiError,
    showToast,
    role,
    selectedState,
    selectedDistrict,
    selectedConstituency,
    selectedOfficer,
  } = useApp();

  // Filters state
  const [financialYear, setFinancialYear] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [riskLevelFilter, setRiskLevelFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [onlyDelayed, setOnlyDelayed] = useState<boolean>(false);

  // Filter options derived from dataset
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFilters() {
      const [years, states, sectors] = await Promise.all([
        worksService.getAvailableFinancialYears(),
        worksService.getAvailableStates(),
        worksService.getAvailableSectors()
      ]);
      setAvailableYears(years || []);
      setAvailableStates(states || []);
      setAvailableSectors(sectors || []);
    }
    fetchFilters();
  }, []);

  // Filtered dataset
  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      if (financialYear !== 'ALL' && work.financialYear !== financialYear) return false;
      if (stateFilter !== 'ALL' && work.state !== stateFilter) return false;
      if (sectorFilter !== 'ALL' && work.sector !== sectorFilter) return false;
      if (riskLevelFilter !== 'ALL' && work.riskLevel !== riskLevelFilter) return false;
      if (onlyDelayed && (work.delayDays <= 0 && (!work.predictedDelayDays || work.predictedDelayDays <= 0))) {
        return false;
      }
      return true;
    });
  }, [works, financialYear, stateFilter, sectorFilter, riskLevelFilter, onlyDelayed]);

  // 5 HIGH-LEVEL METRICS MATCHING REQUIREMENT 9:
  // - Total Works
  // - High / Critical Works
  // - Delayed Works
  // - Pending Inspections
  // - Resolved Works
  const kpis = useMemo(() => {
    const totalCount = filteredWorks.length;
    const highCriticalCount = filteredWorks.filter(
      (w) => w.riskLevel === 'HIGH' || w.riskLevel === 'CRITICAL'
    ).length;
    const delayedCount = filteredWorks.filter(
      (w) => (w.delayDays > 0 || (w.predictedDelayDays || 0) > 0) && w.status !== 'COMPLETED'
    ).length;
    const pendingInspectionsCount = filteredWorks.filter(
      (w) =>
        w.actionStatus === 'INSPECTION_REQUESTED' ||
        w.actionStatus === 'OFFICER_ASSIGNED' ||
        w.actionStatus === 'INSPECTION_IN_PROGRESS' ||
        w.actionStatus === 'REPORT_SUBMITTED' ||
        w.actionStatus === 'AUTHORITY_REVIEW'
    ).length;
    const resolvedCount = filteredWorks.filter(
      (w) => w.actionStatus === 'RESOLVED' || w.actionStatus === 'ESCALATED'
    ).length;

    return {
      totalCount,
      highCriticalCount,
      delayedCount,
      pendingInspectionsCount,
      resolvedCount,
    };
  }, [filteredWorks]);

  // Risk distribution breakdown
  const riskDistribution = useMemo(() => {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    filteredWorks.forEach((w) => {
      counts[w.riskLevel] = (counts[w.riskLevel] || 0) + 1;
    });
    return counts;
  }, [filteredWorks]);

  // Works requiring immediate attention (top 5 prioritized by riskScore descending)
  const prioritizedWorks = useMemo(() => {
    return [...filteredWorks]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  }, [filteredWorks]);

  // Reset filters action
  const handleResetFilters = () => {
    setFinancialYear('ALL');
    setStateFilter('ALL');
    setSectorFilter('ALL');
    setRiskLevelFilter('ALL');
    setOnlyDelayed(false);
    showToast('Filters reset.', 'info');
  };

  // Quarterly monitoring trend data
  const trendData = useMemo(() => {
    return aggregateInspectionTrends(filteredWorks);
  }, [filteredWorks]);

  const hasActiveFilters =
    financialYear !== 'ALL' ||
    stateFilter !== 'ALL' ||
    sectorFilter !== 'ALL' ||
    riskLevelFilter !== 'ALL' ||
    onlyDelayed;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title="Monitoring Dashboard"
        subtitle="AI-assisted anomaly detection, early warning and decision support for MPLADS implementation."
      />

      <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* STAKEHOLDER SCOPE BANNER */}
        <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-md bg-slate-800 border border-slate-700 text-amber-400 shrink-0">
              {role === 'MINISTRY' && <Landmark className="w-5 h-5" />}
              {role === 'STATE AUTHORITY' && <Building2 className="w-5 h-5" />}
              {role === 'DISTRICT AUTHORITY' && <MapPin className="w-5 h-5" />}
              {role === 'MP' && <Award className="w-5 h-5" />}
              {role === 'INSPECTION OFFICER' && <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {role === 'MINISTRY' && 'Ministry National Perspective'}
                  {role === 'STATE AUTHORITY' && `State Nodal Authority: ${selectedState}`}
                  {role === 'DISTRICT AUTHORITY' && `District Authority: ${selectedDistrict}`}
                  {role === 'MP' && `Hon'ble MP Constituency View: ${selectedConstituency}`}
                  {role === 'INSPECTION OFFICER' && `Assigned Inspection Cases: ${selectedOfficer}`}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  SIH26102
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-1">
                {role === 'MINISTRY' &&
                  'National aggregation across all states, expenditure velocities, and systemic anomaly patterns.'}
                {role === 'STATE AUTHORITY' &&
                  `Monitoring district implementation cells across ${selectedState}, fund flows, and state compliance benchmarks.`}
                {role === 'DISTRICT AUTHORITY' &&
                  `Direct oversight of executing agencies, site inspections, and physical milestone verifications in ${selectedDistrict}.`}
                {role === 'MP' &&
                  `Constituency development tracker, citizen asset creation status, and sanction-to-delivery lifecycle.`}
                {role === 'INSPECTION OFFICER' &&
                  `On-site physical inspection and verification worklist for ${selectedOfficer}.`}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 self-end md:self-center">
            <button
              onClick={() => navigate('/data-management/new')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-xs rounded-md font-medium text-white transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Work</span>
            </button>
            <button
              onClick={() => navigate('/risk-monitor')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-md font-medium text-slate-200 transition flex items-center gap-1.5 shrink-0"
            >
              <span>Risk Monitor ({filteredWorks.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TOP FILTER BAR */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters</span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Showing {filteredWorks.length} of {works.length} works
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Financial Year */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px]">FY:</span>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="h-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2 text-slate-700 text-xs transition focus:outline-none"
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* State (if in ministry view) */}
              {role === 'MINISTRY' && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 text-[11px]">State:</span>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="h-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2 text-slate-700 text-xs transition max-w-[140px] focus:outline-none"
                  >
                    <option value="ALL">All States</option>
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px]">Sector:</span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="h-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2 text-slate-700 text-xs transition max-w-[140px] focus:outline-none"
                >
                  <option value="ALL">All Sectors</option>
                  {availableSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Level */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px]">Risk:</span>
                <select
                  value={riskLevelFilter}
                  onChange={(e) => setRiskLevelFilter(e.target.value as RiskLevel | 'ALL')}
                  className="h-8 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2 text-slate-700 text-xs transition focus:outline-none"
                >
                  <option value="ALL">All Levels</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="h-8 flex items-center gap-1 px-2 text-xs rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5 HIGH-LEVEL METRICS MATCHING REQUIREMENT 9 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Works */}
          <div
            onClick={() => navigate('/risk-monitor')}
            className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-sm cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Total Works</span>
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {isLoadingData ? (
                  <span className="animate-pulse text-slate-300">...</span>
                ) : apiError ? (
                  <span className="text-rose-500 text-lg">Error</span>
                ) : (
                  kpis.totalCount
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <span>View all in Risk Monitor</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* 2. High / Critical Works */}
          <div
            onClick={() => {
              setRiskLevelFilter(riskLevelFilter === 'HIGH' ? 'ALL' : 'HIGH');
            }}
            className={`p-3.5 sm:p-4 rounded-lg border shadow-xs flex flex-col justify-between cursor-pointer transition ${
              riskLevelFilter === 'HIGH' || riskLevelFilter === 'CRITICAL'
                ? 'bg-rose-50/40 border-rose-400 ring-1 ring-rose-400'
                : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold text-rose-800 uppercase tracking-wider text-[10px]">High / Critical</span>
              <div className="w-7 h-7 rounded bg-rose-50 flex items-center justify-center text-rose-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-700 font-mono tracking-tight">
                {isLoadingData ? (
                  <span className="animate-pulse text-slate-300">...</span>
                ) : apiError ? (
                  <span className="text-rose-500 text-lg">Error</span>
                ) : (
                  kpis.highCriticalCount
                )}
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">
                {kpis.totalCount > 0 ? `${Math.round((kpis.highCriticalCount / kpis.totalCount) * 100)}% of portfolio` : '0%'}
              </div>
            </div>
          </div>

          {/* 3. Delayed Works */}
          <div
            onClick={() => setOnlyDelayed(!onlyDelayed)}
            className={`p-3.5 sm:p-4 rounded-lg border shadow-xs flex flex-col justify-between cursor-pointer transition ${
              onlyDelayed
                ? 'bg-amber-50/40 border-amber-400 ring-1 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold text-amber-800 uppercase tracking-wider text-[10px]">Delayed Works</span>
              <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-800 font-mono tracking-tight">
                {isLoadingData ? (
                  <span className="animate-pulse text-slate-300">...</span>
                ) : apiError ? (
                  <span className="text-rose-500 text-lg">Error</span>
                ) : (
                  kpis.delayedCount
                )}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                {onlyDelayed ? 'Filtered active' : 'Behind schedule'}
              </div>
            </div>
          </div>

          {/* 4. Pending Inspections */}
          <div
            onClick={() => navigate('/inspections')}
            className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold text-indigo-800 uppercase tracking-wider text-[10px]">Pending Inspections</span>
              <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-900 font-mono tracking-tight">
                {isLoadingData ? (
                  <span className="animate-pulse text-slate-300">...</span>
                ) : apiError ? (
                  <span className="text-rose-500 text-lg">Error</span>
                ) : (
                  kpis.pendingInspectionsCount
                )}
              </div>
              <div className="text-[11px] text-indigo-600 mt-0.5 flex items-center gap-1">
                <span>View in Inspections</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* 5. Resolved Works */}
          <div
            onClick={() => navigate('/inspections')}
            className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-sm cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">Resolved Works</span>
              <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-800 font-mono tracking-tight">
                {isLoadingData ? (
                  <span className="animate-pulse text-slate-300">...</span>
                ) : apiError ? (
                  <span className="text-rose-500 text-lg">Error</span>
                ) : (
                  kpis.resolvedCount
                )}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">
                Audit cases closed
              </div>
            </div>
          </div>
        </div>

        {/* RISK DISTRIBUTION & MONITORING TRENDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Risk Distribution Card */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  Risk Distribution
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                  {kpis.totalCount} works
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3.5">
                Click a category below to filter the dashboard.
              </p>

              {/* Stacked bar */}
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 mb-3.5 p-0.5 gap-0.5 border border-slate-200">
                {kpis.totalCount > 0 ? (
                  <>
                    <div
                      style={{ width: `${(riskDistribution.CRITICAL / kpis.totalCount) * 100}%` }}
                      className="bg-red-600 rounded-l-full transition-all"
                    />
                    <div
                      style={{ width: `${(riskDistribution.HIGH / kpis.totalCount) * 100}%` }}
                      className="bg-rose-500 transition-all"
                    />
                    <div
                      style={{ width: `${(riskDistribution.MEDIUM / kpis.totalCount) * 100}%` }}
                      className="bg-amber-500 transition-all"
                    />
                    <div
                      style={{ width: `${(riskDistribution.LOW / kpis.totalCount) * 100}%` }}
                      className="bg-emerald-500 rounded-r-full transition-all"
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-200 rounded-full" />
                )}
              </div>

              {/* Tiers List with Click-to-filter */}
              <div className="space-y-2 text-xs">
                {/* Critical */}
                <div
                  onClick={() => setRiskLevelFilter(riskLevelFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition border ${
                    riskLevelFilter === 'CRITICAL'
                      ? 'bg-red-50 border-red-300 ring-1 ring-red-400'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                    <span className="font-medium text-slate-800">Critical (81–100)</span>
                    {riskLevelFilter === 'CRITICAL' && (
                      <span className="text-[10px] bg-red-200 text-red-900 px-1.5 rounded font-medium">Filtered</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{riskDistribution.CRITICAL}</span>
                </div>

                {/* High */}
                <div
                  onClick={() => setRiskLevelFilter(riskLevelFilter === 'HIGH' ? 'ALL' : 'HIGH')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition border ${
                    riskLevelFilter === 'HIGH'
                      ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-medium text-slate-800">High (61–80)</span>
                    {riskLevelFilter === 'HIGH' && (
                      <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 rounded font-medium">Filtered</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{riskDistribution.HIGH}</span>
                </div>

                {/* Medium */}
                <div
                  onClick={() => setRiskLevelFilter(riskLevelFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition border ${
                    riskLevelFilter === 'MEDIUM'
                      ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-medium text-slate-800">Medium (31–60)</span>
                    {riskLevelFilter === 'MEDIUM' && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 rounded font-medium">Filtered</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{riskDistribution.MEDIUM}</span>
                </div>

                {/* Low */}
                <div
                  onClick={() => setRiskLevelFilter(riskLevelFilter === 'LOW' ? 'ALL' : 'LOW')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition border ${
                    riskLevelFilter === 'LOW'
                      ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium text-slate-800">Low (0–30)</span>
                    {riskLevelFilter === 'LOW' && (
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 rounded font-medium">Filtered</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{riskDistribution.LOW}</span>
                </div>
              </div>
            </div>

            {riskLevelFilter !== 'ALL' && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setRiskLevelFilter('ALL')}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  Clear tier filter
                </button>
              </div>
            )}
          </div>

          {/* Monitoring Trends Chart */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Inspection Trends & Risk Concentration
                </h3>
                <span className="text-xs text-slate-500">Quarterly Aggregation</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="totalInspections" name="Total Inspections" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="highCriticalRisk" name="High/Critical" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anomaliesDetected" name="Anomalies" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* PRIORITIZED WORKS REQUIRING REVIEW */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Top Flagged Works Requiring Review
              </h3>
              <p className="text-xs text-slate-500">
                Prioritized by algorithmic risk score and financial-physical variance.
              </p>
            </div>
            <button
              onClick={() => navigate('/risk-monitor')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>View All ({filteredWorks.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {prioritizedWorks.map((work) => {
              const gap = Math.max(0, work.financialProgress - work.physicalProgress);
              return (
                <div
                  key={work.workId}
                  onClick={() => navigate(`/work/${work.workId}`)}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded cursor-pointer transition"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 hover:underline">
                        {work.workId}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium">{work.sector}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{work.district}, {work.state}</span>
                      {work.actionStatus && work.actionStatus !== 'NO_ACTION' && (
                        <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                          {work.actionStatus.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 line-clamp-1 font-medium">
                      {work.description}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Sanctioned: {formatLakhs(work.sanctionedAmount)}</span>
                      <span>Phys: <strong>{work.physicalProgress}%</strong></span>
                      <span>Fin: <strong>{work.financialProgress}%</strong></span>
                      {gap > 15 && (
                        <span className="text-rose-600 font-semibold">+{gap}% Gap</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <RiskBadge level={work.riskLevel} score={work.riskScore} />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
