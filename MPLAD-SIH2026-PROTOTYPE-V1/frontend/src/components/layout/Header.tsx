import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, CheckCircle2, ChevronRight, X, Building2, Landmark, MapPin, Award, Menu, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from '../ui/Badge';
import { formatLakhs } from '../../utils/formatting';
import { worksService } from '../../services/worksService';
import { StakeholderRole } from '../../types/work';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allWorks, 
    works,
    unreadNotificationCount,
    notifications,
    markNotificationsAsRead,
    role,
    setRole,
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    selectedConstituency,
    setSelectedConstituency,
    selectedOfficer,
    setSelectedOfficer,
    setIsMobileMenuOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search matches
  const searchResults = searchQuery.trim()
    ? works
        .filter((w) => {
          const q = searchQuery.toLowerCase().trim();
          return (
            w.workId.toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.district.toLowerCase().includes(q) ||
            w.block.toLowerCase().includes(q) ||
            w.state.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  const handleSelectWork = (workId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/work/${workId}`);
  };

  // Derive dynamic breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isWorkDetails = pathParts[0] === 'work' && pathParts.length >= 2;
  const isExplanation = isWorkDetails && pathParts[2] === 'explanation';
  const currentWorkId = isWorkDetails ? pathParts[1] : null;

  const states = Array.from(new Set(allWorks.map((w) => w.state))).filter(Boolean).sort();
  const districts = Array.from(new Set(allWorks.map((w) => w.district))).filter(Boolean).sort();
  const constituencies = Array.from(new Set(allWorks.map((w) => w.constituency))).filter(Boolean).sort();

  return (
    <header className="bg-white border-b border-slate-200 flex flex-col">
      {/* Top Utility Bar for Role Selection */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-medium hidden sm:inline-block shrink-0">Viewing as:</span>
          {/* Role selector pill group */}
          <div className="flex items-center bg-white p-0.5 rounded border border-slate-200 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setRole('MINISTRY')}
              className={`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 ${
                role === 'MINISTRY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="National Ministry Perspective"
            >
              <Landmark className="w-3 h-3" />
              <span className="hidden sm:inline-block">Ministry</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('STATE AUTHORITY')}
              className={`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 ${
                role === 'STATE AUTHORITY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="State Nodal Authority View"
            >
              <Building2 className="w-3 h-3" />
              <span className="hidden sm:inline-block">State</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('DISTRICT AUTHORITY')}
              className={`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 ${
                role === 'DISTRICT AUTHORITY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="District Implementing Authority View"
            >
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline-block">District</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('MP')}
              className={`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 ${
                role === 'MP'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Member of Parliament Constituency View"
            >
              <Award className="w-3 h-3" />
              <span className="hidden sm:inline-block">MP</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('INSPECTION OFFICER')}
              className={`px-2 py-1 rounded font-medium transition text-[11px] flex items-center gap-1 ${
                role === 'INSPECTION OFFICER'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Inspection Officer View"
            >
              <User className="w-3 h-3" />
              <span className="hidden sm:inline-block">Inspector</span>
            </button>
          </div>

          {/* Sub-scope selectors based on selected role */}
          {role === 'STATE AUTHORITY' && (
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 shadow-sm shrink-0"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          {role === 'DISTRICT AUTHORITY' && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 shadow-sm shrink-0"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {role === 'MP' && (
            <select
              value={selectedConstituency}
              onChange={(e) => setSelectedConstituency(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 shadow-sm shrink-0"
            >
              {constituencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          
          {role === 'INSPECTION OFFICER' && (
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="h-7 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 shadow-sm shrink-0"
            >
              {['Inspector A. Sharma', 'Inspector B. Singh', 'Inspector C. Verma'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Header Area */}
      <div className="px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Mobile Top Row: Hamburger + Title + Profile */}
        <div className="flex items-center justify-between md:hidden w-full gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 rounded-md text-slate-600 hover:bg-slate-100 md:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none">
                Decision Support
              </span>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight truncate leading-tight mt-0.5">
                {title || 'MPLADS AI Risk'}
              </h1>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-sm shrink-0">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Desktop Clean Page Header & Breadcrumbs */}
        <div className="hidden md:flex min-w-0 flex-1 flex-col">
          {/* Clean Breadcrumbs Hierarchy */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1">
            <button
              onClick={() => navigate('/')}
              className="hover:text-slate-800 transition-colors"
            >
              Overview
            </button>
            {location.pathname !== '/' && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                {location.pathname.startsWith('/risk-monitor') && (
                  <span className="text-slate-700 font-medium truncate">Risk Monitor</span>
                )}
                {location.pathname.startsWith('/alerts') && (
                  <span className="text-slate-700 font-medium truncate">Review Alerts</span>
                )}
                {location.pathname.startsWith('/inspections') && (
                  <span className="text-slate-700 font-medium truncate">Inspection Worklist</span>
                )}
                {location.pathname.startsWith('/data-management') && (
                  <span className="text-slate-700 font-medium truncate">Data Management</span>
                )}
                {location.pathname.startsWith('/audit-trail') && (
                  <span className="text-slate-700 font-medium truncate">Audit Trail</span>
                )}
                {isWorkDetails && (
                  <>
                    <button
                      onClick={() => navigate('/risk-monitor')}
                      className="hover:text-slate-800 transition-colors"
                    >
                      Risk Monitor
                    </button>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <button
                      onClick={() => navigate(`/work/${currentWorkId}`)}
                      className={`hover:text-slate-800 transition-colors truncate max-w-[140px] ${
                        !isExplanation ? 'text-slate-900 font-medium' : ''
                      }`}
                    >
                      {currentWorkId}
                    </button>
                    {isExplanation && (
                      <>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-900 font-medium truncate">Why Flagged</span>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate leading-tight">
              {title || 'MPLADS AI Risk Intelligence'}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 self-stretch md:self-end lg:self-auto w-full md:w-auto mt-2 md:mt-0">
          {/* Global Search Input */}
          <div className="relative flex-1 md:flex-none" ref={searchRef}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search works..."
                className="w-full sm:w-56 lg:w-64 pl-9 pr-8 py-1.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute right-0 mt-1.5 w-full sm:w-80 md:w-96 bg-white rounded-md border border-slate-200 shadow-xl py-1 z-50 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  Matching Works ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center">
                    No matching work records found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  searchResults.map((work) => (
                    <button
                      key={work.workId}
                      onClick={() => handleSelectWork(work.workId)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-start justify-between gap-3 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {work.workId}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            • {work.district}, {work.state}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 truncate mt-0.5">
                          {work.description}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                          Sanctioned: {formatLakhs(work.sanctionedAmount)} • Exp: {formatLakhs(work.expenditure)}
                        </div>
                      </div>
                      <RiskBadge level={work.riskLevel} score={work.riskScore} className="shrink-0 mt-0.5" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Prominent Data Management / Upload Entry Point */}
          <button
            onClick={() => navigate('/data-management')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
            title="Prototype / Demonstration Upload"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Upload Data</span>
          </button>

          {/* Notification Indicator */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                if (unreadNotificationCount > 0) {
                  markNotificationsAsRead();
                }
              }}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
              title="Review Notifications"
              aria-label="Review Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-md border border-slate-200 shadow-xl py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-800">
                    Notifications
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Real-time</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500 text-center">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((note, idx) => (
                      <div key={idx} className="px-4 py-3 text-sm text-slate-700 flex items-start gap-2 hover:bg-slate-50 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{note}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Officer Profile */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-slate-800 leading-none">
                {role === 'MINISTRY'
                  ? 'Ministry'
                  : role === 'STATE AUTHORITY'
                  ? 'State Nodal'
                  : role === 'DISTRICT AUTHORITY'
                  ? 'District Auth'
                  : role === 'INSPECTION OFFICER'
                  ? 'Inspector'
                  : 'MP Office'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">
                {role === 'MINISTRY'
                    ? 'Nodal Officer'
                    : role === 'STATE AUTHORITY'
                    ? selectedState
                    : role === 'DISTRICT AUTHORITY'
                    ? selectedDistrict
                    : role === 'INSPECTION OFFICER'
                    ? selectedOfficer
                    : selectedConstituency}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-sm">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
