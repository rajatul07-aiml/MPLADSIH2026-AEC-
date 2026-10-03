import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { RiskBadge, Badge } from '../components/ui/Badge';
import { formatLakhs, formatPercent } from '../utils/formatting';
import { worksService } from '../services/worksService';
import { RiskLevel, WorkStatus } from '../types/work';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  HelpCircle,
  BellPlus,
  AlertTriangle,
  Eye,
  Sparkles,
  ClipboardCheck,
  Download,
  Plus,
} from 'lucide-react';

export const RiskMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { works, showToast, openCreateAlertModal } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | 'ALL'>('ALL');
  const [financialYearFilter, setFinancialYearFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Derived filter options
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);

  useEffect(() => {
    async function loadMetadata() {
      const [years, states, sectors] = await Promise.all([
        worksService.getAvailableFinancialYears(),
        worksService.getAvailableStates(),
        worksService.getAvailableSectors()
      ]);
      setAvailableYears(years || []);
      setAvailableStates(states || []);
      setAvailableSectors(sectors || []);
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    async function loadDistricts() {
      const districts = await worksService.getDistrictsForState(stateFilter);
      setAvailableDistricts(districts || []);
    }
    loadDistricts();
  }, [stateFilter]);

  // Scoped works matching search and non-riskLevel filters (used for dynamic quick pills count)
  const scopedWorks = useMemo(() => {
    return works.filter((work) => {
      // Search: Work ID, Description, Location
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesId = work.workId.toLowerCase().includes(q);
        const matchesDesc = work.description.toLowerCase().includes(q);
        const matchesLoc = `${work.block} ${work.district} ${work.state}`.toLowerCase().includes(q);
        if (!matchesId && !matchesDesc && !matchesLoc) {
          return false;
        }
      }

      if (financialYearFilter !== 'ALL' && work.financialYear !== financialYearFilter) return false;
      if (stateFilter !== 'ALL' && work.state !== stateFilter) return false;
      if (districtFilter !== 'ALL' && work.district !== districtFilter) return false;
      if (sectorFilter !== 'ALL' && work.sector !== sectorFilter) return false;
      if (statusFilter !== 'ALL' && work.status !== statusFilter) return false;
      if (signalFilter !== 'ALL' && !work.riskSignals.some((s) => s.toLowerCase().includes(signalFilter.toLowerCase()))) return false;

      return true;
    });
  }, [works, searchTerm, financialYearFilter, stateFilter, districtFilter, sectorFilter, statusFilter, signalFilter]);

  // Dynamic counts for quick pills based on current active scope
  const riskCounts = useMemo(() => {
    return {
      ALL: scopedWorks.length,
      CRITICAL: scopedWorks.filter((w) => w.riskLevel === 'CRITICAL').length,
      HIGH: scopedWorks.filter((w) => w.riskLevel === 'HIGH').length,
      MEDIUM: scopedWorks.filter((w) => w.riskLevel === 'MEDIUM').length,
      LOW: scopedWorks.filter((w) => w.riskLevel === 'LOW').length,
    };
  }, [scopedWorks]);

  // Final filtered list applying the risk level filter
  const filteredWorks = useMemo(() => {
    if (riskLevel === 'ALL') return scopedWorks;
    return scopedWorks.filter((w) => w.riskLevel === riskLevel);
  }, [scopedWorks, riskLevel]);

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedWorks = useMemo(() => {
    const startIndex = (safePage - 1) * rowsPerPage;
    return filteredWorks.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredWorks, safePage]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRiskLevel('ALL');
    setFinancialYearFilter('ALL');
    setStateFilter('ALL');
    setDistrictFilter('ALL');
    setSectorFilter('ALL');
    setStatusFilter('ALL');
    setSignalFilter('ALL');
    setCurrentPage(1);
    showToast('Filters reset to defaults.', 'info');
  };

  const handleExportCSV = () => {
    if (filteredWorks.length === 0) {
      showToast('No works available to export with current filters.', 'error');
      return;
    }

    try {
      const headers = [
        'Work ID', 'Work Name', 'Description', 'Financial Year', 'State',
        'District', 'Block', 'Sector', 'Work Type',
        'Implementing Agency', 'Sanction Date', 'Status',
        'Sanctioned Amount', 'Released Amount', 'Expenditure',
        'Physical Progress %', 'Financial Progress %', 'Delay Days',
        'Risk Level', 'Risk Score', 'Risk Signals'
      ];

      const csvData = filteredWorks.map(w => {
        return [
          w.workId,
          w.workName ? `"${w.workName.replace(/"/g, '""')}"` : '',
          w.description ? `"${w.description.replace(/"/g, '""')}"` : '',
          w.financialYear,
          w.state ? `"${w.state}"` : '',
          w.district ? `"${w.district}"` : '',
          w.block ? `"${w.block}"` : '',
          w.sector ? `"${w.sector}"` : '',
          w.workType ? `"${w.workType}"` : '',
          w.implementingAgency ? `"${w.implementingAgency.replace(/"/g, '""')}"` : '',
          w.sanctionDate,
          w.status,
          w.sanctionedAmount,
          w.releasedAmount,
          w.expenditure,
          w.physicalProgress,
          w.financialProgress,
          w.delayDays,
          w.riskLevel,
          w.riskScore,
          `"${w.riskSignals.join('; ')}"`
        ].join(',');
      });

      const csvString = [headers.join(','), ...csvData].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'filtered_works_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('CSV export successful.', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export CSV.', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title="Risk Monitor"
        subtitle="Prioritize works requiring institutional monitoring, anomaly investigation and physical verification."
      />

      <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* TOP CONTROLS & FILTERS */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3.5">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                Advanced Filtering
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/data-management/new')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition font-medium shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Work</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition font-medium shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Row 1: Search, Quick Risk Pills, Reset */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Field */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Work ID, title, block, or district..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              />
            </div>

            {/* Quick Risk Category Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  setRiskLevel('ALL');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition shrink-0 ${
                  riskLevel === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({riskCounts.ALL})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRiskLevel('CRITICAL');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  riskLevel === 'CRITICAL'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Critical ({riskCounts.CRITICAL})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRiskLevel('HIGH');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  riskLevel === 'HIGH'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                High ({riskCounts.HIGH})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRiskLevel('MEDIUM');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  riskLevel === 'MEDIUM'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Medium ({riskCounts.MEDIUM})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRiskLevel('LOW');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  riskLevel === 'LOW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Low ({riskCounts.LOW})
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-md transition font-medium shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Row 2: Secondary Dropdown Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
            {/* State */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                State
              </label>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrictFilter('ALL');
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="ALL">All States ({availableStates.length})</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                District
              </label>
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="ALL">All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Year */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Financial Year
              </label>
              <select
                value={financialYearFilter}
                onChange={(e) => {
                  setFinancialYearFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 font-medium"
              >
                <option value="ALL">All Financial Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    FY {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Risk Level
              </label>
              <select
                value={riskLevel}
                onChange={(e) => {
                  setRiskLevel(e.target.value as RiskLevel | 'ALL');
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical (81–100)</option>
                <option value="HIGH">High (61–80)</option>
                <option value="MEDIUM">Medium (31–60)</option>
                <option value="LOW">Low (0–30)</option>
              </select>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Sector
              </label>
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="ALL">All Sectors</option>
                {availableSectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Work Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNDER PROGRESS">Under Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
                <option value="NOT STARTED">Not Started</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>

            {/* Risk Signal */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Anomaly Signal
              </label>
              <select
                value={signalFilter}
                onChange={(e) => {
                  setSignalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                <option value="ALL">All Signals</option>
                <option value="Mismatch">Financial-Physical Mismatch</option>
                <option value="Cost Deviation">Cost Deviation Outlier</option>
                <option value="Delay">Delay Schedule Risk</option>
                <option value="Payment">Payment Anomaly</option>
                <option value="Similar">Potential Duplicate/Similar</option>
                <option value="Historical">Historical Pattern</option>
              </select>
            </div>
          </div>
        </div>

        {/* RESULTS SUMMARY BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 px-1 gap-1">
          <div>
            Showing <span className="font-semibold text-slate-900">{filteredWorks.length}</span> work records matching criteria
          </div>
          <div className="text-[11px] text-slate-400">
            Click any row to view in-depth details, or use action buttons for AI explanation and review alert
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[1240px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">Risk Index</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Work ID</th>
                  <th className="py-3 px-3.5 min-w-[240px]">Work Title & Implementing Agency</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Location</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Sector</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Sanctioned / Exp</th>
                  <th className="py-3 px-3.5 min-w-[160px]">Progress & Gap</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Schedule</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Action Status</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedWorks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500">
                      No works found matching the active filter combination.
                    </td>
                  </tr>
                ) : (
                  paginatedWorks.map((work) => {
                    const primarySignal = work.riskSignals[0] || 'Routine Monitoring';
                    const gap = Math.max(0, work.financialProgress - work.physicalProgress);
                    const hasSimilar = Boolean((work.similarWorks && work.similarWorks.length > 0) || work.similarWork);

                    return (
                      <tr
                        key={work.workId}
                        onClick={() => navigate(`/work/${work.workId}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        {/* Risk Index: Score + Badge */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900 w-7">
                              {work.riskScore}
                            </span>
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
                              {work.riskLevel}
                            </Badge>
                          </div>
                        </td>

                        {/* Work ID */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap font-mono">
                          <div className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                            {work.workId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            FY {work.financialYear}
                          </div>
                        </td>

                        {/* Title & Implementing Agency */}
                        <td className="py-3.5 px-3.5 max-w-sm">
                          <div className="truncate text-slate-900 font-semibold leading-snug">
                            {work.description}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                            <span className="truncate">{work.implementingAgency}</span>
                            {hasSimilar && (
                              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-semibold shrink-0">
                                Similar Work
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="text-slate-900 font-medium">{work.block}, {work.district}</div>
                          <div className="text-[11px] text-slate-500">{work.state}</div>
                        </td>

                        {/* Sector */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{work.sector}</div>
                          <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-semibold border ${
                            work.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            work.status === 'UNDER PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            work.status === 'DELAYED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {work.status === 'UNDER PROGRESS' ? 'Under Progress' :
                             work.status === 'COMPLETED' ? 'Completed' :
                             work.status === 'DELAYED' ? 'Delayed' :
                             work.status === 'NOT STARTED' ? 'Not Started' :
                             work.status === 'DISCONTINUED' ? 'Discontinued' : work.status}
                          </span>
                        </td>

                        {/* Financials: Sanctioned & Expenditure */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-right font-mono">
                          <div className="text-slate-900 font-semibold">{formatLakhs(work.sanctionedAmount)}</div>
                          <div className="text-[11px] text-slate-500">Exp: {formatLakhs(work.expenditure)}</div>
                        </td>

                        {/* Progress: Dual Bar & Gap Indicator */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="text-emerald-700 font-semibold">Phys: {work.physicalProgress}%</span>
                            <span className="text-slate-700 font-medium">Fin: {work.financialProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full rounded-l-full"
                              style={{ width: `${Math.min(100, work.physicalProgress)}%` }}
                            />
                          </div>
                          {gap >= 15 ? (
                            <div className="text-[10px] text-rose-700 font-semibold mt-1 flex items-center gap-1">
                              <span className="px-1 py-0.2 bg-rose-50 border border-rose-200 rounded">+{gap}% Gap</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 mt-1">Balanced Progress</div>
                          )}
                        </td>

                        {/* Schedule Delay */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-right font-mono">
                          {work.delayDays > 0 ? (
                            <span className="text-rose-700 font-bold">
                              +{work.delayDays}d
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-[11px] font-sans font-medium">On Schedule</span>
                          )}
                        </td>

                        {/* Action Status */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            work.actionStatus === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            work.actionStatus === 'ESCALATED' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            work.actionStatus === 'REPORT_SUBMITTED' || work.actionStatus === 'AUTHORITY_REVIEW' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            work.actionStatus === 'INSPECTION_REQUESTED' || work.actionStatus === 'OFFICER_ASSIGNED' || work.actionStatus === 'INSPECTION_IN_PROGRESS' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {work.actionStatus ? work.actionStatus.replace(/_/g, ' ') : 'NO ACTION'}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {primarySignal}
                          </div>
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/work/${work.workId}`)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition shadow-xs flex items-center gap-1"
                              title="View complete work details"
                            >
                              <span>Details</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => navigate(`/work/${work.workId}/explanation`)}
                              title="Why is this work flagged? View AI risk analysis"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition border border-slate-200 flex items-center gap-1"
                            >
                              <HelpCircle className="w-3 h-3 text-indigo-600" />
                              <span className="hidden xl:inline">Why</span>
                            </button>
                            <button
                              onClick={() => openCreateAlertModal(work.workId)}
                              title="Create Review Alert"
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition border border-slate-200"
                            >
                              <BellPlus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {filteredWorks.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(safePage * rowsPerPage, filteredWorks.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{filteredWorks.length}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono px-2">
                Page {safePage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
