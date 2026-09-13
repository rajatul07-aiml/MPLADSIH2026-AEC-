import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Bell,
  ClipboardCheck,
  Database,
  History,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { alerts, isMobileMenuOpen, setIsMobileMenuOpen, isSidebarCollapsed, toggleSidebar } = useApp();
  const location = useLocation();

  const openAlertsCount = alerts.filter((a) => a.status === 'Open').length;

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, setIsMobileMenuOpen]);

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        {
          name: 'Dashboard',
          path: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        {
          name: 'Risk Monitor',
          path: '/risk-monitor',
          icon: ShieldAlert,
        },
        {
          name: 'Alerts',
          path: '/alerts',
          icon: Bell,
          badge: openAlertsCount > 0 ? openAlertsCount : undefined,
        },
      ],
    },
    {
      title: 'WORKFLOW',
      items: [
        {
          name: 'Inspections',
          path: '/inspections',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      title: 'RECORDS',
      items: [
        {
          name: 'Data Management',
          path: '/data-management',
          icon: Database,
        },
        {
          name: 'Audit Trail',
          path: '/audit-trail',
          icon: History,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] text-slate-200 flex flex-col shrink-0 border-r border-slate-800/80 h-screen transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isSidebarCollapsed ? 'md:w-[68px]' : 'md:w-64'}`}
      >
        {/* Brand Header: Focused on Product Identity (No upper Team Aarambh duplicate) */}
        <div className={`p-3.5 border-b border-slate-800/80 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-indigo-900/80 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-xs tracking-wider font-mono shadow-xs shrink-0">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-semibold text-white tracking-tight text-sm leading-tight truncate">
                  MPLADS AI RISK
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Decision Intelligence
                </div>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Structured Navigation Hierarchy */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto no-scrollbar">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isSidebarCollapsed ? (
                <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.title}
                </div>
              ) : (
                <div className="my-1.5 mx-auto w-6 border-t border-slate-800" />
              )}

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                    } rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/50'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                    <item.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0" />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>

                  {!isSidebarCollapsed && item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}

                  {/* Dot indicator when collapsed */}
                  {isSidebarCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                  )}

                  {/* Floating Hover Tooltip for Collapsed Sidebar */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700/80 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.badge !== undefined && (
                        <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-amber-500/30 text-amber-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Compact Verification Notice */}
        {!isSidebarCollapsed ? (
          <div className="p-2.5 mx-2.5 mb-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 leading-snug">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-0.5">
              <Info className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Verification Notice</span>
            </div>
            AI outputs assist human verification; all decisions require competent authority sign-off.
          </div>
        ) : (
          <div
            className="group relative flex justify-center p-2 mb-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Verification Notice: AI outputs assist human verification; all decisions require competent authority sign-off."
          >
            <Info className="w-4 h-4" />
            <div className="absolute left-full bottom-0 ml-3 w-56 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 leading-snug">
              <strong>Verification Notice:</strong> AI outputs assist human verification; all decisions require competent authority sign-off.
            </div>
          </div>
        )}

        {/* LOWER LEFT SIDEBAR FOOTER: TEAM AARAMBH IDENTITY */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0b1120]">
          {!isSidebarCollapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                  TEAM AARAMBH
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                  SIH26102
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                MPLADS AI RISK INTELLIGENCE
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>Prototype Ready</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider">MoSPI Decision Core</span>
              </div>
            </div>
          ) : (
            <div
              className="group relative flex flex-col items-center justify-center cursor-pointer py-1"
              onClick={toggleSidebar}
              title="TEAM AARAMBH • SIH26102"
            >
              <div className="w-7 h-7 rounded bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-[10px] font-mono shadow-xs">
                TA
              </div>
              <div className="absolute left-full bottom-0 ml-3 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
                <div className="font-bold text-indigo-400 font-mono">TEAM AARAMBH</div>
                <div className="text-[10px] text-slate-400">MPLADS AI RISK INTELLIGENCE</div>
                <div className="text-[10px] text-slate-500 font-mono">SIH26102 • Prototype</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
