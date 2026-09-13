import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Database, Plus } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      <Header
        title="Data Management"
        subtitle="Manage MPLADS works data and add new records for risk analysis."
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">New Work Entry</h3>
            <p className="text-sm text-slate-500 mt-1">
              Submit a new MPLADS work for AI-powered risk analysis, anomaly detection, and similarity checking.
            </p>
          </div>
          <button
            onClick={() => navigate('/data-management/new')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Work
          </button>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
          <Database className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-800">
              Backend Integration Active
            </span>
            <p className="leading-relaxed">
              This system is connected to the Live AI Risk Intelligence backend via <strong>FastAPI</strong>.
              Data automatically syncs with the central pipeline. Submitting a new work will persist it to the backend and update ML scores.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
